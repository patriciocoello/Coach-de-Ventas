import { apiProfile, errorResponse } from "@/lib/auth";
import { startSimulation } from "@/lib/simulation/service";

export async function POST(_req: Request, ctx: RouteContext<"/api/simulations/[id]/start">) {
  try {
    const user = await apiProfile();
    const { id } = await ctx.params;
    return Response.json(await startSimulation(user, id));
  } catch (err) {
    return errorResponse(err);
  }
}
