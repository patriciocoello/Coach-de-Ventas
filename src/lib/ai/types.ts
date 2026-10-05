// Abstracción del proveedor de IA (lado servidor).
// Cualquier proveedor (Gemini, Anthropic, OpenAI…) implementa AIProvider y la
// aplicación nunca llama a un SDK directamente fuera de src/lib/ai/providers.

import type { ZodType } from "zod";

export type AIPurpose = "customer" | "profile" | "evaluation" | "followup" | "extraction";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  purpose: AIPurpose;
  system: string;
  messages: ChatMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
  /** Datos estructurados opcionales; sólo los usa el proveedor mock. */
  mockContext?: unknown;
}

export interface GenerateJSONOptions<T> extends GenerateOptions {
  schema: ZodType<T>;
}

export interface ModelInfo {
  id: string;
  label: string;
}

export interface AIProvider {
  readonly name: string;
  /** Texto en streaming (respuestas del cliente simulado). */
  streamText(opts: GenerateOptions): AsyncIterable<string>;
  generateText(opts: GenerateOptions): Promise<string>;
  /** JSON validado contra un schema de zod. */
  generateJSON<T>(opts: GenerateJSONOptions<T>): Promise<T>;
  listModels?(): Promise<ModelInfo[]>;
  /** Modelo efectivo para un propósito (para mostrar en admin). */
  modelFor?(purpose: AIPurpose): string;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly code: "rate_limit" | "auth" | "config" | "invalid_output" | "unknown" = "unknown",
  ) {
    super(message);
  }
}
