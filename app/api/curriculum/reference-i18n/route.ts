import { NextResponse } from "next/server";
import { requireRoleApi } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/settings";
import { REFERENCE } from "@/lib/curriculum/reference";
import { LANGUAGES } from "@/lib/curriculum/translate";
import { complete } from "@/lib/llm";

// The Java reference, translated.
//
// SEPARATE FROM THE LESSONS ON PURPOSE. reference.ts is static TypeScript, not
// a Lesson row, so flowI18n has nowhere to put it. It also changes far less
// often than a lesson does, so it is translated once per language and stored
// whole in Setting rather than per row.
//
// Entries are keyed "sectionId::entryName". The CODE is never sent — only the
// one-line description. A student reading a reference needs `loot.get(0)`
// unchanged; it is the sentence next to it they cannot read.

const KEY = (locale: string) => `reference-i18n:${locale}`;

export async function GET(req: Request) {
  const locale = new URL(req.url).searchParams.get("locale") || "";
  if (!locale || !LANGUAGES[locale]) return NextResponse.json({ entries: {} });
  const entries = await getSetting<Record<string, string>>(KEY(locale), {});
  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const me = await requireRoleApi("ADMIN");
  if (me instanceof NextResponse) return me;
  const { locale } = await req.json();
  const language = LANGUAGES[String(locale || "")]?.name;
  if (!language) return NextResponse.json({ ok: false, error: "unsupported locale" });

  const items: { id: string; text: string }[] = [];
  for (const sec of REFERENCE) {
    items.push({ id: `#${sec.id}`, text: sec.title });
    for (const e of sec.entries) items.push({ id: `${sec.id}::${e.name}`, text: e.note });
  }

  try {
    const r = await complete<{ items: { id: string; text: string }[] }>(
      {
        feature: "generate",
        system: `You translate the descriptions in a Java reference into ${language}, for a 15-year-old in their first programming course.

- Translate the DESCRIPTION only. Every id you are given already has its code sitting beside it, unchanged.
- Keep technical vocabulary in English with the ${language} in brackets the first time: "array (数组)". Words in that group: class, object, method, parameter, return, variable, array, index, element, list, loop, key, value, String, int, double, char, boolean.
- Never translate an identifier, a method name or a keyword: println, readLine, .length, size(), get(i), ArrayList, HashMap, null, true, false. Leave them exactly as written, with no brackets.
- Short and plain. These are one-line descriptions, not paragraphs.

You will receive: {"items":[{"id":"...","text":"..."}]}
Return EXACTLY: {"items":[{"id":"...","text":"<the ${language} text>"}]}
Copy every id back CHARACTER FOR CHARACTER. Return one item for every item you received.`,
        messages: [{ role: "user", content: JSON.stringify({ items }) }],
        json: true,
        maxTokens: 12000,
        reasoningEffort: "low",
        model: "gemini-flash-latest",
      },
      { userId: me.id }
    );

    const known = new Set(items.map((i) => i.id));
    const out: Record<string, string> = {};
    for (const it of Array.isArray(r.data?.items) ? r.data!.items : []) {
      if (it && typeof it.id === "string" && typeof it.text === "string" && it.text.trim() && known.has(it.id)) {
        out[it.id] = it.text.trim();
      }
    }
    if (!Object.keys(out).length) {
      return NextResponse.json({
        ok: false,
        error: r.degraded === "budget"
          ? "Today's AI budget is spent — raise the cap on the Usage page."
          : "the translator returned nothing usable",
      });
    }
    await setSetting(KEY(locale), out);
    return NextResponse.json({ ok: true, translated: Object.keys(out).length, of: items.length, model: r.model });
  } catch (e) {
    const msg = (e as Error).message.replace(/\s+/g, " ").trim();
    return NextResponse.json({ ok: false, error: msg.length > 240 ? `${msg.slice(0, 120)} … ${msg.slice(-160)}` : msg });
  }
}
