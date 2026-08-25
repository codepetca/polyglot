"use client";

// Is classOS running inside Pika?
//
// WHY NOT A SECOND BAR. The first design hid the classOS top bar and added a
// slim strip with a back arrow and a progress bar. That was wrong twice over:
// it threw away controls a student wants mid-lesson — Notes, Reference, theme,
// the ESL switch — and then rebuilt a worse bar to replace them. Keeping the
// bar and putting the way back INTO it is one bar doing one job.
//
// What does have to go is the half of it that Pika already owns: the logo, the
// self-hosted badge, Account, and Sign out. Signing out of classOS from inside
// Pika would leave a student in a tab they cannot use, in a session they did
// not know they had.
//
// DETECTED FROM THE URL, not from being in a frame. `window.self !== window.top`
// is true for any embedding, including ones we know nothing about, and this
// decides what a student can click. Pika sets ?embed=pika on the src; we keep
// it for the tab's lifetime so it survives navigation inside the frame.

const KEY = "classos_embed";

export type EmbedHost = "" | "pika";

export function readEmbed(): EmbedHost {
  if (typeof window === "undefined") return "";
  try {
    const param = new URLSearchParams(window.location.search).get("embed");
    if (param === "pika") {
      sessionStorage.setItem(KEY, "pika");
      return "pika";
    }
    return sessionStorage.getItem(KEY) === "pika" ? "pika" : "";
  } catch {
    return "";
  }
}

/**
 * Ask the host to take the student back to the classroom.
 *
 * postMessage first, so Pika can route without a page load and keep its own
 * state. history.back() is the fallback for a host that is not listening —
 * better than a hard-coded URL we would have to keep in step with theirs.
 */
export function backToHost() {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "classos:back" }, "*");
      return;
    }
  } catch {
    /* cross-origin parent that refuses access: fall through */
  }
  history.back();
}
