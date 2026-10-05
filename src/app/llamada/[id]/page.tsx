import { redirect } from "next/navigation";
import { CallRoom } from "@/components/call/call-room";
import { requireProfile } from "@/lib/auth";
import { getSimulationFor } from "@/lib/data/simulations";

export const metadata = { title: "Llamada · Coach de Ventas" };

export default async function CallPage({ params }: PageProps<"/llamada/[id]">) {
  const profile = await requireProfile();
  const { id } = await params;
  const sim = await getSimulationFor(id, profile).catch(() => null);
  if (!sim) redirect("/");
  if (sim.user_id !== profile.id || (sim.status !== "ready" && sim.status !== "in_progress")) {
    redirect(`/simulaciones/${id}`);
  }
  return (
    <CallRoom
      simulationId={sim.id}
      customerName={sim.customer_name}
      customerLabel={sim.customer_label}
      difficultyName={sim.difficulty_name}
      prepBrief={sim.prep_mode === "prep" ? sim.prep_brief : null}
      voiceHint={sim.voice_hint}
      resuming={sim.status === "in_progress"}
    />
  );
}
