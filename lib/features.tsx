"use client";

import { createContext, useContext } from "react";

// Whether the AI is switched on, made available to the client tree.
//
// WHY A CONTEXT AND NOT A FETCH. Every AI affordance in the product would
// otherwise have to ask a route whether it should exist, which means each one
// renders, then disappears — a tutor tab that flickers in and out on every
// lesson load. The flag is known on the server before the page is sent, so it
// travels down with the page and the AI parts are simply never drawn.
//
// This is presentation only. The control is in complete() (lib/llm/index.ts);
// a client that lies about this flag still gets the offline stub.

const AiContext = createContext<boolean>(true);

export function FeaturesProvider({ ai, children }: { ai: boolean; children: React.ReactNode }) {
  return <AiContext.Provider value={ai}>{children}</AiContext.Provider>;
}

/** True when the tutor and the ✦ buttons should be drawn at all. */
export function useAi(): boolean {
  return useContext(AiContext);
}
