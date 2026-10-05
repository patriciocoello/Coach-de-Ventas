import { after } from "next/server";
import { apiProfile, errorResponse } from "@/lib/auth";
import { evaluateSimulation, retryEvaluation } from "@/lib/simulation/service";

export const maxDuration = 120;

export async function POST(_req: Request, ctx: RouteContext<"/api/simulations/[id]/retry">) {
  try {
    const user = await apiProfile();
    const { id } = await ctx.params;
    await retryEvaluation(user, id);
    after(() => evaluateSimulation(id));
    return Response.json({ status: "evaluating" });
  } catch (err) {
    return errorResponse(err);
  }
}
