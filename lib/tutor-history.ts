"use client";

// Tutor conversations, and scratchpad versions, kept in the browser.
//
// HOW THE CONVERSATION IS ORGANISED: ONE THREAD PER LESSON.
//
// The open question was where to cut a conversation, since one thread cannot
// run forever. The lesson is the natural boundary and it needs no invention:
// a lesson IS a topic, it already has a stable id, and a student asking about
// arrays does not want yesterday's questions about loops in the model's
// context. Open 6.3 and you are back in the 6.3 conversation; open 6.4 and you
// start fresh. There is nothing to name, file or clean up.
//
// Two caps keep it honest:
//   · KEEP is what is stored — enough to scroll back through a lesson.
//   · SEND is what the model sees — the recent turns, so a follow-up like
//     "why?" resolves, without paying to re-read an hour of chat every call.

const CHAT_KEY = (lesson: string) => `classos_chat_${lesson}`;
const SNAP_KEY = "classos_pad_versions";

const KEEP = 60;
const SEND = 8;
const SNAPSHOTS = 20;

export type ChatMsg = { role: "u" | "a"; text: string; meta?: string };

export function loadChat(lesson: string): ChatMsg[] {
  if (!lesson) return [];
  try {
    const raw = JSON.parse(localStorage.getItem(CHAT_KEY(lesson)) || "[]");
    return Array.isArray(raw) ? raw.filter((m) => m && (m.role === "u" || m.role === "a") && typeof m.text === "string") : [];
  } catch {
    return [];
  }
}

export function saveChat(lesson: string, msgs: ChatMsg[]) {
  if (!lesson) return;
  try {
    localStorage.setItem(CHAT_KEY(lesson), JSON.stringify(msgs.slice(-KEEP)));
  } catch {
    /* quota or private mode: the chat still works, it just will not persist */
  }
}

export function clearChat(lesson: string) {
  try {
    localStorage.removeItem(CHAT_KEY(lesson));
  } catch {
    /* ignore */
  }
}

/** The recent turns, shaped for the API. */
export function chatContext(msgs: ChatMsg[]): { role: "user" | "assistant"; text: string }[] {
  return msgs.slice(-SEND).map((m) => ({ role: m.role === "u" ? ("user" as const) : ("assistant" as const), text: m.text }));
}

// ─── Scratchpad versions ─────────────────────────────────────────────────────
//
// The scratchpad is one buffer on purpose — you carry code between lessons.
// But "Put in scratchpad" REPLACED that buffer with no way back, which is a
// destructive action with no undo. Every replacement and every run snapshots
// first, so the previous version is always recoverable.

export type Snapshot = { at: number; code: string; note: string };

export function loadSnapshots(): Snapshot[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SNAP_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((s) => s && typeof s.code === "string") : [];
  } catch {
    return [];
  }
}

/** Record a version. Consecutive identical code is not stored twice. */
export function snapshot(code: string, note: string) {
  if (!code.trim()) return;
  try {
    const all = loadSnapshots();
    if (all[0]?.code === code) return;
    localStorage.setItem(SNAP_KEY, JSON.stringify([{ at: Date.now(), code, note }, ...all].slice(0, SNAPSHOTS)));
  } catch {
    /* ignore */
  }
}

export function describeAge(at: number): string {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
