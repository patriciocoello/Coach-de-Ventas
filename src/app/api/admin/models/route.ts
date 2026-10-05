import { getAIProvider } from "@/lib/ai";
import { apiProfile, errorResponse } from "@/lib/auth";

// Lista los modelos disponibles para la API key configurada y prueba la conexión.
export async function GET() {
  try {
    await apiProfile(["admin"]);
    const ai = await getAIProvider();
    const models = ai.listModels ? await ai.listModels() : [];
    return Response.json({
      provider: ai.name,
      models,
      current: { chat: ai.modelFor?.("customer") ?? null, eval: ai.modelFor?.("evaluation") ?? null },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
