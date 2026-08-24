import "server-only";
import { NextResponse } from "next/server";
import { verifyPikaToken, bearerFrom, PikaTokenError, type PikaClaims } from "@/lib/pika/token";
import { resolvePikaStudent } from "@/lib/pika/identity";

// One entry point for every /api/pika route: origin check, token check,
// identity resolution.

/**
 * Exact origins only, never a wildcard on a credentialed policy. Pal's rule
 * (`PAL_ALLOWED_WIDGET_ORIGINS`) and the reason for it are the same: the widget
 * runs on Pika's page and carries a bearer token, so any origin we echo back is
 * an origin allowed to read a student's record.
 */
function allowedOrigins(): string[] {
  return (process.env.CLASSOS_ALLOWED_WIDGET_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !allowedOrigins().includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

export function pikaPreflight(req: Request) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);
  // No echo means the origin is not on the list. Say no without explaining.
  if (!Object.keys(headers).length) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers });
}

export type PikaContext = { userId: string; claims: PikaClaims; headers: Record<string, string> };

/**
 * Returns a context, or a NextResponse to return as-is.
 *
 * ORDER MATTERS: the origin is checked BEFORE the token is verified, exactly as
 * Pal does it. A rejected origin should never reach signature verification —
 * that turns this endpoint into an oracle for testing forged tokens from
 * anywhere.
 */
export async function requirePikaStudent(req: Request): Promise<PikaContext | NextResponse> {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);
  if (origin && !Object.keys(headers).length) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const token = bearerFrom(req);
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });

  let claims: PikaClaims;
  try {
    claims = verifyPikaToken(token);
  } catch (e) {
    // Log the reason, return none of it.
    console.warn("[pika] token rejected:", e instanceof PikaTokenError ? e.message : e);
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });
  }

  // Pika owns identity, so this only ever finds or creates the row Progress
  // hangs off. There is no conflict case left to handle.
  const { userId } = await resolvePikaStudent(claims);
  return { userId, claims, headers };
}
