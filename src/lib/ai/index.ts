import "server-only";

import { serverEnv } from "@/lib/env";
import { getAISettings } from "@/lib/data/catalog";
import { LLMEvaluationProvider, type EvaluationProvider } from "@/lib/evaluation/coach";
import { GeminiProvider } from "./providers/gemini";
import { MockProvider } from "./providers/mock";
import { AIProviderError, type AIProvider } from "./types";

// Fábrica de proveedores. Para agregar Anthropic u OpenAI:
//   1. Implementa AIProvider en src/lib/ai/providers/<proveedor>.ts
//   2. Agrega un case aquí y define AI_PROVIDER=<proveedor> en el entorno.
export async function getAIProvider(): Promise<AIProvider> {
  const env = serverEnv();
  switch (env.aiProvider) {
    case "mock":
      return new MockProvider();
    case "gemini": {
      const settings = await getAISettings().catch(() => ({}) as Awaited<ReturnType<typeof getAISettings>>);
      return new GeminiProvider({
        apiKey: env.geminiApiKey,
        chatModel: settings.chatModel || env.geminiChatModel,
        evalModel: settings.evalModel || env.geminiEvalModel,
      });
    }
    default:
      throw new AIProviderError(`Proveedor de IA desconocido: ${env.aiProvider}`, "config");
  }
}

export async function getEvaluationProvider(): Promise<EvaluationProvider> {
  return new LLMEvaluationProvider(await getAIProvider());
}
