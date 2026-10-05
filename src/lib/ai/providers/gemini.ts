import "server-only";

import { GoogleGenAI, ThinkingLevel, type GenerateContentConfig } from "@google/genai";
import { extractJSON, toJSONSchema } from "@/lib/ai/json";
import {
  AIProviderError,
  type AIPurpose,
  type AIProvider,
  type GenerateJSONOptions,
  type GenerateOptions,
  type ModelInfo,
} from "@/lib/ai/types";

const DEFAULT_CHAT_MODEL = "gemini-2.5-flash";
const DEFAULT_EVAL_MODEL = "gemini-2.5-flash";

export interface GeminiConfig {
  apiKey: string;
  chatModel?: string;
  evalModel?: string;
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private client: GoogleGenAI;

  constructor(private config: GeminiConfig) {
    if (!config.apiKey) {
      throw new AIProviderError(
        "Falta GEMINI_API_KEY. Crea una key gratuita en https://aistudio.google.com/apikey y agrégala a las variables de entorno.",
        "config",
      );
    }
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  modelFor(purpose: AIPurpose): string {
    if (purpose === "customer") return this.config.chatModel || DEFAULT_CHAT_MODEL;
    return this.config.evalModel || DEFAULT_EVAL_MODEL;
  }

  private buildConfig(opts: GenerateOptions, model: string): GenerateContentConfig {
    const config: GenerateContentConfig = {
      systemInstruction: opts.system,
      temperature: opts.temperature,
      maxOutputTokens: opts.maxOutputTokens,
      abortSignal: opts.signal,
    };
    // El cliente debe responder rápido: sin razonamiento extendido.
    // La evaluación sí se beneficia de "pensar".
    const fast = opts.purpose === "customer";
    if (/gemini-2\.5/.test(model)) {
      if (fast) config.thinkingConfig = { thinkingBudget: /pro/.test(model) ? 128 : 0 };
      else if (opts.purpose === "evaluation") config.thinkingConfig = { thinkingBudget: 4096 };
      else config.thinkingConfig = { thinkingBudget: /pro/.test(model) ? 512 : 0 };
    } else if (/gemini-3/.test(model)) {
      config.thinkingConfig = { thinkingLevel: fast ? ThinkingLevel.LOW : opts.purpose === "evaluation" ? ThinkingLevel.HIGH : ThinkingLevel.LOW };
    }
    return config;
  }

  private contents(opts: GenerateOptions) {
    const msgs = opts.messages.length ? opts.messages : [{ role: "user" as const, content: "(inicio)" }];
    return msgs.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  }

  async *streamText(opts: GenerateOptions): AsyncIterable<string> {
    const model = this.modelFor(opts.purpose);
    try {
      const stream = await this.client.models.generateContentStream({
        model,
        contents: this.contents(opts),
        config: this.buildConfig(opts, model),
      });
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) yield text;
      }
    } catch (err) {
      throw mapError(err);
    }
  }

  async generateText(opts: GenerateOptions): Promise<string> {
    const model = this.modelFor(opts.purpose);
    try {
      const res = await this.client.models.generateContent({
        model,
        contents: this.contents(opts),
        config: this.buildConfig(opts, model),
      });
      return res.text ?? "";
    } catch (err) {
      throw mapError(err);
    }
  }

  async generateJSON<T>(opts: GenerateJSONOptions<T>): Promise<T> {
    const model = this.modelFor(opts.purpose);
    const base = this.buildConfig(opts, model);
    const attempt = async (withSchema: boolean, extraInstruction?: string) => {
      const config: GenerateContentConfig = {
        ...base,
        responseMimeType: "application/json",
        ...(withSchema ? { responseJsonSchema: toJSONSchema(opts.schema) } : {}),
      };
      if (extraInstruction) config.systemInstruction = `${opts.system}\n\n${extraInstruction}`;
      const res = await this.client.models.generateContent({ model, contents: this.contents(opts), config });
      return res.text ?? "";
    };

    let raw: string;
    try {
      raw = await attempt(true);
    } catch (err) {
      const mapped = mapError(err);
      if (mapped.code !== "unknown") throw mapped;
      // Algunos modelos no aceptan ciertos JSON Schema: reintenta sin schema.
      try {
        raw = await attempt(false, `Responde SOLO con JSON que cumpla este JSON Schema:\n${JSON.stringify(toJSONSchema(opts.schema))}`);
      } catch (err2) {
        throw mapError(err2);
      }
    }

    const parsed = opts.schema.safeParse(safeExtract(raw));
    if (parsed.success) return parsed.data;

    // Un reintento con el error de validación.
    try {
      const retry = await attempt(
        true,
        `Tu respuesta anterior no cumplió el formato. Errores: ${parsed.error.message.slice(0, 1500)}. Devuelve el JSON completo y válido.`,
      );
      const second = opts.schema.safeParse(safeExtract(retry));
      if (second.success) return second.data;
      throw new AIProviderError(`Salida inválida del modelo: ${second.error.message.slice(0, 300)}`, "invalid_output");
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      throw mapError(err);
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const pager = await this.client.models.list({ config: { pageSize: 100 } });
      const out: ModelInfo[] = [];
      for await (const m of pager) {
        const actions = m.supportedActions ?? [];
        if (!m.name || (actions.length && !actions.includes("generateContent"))) continue;
        const id = m.name.replace(/^models\//, "");
        if (!/gemini/.test(id) || /embedding|image|tts|live|audio/.test(id)) continue;
        out.push({ id, label: m.displayName ? `${m.displayName} (${id})` : id });
      }
      return out.sort((a, b) => a.id.localeCompare(b.id));
    } catch (err) {
      throw mapError(err);
    }
  }
}

function safeExtract(text: string): unknown {
  try {
    return extractJSON(text);
  } catch {
    return null;
  }
}

function mapError(err: unknown): AIProviderError {
  if (err instanceof AIProviderError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;
  if (status === 429 || /RESOURCE_EXHAUSTED|429|quota/i.test(msg)) {
    return new AIProviderError(
      "Se alcanzó el límite del plan gratuito de Gemini. Espera un minuto e inténtalo de nuevo (o cambia de modelo en Admin → IA).",
      "rate_limit",
    );
  }
  if (status === 401 || status === 403 || /API key not valid|PERMISSION_DENIED|API_KEY_INVALID/i.test(msg)) {
    return new AIProviderError("La API key de Gemini no es válida o no tiene permisos.", "auth");
  }
  if (/not found|is not supported|NOT_FOUND/i.test(msg) && /model/i.test(msg)) {
    return new AIProviderError(`El modelo configurado no está disponible: ${msg.slice(0, 200)}`, "config");
  }
  return new AIProviderError(msg.slice(0, 500), "unknown");
}
