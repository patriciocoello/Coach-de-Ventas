import { z } from "zod";
import { apiProfile, errorResponse } from "@/lib/auth";
import { createSimulation } from "@/lib/simulation/service";

export const maxDuration = 60;

const Body = z.object({
  scenarioKey: z.string().min(1),
  difficultyKey: z.string().min(1),
  prepMode: z.enum(["prep", "cold"]),
  presetId: z.string().uuid().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await apiProfile();
    const body = Body.parse(await req.json());
    const sim = await createSimulation(user, body);
    return Response.json({ id: sim.id });
  } catch (err) {
    return errorResponse(err);
  }
}
