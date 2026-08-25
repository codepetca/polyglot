export type Feature = "tutor" | "grade" | "generate" | "runjava" | "oversee";

export type Provider = "stub" | "gemini" | "groq" | "openrouter" | "anthropic" | "vertex";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CompleteArgs {
  feature: Feature;
  system: string;
  messages: ChatMessage[];
  json?: boolean; // ask the provider for strict JSON and parse defensively
  maxTokens?: number;
  // Caps hidden "thinking" tokens on reasoning models (Gemini 2.5+/3.x, etc).
  // These are billed as output tokens but invisible in the reply — on some
  // models they're 70-85% of the bill for tasks that don't need deep
  // reasoning. Set "low" for short, simple tasks (a hint, a one-line verdict).
  reasoningEffort?: "low" | "medium" | "high";
}

export interface LLMResult<T = unknown> {
  text: string;
  data?: T; // populated when json:true and parsing succeeded
  usage: { input: number; output: number };
  cost: number; // normalized USD, from the DB price table
  provider: Provider;
  model: string;
  /** Why the offline stub answered, when it did. */
  degraded?: "budget" | "unconfigured" | null;
}

// One lane = one attempt target. The adapter tries the primary, then fallbacks.
export interface Lane {
  provider: Provider;
  apiKey?: string; // for vertex, this is the service-account JSON
  model: string;
  baseUrl?: string; // for OpenAI-compatible providers
  region?: string; // vertex: GCP location, e.g. "us-central1" or "global"
}
