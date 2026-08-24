/**
 * Scope drawn as boxes, one per variable, beside the code.
 *
 * WAS: a 7px hairline in a lane, which reads as a bracket or a scrollbar, not
 * as a region. The owner's note was exact — lines are bad, use colour-coded
 * boxes. A box has an inside and an outside, which is the whole idea of scope:
 * the variable exists on the lines the box covers and nowhere else.
 *
 * Each box is a filled, bordered rectangle with the variable's name in a solid
 * header chip, colour-coded by kind, with a legend under the diagram naming
 * what each colour means. Shared by the lesson player and the notes page so
 * the two can never drift apart.
 */

export type Scope = { name: string; from: number; to: number; kind?: string };

const KINDS: Record<string, string> = {
  instance: "instance variable",
  param: "parameter",
  local: "local variable",
  loop: "loop variable",
};

export default function ScopeDiagram({ code, scopes }: { code: string; scopes: Scope[] }) {
  const lines = code.split("\n");
  // One legend entry per kind actually used, in the order the scopes appear.
  const kinds: string[] = [];
  for (const s of scopes) {
    const k = s.kind || "local";
    if (!kinds.includes(k)) kinds.push(k);
  }

  return (
    <div className="scopewrap">
      <div
        className="scopes"
        style={{ gridTemplateColumns: `max-content repeat(${scopes.length}, 78px)` }}
      >
        {lines.map((ln, li) => (
          <div key={li} style={{ display: "contents" }}>
            <div className="scopeline">{ln || " "}</div>
            {scopes.map((sc, si) => {
              const inScope = li >= sc.from && li <= sc.to;
              return (
                <div
                  key={si}
                  className={[
                    "scopecell",
                    inScope ? "in" : "",
                    li === sc.from ? "first" : "",
                    li === sc.to ? "last" : "",
                    `sk-${sc.kind || "local"}`,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {li === sc.from && <span className="scopename">{sc.name}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="scopelegend">
        {kinds.map((k) => (
          <span className={`scopekey sk-${k}`} key={k}>
            <i />
            {KINDS[k] || k}
          </span>
        ))}
        <span className="scopekeynote">A variable exists on the lines its box covers.</span>
      </div>
    </div>
  );
}
