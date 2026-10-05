import { apiProfile, errorResponse } from "@/lib/auth";
import { getSimulationFor } from "@/lib/data/simulations";

export async function GET(_req: Request, ctx: RouteContext<"/api/simulations/[id]/status">) {
  try {
    const user = await apiProfile();
    const { id } = await ctx.params;
    const sim = await getSimulationFor(id, user);
    return Response.json({ status: sim.status, error: sim.error });
  } catch (err) {
    return errorResponse(err);
  }
}
