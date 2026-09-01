// The `ai` object that student code can actually call.
//
// WHY THIS EXISTS. The AI unit teaches how to build against a model. Without
// something to call, every exercise degrades into arithmetic wearing a costume:
// "estimate the tokens with Math.ceil" teaches division, not LLMs. The reviewer
// put it plainly — what is the point of writing console.log when it is not
// really code.
//
// So this is a stand-in model. It is NOT a real one: no network, no key, no
// cost, and it runs identically in the browser and in the compiler gate, which
// is the only reason a lesson's expected output can be checked at all. What is
// real is the SHAPE. `ai.ask` takes the fields Anthropic's API takes and
// returns the fields it returns, so a student who can drive this can read the
// real docs and recognise everything in them.
//
// It is also deliberately flawed in the ways the unit teaches:
//   - it invents confident answers for things it "does not know" (A1.2)
//   - it wraps JSON in markdown fences unless told not to (A1.7)
//   - it truncates and reports stop_reason "max_tokens" (A1.3)
//   - it remembers nothing between calls (A1.6)
// Those are not bugs here. They are the curriculum.

/** Type declarations, appended to the checker's globals. */
export const SANDBOX_DECL = `
declare type AiMessage = { role: "user" | "assistant"; content: string };
declare type AiRequest = {
  model: string;
  max_tokens?: number;
  system?: string;
  messages: AiMessage[];
};
declare type AiReply = {
  content: { type: "text"; text: string }[];
  usage: { input_tokens: number; output_tokens: number };
  stop_reason: "end_turn" | "max_tokens";
  model: string;
};
declare const ai: {
  /** Send a request. Returns the reply, the same shape the real API returns. */
  ask(request: AiRequest): AiReply;
  /** The same call, delivered in pieces, the way streaming arrives. */
  stream(request: AiRequest): string[];
  /** Count the tokens in a piece of text. */
  count(text: string): number;
};
`;

/**
 * The implementation, as source, so the browser iframe and the Node gate run
 * the identical thing. Prepended to the student's compiled JavaScript.
 */
export const SANDBOX_RUNTIME = `
var ai = (function () {
  // A token is roughly four characters. Good enough to reason with, and it is
  // what the unit tells the student, so the two must agree.
  function count(text) { return Math.ceil(String(text || "").length / 4); }

  // What this model "learned". Everything else it will cheerfully invent.
  var known = {
    "capital of canada": "Ottawa",
    "city in ontario": "Ottawa",
    "capital of france": "Paris",
    "largest planet": "Jupiter",
    "2 + 2": "4"
  };

  function lookup(q) {
    var low = q.toLowerCase();
    for (var k in known) if (low.indexOf(k) !== -1) return known[k];
    return null;
  }

  // Deterministic stand-in for "it made something up". Same question, same
  // invented answer, so a lesson's expected output stays stable.
  function invent(q) {
    var names = ["Kingsport", "Aldermere", "Brightwater", "Norwich Falls"];
    var n = 0;
    for (var i = 0; i < q.length; i++) n = (n + q.charCodeAt(i)) % names.length;
    return names[n];
  }

  // Pull a name out of anything the student actually resent. This is what makes
  // A1.6 real: include the history and it answers, drop it and it invents.
  function nameFrom(msgs) {
    for (var i = 0; i < msgs.length; i++) {
      var m = String(msgs[i].content).match(/my name is ([A-Za-z]+)/i);
      if (m) return m[1];
    }
    return null;
  }

  function answer(req) {
    var msgs = req.messages || [];
    var last = msgs.length ? String(msgs[msgs.length - 1].content) : "";
    var sys = String(req.system || "");
    var all = msgs.map(function (m) { return String(m.content); }).join(" ");

    if (/what is my name/i.test(last)) {
      var nm = nameFrom(msgs);
      return nm ? nm : invent(last);
    }

    // Told to stay inside the supplied text, it will say so instead of
    // reaching for training data. Drop that instruction and it fills the gap.
    if (/only from the text|only using the text/i.test(sys)) {
      // Search only what was SUPPLIED, never the question itself. Otherwise
      // "what is the capital of France?" grounds itself and the lesson lies.
      var supplied = all.split(/question:/i)[0];
      var grounded = lookup(supplied);
      return grounded ? grounded : "I cannot answer from the text provided.";
    }

    // Asked for JSON? Obliges, but wraps it in fences like a real one does,
    // unless the prompt explicitly forbids them.
    if (/json/i.test(sys)) {
      var body = '{"answer": "' + (lookup(last) || invent(last)) + '"}';
      var clean = /no fences/i.test(sys) || /only valid json/i.test(sys);
      return clean ? body : "Sure! Here you go:\\n\\n\\u0060\\u0060\\u0060json\\n" + body + "\\n\\u0060\\u0060\\u0060";
    }

    // A system prompt asking for brevity is obeyed. This is the whole point of
    // A1.5: the prompt changes the output, the code does not.
    var short = /one word|single word|only the name/i.test(sys);
    var hit = lookup(last);
    if (hit) return short ? hit : hit + " is the answer.";
    return short ? invent(last) : "The answer is " + invent(last) + ".";
  }

  return {
    count: count,
    ask: function (req) {
      var text = answer(req);
      var cap = req.max_tokens;
      var stop = "end_turn";
      if (typeof cap === "number" && count(text) > cap) {
        text = text.slice(0, cap * 4);
        stop = "max_tokens";
      }
      var input = count(req.system || "") +
        (req.messages || []).reduce(function (n, m) { return n + count(m.content); }, 0);
      return {
        content: [{ type: "text", text: text }],
        usage: { input_tokens: input, output_tokens: count(text) },
        stop_reason: stop,
        model: req.model
      };
    },
    stream: function (req) {
      // Chunks arrive a few tokens at a time, which is what makes the first
      // word appear long before the last one.
      var text = this.ask(req).content[0].text;
      var out = [];
      for (var i = 0; i < text.length; i += 8) out.push(text.slice(i, i + 8));
      return out;
    }
  };
})();
`;
