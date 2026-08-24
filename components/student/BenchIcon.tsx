// Small glyphs for the three workbench panes.
//
// SVG, not emoji or a text arrow: at 14px an emoji renders differently on every
// platform and a "▶" says "play" rather than "terminal". These say what the
// pane is at a glance, which is the whole job when they sit beside the swap
// arrows telling you what you are about to land on.

export type BenchIconName = "scratchpad" | "reference" | "tutor";

export default function BenchIcon({ name, size = 15 }: { name: BenchIconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  // A terminal: window frame, prompt chevron, cursor line.
  if (name === "scratchpad") {
    return (
      <svg {...common}>
        <rect x="2" y="3.5" width="16" height="13" rx="2.5" />
        <path d="M5.6 8.2l2.2 2-2.2 2" />
        <path d="M10.6 12.4h4" />
      </svg>
    );
  }

  // A reference sheet: page with a folded corner and ruled lines.
  if (name === "reference") {
    return (
      <svg {...common}>
        <path d="M4.5 2.5h7l4 4v11a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z" />
        <path d="M11.5 2.5v4h4" />
        <path d="M7 11h6M7 14h4" />
      </svg>
    );
  }

  // A sparkle: the mark this app already uses for anything AI.
  return (
    <svg {...common}>
      <path d="M10 2.6l1.7 4.4 4.4 1.7-4.4 1.7L10 14.8 8.3 10.4 3.9 8.7l4.4-1.7z" />
      <path d="M15.4 13.6l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </svg>
  );
}
