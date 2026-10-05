import { after } from "next/server";
import { z } from "zod";
import { apiProfile, errorResponse } from "@/lib/auth";
import { endSimulation, evaluateSimulation } from "@/lib/simulation/service";

export const maxDuration = 120;

const Body = z.object({
  durationSeconds: z.number().nonnegative(),
  interruption: z.object({ seq: z.number().int(), spokenText: z.string() }).nullable().optional(),
});

export async function POST(req: Request, ctx: RouteContext<"/api/simulations/[id]/end">) {
  try {
    const user = await apiProfile();
    const { id } = await ctx.params;
    const body = Body.parse(await req.json());
    const sim = await endSimulation(user, id, body);
    if (sim.status === "evaluating") after(() => evaluateSimulation(id));
    return Response.json({ status: sim.status });
  } catch (err) {
    return errorResponse(err);
  }
}
