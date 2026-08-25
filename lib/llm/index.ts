import "server-only";
import type { CompleteArgs, Feature, Lane, LLMResult, Provider } from "./types";
import { callProvider } from "./providers";
import { safeParseJson } from "./json";
import { getProviderConfig, getBudgetConfig } from "../settings";
import { prisma } from "../db";

// USD per 1M tokens [input, output]. Prices churn — mature this into a
// DB-editable table (Admin → Settings) so you never redeploy for a price change.
const PRICES: Record<string, [number, number]> = {
  stub: [0, 0],
  "gemini-2.0-flash": [0, 0], // free tier
  "gemini-1.5-flash": [0, 0],
  // Vertex (paid, but you're on GCP credits) — approximate list prices.
  "gemini-2.5-pro": [1.25, 10],
  "gemini-2.5-flash": [0.3, 2.5],
  "gemini-1.5-pro": [1.25, 5],
  "llama-3.3-70b-versatile": [0, 0], // groq free
  "claude-haiku-4-5": [1, 5],
  "claude-sonnet-4-6": [3, 15],
  "claude-opus-4-8": [15, 75],
};

// An unknown model must NOT be free.
//
// costOf() is the only thing feeding the daily spend cap. A model missing from
// PRICES used to fall back to [0, 0], which pinned recorded spend at exactly
// $0.00 no matter how many calls ran — so overDailyBudget() never returned
// true and the kill-switch did not exist. That is precisely what happened in
// production: the configured model is gemini-3.1-pro-preview, which is not in
// the table, and every logged call cost $0.
//
// So fail CLOSED: price an unfamiliar model at the most expensive tier here, and
// say so loudly. Over-charging makes the cap trip early (degrading to the stub,
// which is recoverable); under-charging removes the ceiling entirely.
const FALLBACK_PRICE: [number, number] = [15, 75];
const unpricedWarned = new Set<string>();

function costOf(model: string, input: number, output: number): number {
  let price = PRICES[model];
  if (!price) {
    if (!unpricedWarned.has(model)) {
      unpricedWarned.add(model);
      console.error(
        `[llm] no price listed for "${model}" — charging the fallback $${FALLBACK_PRICE[0]}/$${FALLBACK_PRICE[1]} per 1M tokens so the daily cap still bounds it. Add the real rate to PRICES in lib/llm/index.ts.`
      );
    }
    price = FALLBACK_PRICE;
  }
  const [pi, po] = price;
  return (input * pi + output * po) / 1e6;
}

/** Models with no listed price, for the admin cost panel to flag. */
export function unpricedModels(): string[] {
  return [...unpricedWarned];
}

// Global kill-switch: per-user/IP rate limits bound one actor, not total spend
// across many (cheap-to-mint, anonymous) sessions. Checked once per call —
// worst case that's fine, a few calls of slop around the cap is not a leak.
let budgetCache: { day: string; capUsd: number; spent: number; checkedAt: number } | null = null;
async function overDailyBudget(): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const fresh = budgetCache && budgetCache.day === day && Date.now() - budgetCache.checkedAt < 30_000;
  if (!fresh) {
    const [cfg, sum] = await Promise.all([
      getBudgetConfig(),
      prisma.aiCall.aggregate({ _sum: { cost: true }, where: { createdAt: { gte: new Date(day + "T00:00:00.000Z") } } }),
    ]);
    budgetCache = { day, capUsd: cfg.dailyCapUsd, spent: sum._sum.cost || 0, checkedAt: Date.now() };
  }
  return budgetCache!.spent >= budgetCache!.capUsd;
}

function isRetryable(err: unknown): boolean {
  const status = (err as any)?.status;
  return status === 429 || (status >= 500 && status < 600) || status === undefined;
}

/**
 * The single chokepoint for every AI call. Resolves the configured lanes for a
 * feature, tries them in order (auto-failover on rate-limit / 5xx), parses JSON
 * defensively, normalizes cost, and logs the call for the teacher dashboard.
 */
export async function complete<T = unknown>(
  args: CompleteArgs,
  ctx?: { userId?: string }
): Promise<LLMResult<T>> {
  let lanes = await resolveLanes(args.feature);
  // WHY the stub is serving matters to the caller. "Degraded because today's
  // budget is spent" and "degraded because nobody configured a key" are the
  // same symptom and completely different fixes, and reporting the second for
  // the first sent the owner to a settings page to add a key that was already
  // there.
  let degraded: "budget" | null = null;
  if (lanes.some((l) => l.provider !== "stub") && (await overDailyBudget())) {
    lanes = lanes.filter((l) => l.provider === "stub"); // degrade, never hard-fail
    degraded = "budget";
  }
  let lastErr: unknown;

  for (const lane of lanes) {
    try {
      const raw = await callProvider(lane, args);
      const data = args.json ? safeParseJson<T>(raw.text) : undefined;
      const cost = costOf(lane.model, raw.input, raw.output);

      if (lane.provider === "stub" && lanes.some((l) => l.provider !== "stub")) {
        console.error(`[llm] "${args.feature}" served by the OFFLINE STUB — every configured provider failed. Students are getting canned responses.`);
      }

      // fire-and-forget usage log
      logCall(args.feature, lane, raw.input, raw.output, cost, ctx?.userId).catch(() => {});

      return {
        text: raw.text,
        data,
        usage: { input: raw.input, output: raw.output },
        cost,
        provider: lane.provider,
        model: lane.model,
        degraded: lane.provider === "stub" ? degraded ?? "unconfigured" : null,
      };
    } catch (err) {
      lastErr = err;
      // A configured paid lane failing used to be completely silent: the loop
      // fell through to the offline stub, the caller got canned text, and
      // nothing anywhere said the real provider was down. That turned a broken
      // API key into "the feature mysteriously does nothing".
      console.error(`[llm] lane ${lane.provider}/${lane.model} failed for "${args.feature}":`, (err as Error).message?.slice(0, 160));
      if (!isRetryable(err)) break; // auth/validation errors: don't waste other lanes
    }
  }
  throw lastErr ?? new Error("no LLM lanes configured");
}

// Build the ordered list of lanes to try for a feature: every configured key is
// a lane, tried in order and rotated on rate-limit/error (that's how multiple
// keys extend your daily quota). A per-feature model override applies to each.
// Always ends with the offline stub so the app never hard-fails.
async function resolveLanes(feature: Feature): Promise<Lane[]> {
  const cfg = await getProviderConfig();
  const lanes: Lane[] = [];
  for (const k of cfg.keys) {
    if (k.provider !== "stub" && k.apiKey) {
      lanes.push({ provider: k.provider, apiKey: k.apiKey, model: cfg.models[feature] || k.model, baseUrl: k.baseUrl, region: k.region });
    }
  }
  lanes.push({ provider: "stub" as Provider, model: "stub" });
  return lanes;
}

async function logCall(
  feature: Feature,
  lane: Lane,
  input: number,
  output: number,
  cost: number,
  userId?: string
) {
  await prisma.aiCall.create({
    data: { feature, provider: lane.provider, model: lane.model, inTokens: input, outTokens: output, cost, userId },
  });
}

export type { CompleteArgs, LLMResult, Feature } from "./types";
