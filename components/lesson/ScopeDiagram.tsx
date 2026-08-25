/**
 * Scope drawn ON the code, not beside it.
 *
 * TWO WRONG VERSIONS CAME BEFORE THIS. First a 7px hairline in a lane, which
 * reads as a bracket or a scrollbar. Then a colour-coded box — but still in a
 * lane off to the right, so the student had to track a horizontal line from a
 * box back to the code to work out which lines it covered. The owner's note was
 * exact: put it on the code.
 *
 * So the box now wraps the lines themselves. "Where does this variable exist?"
 * is answered by looking at what is inside the box, with no eye-tracking and no
 * legend lookup in between.
 *
 * Nested scopes nest visually, because that is what scope does — a loop
 * variable's box sits inside the method's box. Each box is inset a little
 * further than its parent so the nesting is visible rather than implied.
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

  // Outermost first, so a box drawn later sits inside the one before it. Ties
  // break on the longer span, which is the enclosing one.
  const ordered = [...scopes].sort((a, b) => a.from - b.from || b.to - a.to);

  // How deep each scope is nested inside the others. Drives the inset.
  const depth = ordered.map((s, i) => ordered.filter((o, j) => j < i && o.from <= s.from && o.to >= s.to).length);

  const kinds: string[] = [];
  for (const s of ordered) {
    const k = s.kind || "local";
    if (!kinds.includes(k)) kinds.push(k);
  }

  return (
    <div className="scopewrap">
      <div className="scopes">
        {/* The code, with a box drawn over the span of each variable. */}
        <div className="scopecode">
          {lines.map((ln, li) => (
            <div className="scopeline" key={li}>
              {ln || " "}
            </div>
          ))}

          {ordered.map((sc, i) => (
            <div
              key={i}
              className={`scopebox sk-${sc.kind || "local"}`}
              style={{
                // Lines are a fixed height, so a box is pure arithmetic: start
                // at its first line, cover as many as it spans.
                top: `calc(${sc.from} * var(--scope-line))`,
                height: `calc(${sc.to - sc.from + 1} * var(--scope-line))`,
                left: `calc(${depth[i]} * 7px)`,
                right: `calc(${depth[i]} * 7px)`,
              }}
            >
              <span className="scopename">{sc.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="scopelegend">
        {kinds.map((k) => (
          <span className={`scopekey sk-${k}`} key={k}>
            <i />
            {KINDS[k] || k}
          </span>
        ))}
        <span className="scopekeynote">A variable exists on the lines inside its box.</span>
      </div>
    </div>
  );
}
