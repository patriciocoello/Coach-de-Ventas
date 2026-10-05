import { z } from "zod";
import { apiProfile, errorResponse } from "@/lib/auth";
import { submitFollowup } from "@/lib/simulation/service";

export const maxDuration = 60;

const Body = z.object({ message: z.string().min(1).max(3000) });

export async function POST(req: Request, ctx: RouteContext<"/api/simulations/[id]/followup">) {
  try {
    const user = await apiProfile();
    const { id } = await ctx.params;
    const { message } = Body.parse(await req.json());
    return Response.json(await submitFollowup(user, id, message));
  } catch (err) {
    return errorResponse(err);
  }
}
