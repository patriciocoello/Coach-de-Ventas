import { z } from "zod";
import { apiProfile, errorResponse } from "@/lib/auth";
import { runCustomerTurn } from "@/lib/simulation/service";

export const maxDuration = 60;

const Body = z.object({
  sellerText: z.string().max(4000).optional(),
  tOffsetMs: z.number().nonnegative(),
  event: z.enum(["turn", "silence"]),
  customerInterrupts: z.boolean().optional(),
  interruption: z.object({ seq: z.number().int(), spokenText: z.string() }).nullable().optional(),
});

// Responde en NDJSON: una línea JSON por evento, para que el navegador pueda
// empezar a hablar la respuesta del cliente antes de que termine de generarse.
export async function POST(req: Request, ctx: RouteContext<"/api/simulations/[id]/turn">) {
  let gen: ReturnType<typeof runCustomerTurn>;
  try {
    const user = await apiProfile();
    const { id } = await ctx.params;
    const body = Body.parse(await req.json());
    gen = runCustomerTurn(user, id, body);
    // Ejecuta la validación inicial antes de abrir el stream para poder devolver códigos HTTP.
    const first = await gen.next();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
        try {
          if (!first.done) send(first.value);
          for await (const ev of gen) send(ev);
        } catch (err) {
          console.error("turn stream", err);
          send({ type: "error", message: err instanceof Error ? err.message : "Error del cliente simulado" });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
