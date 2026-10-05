import { EmptyState, PageHeader } from "@/components/ui";
import { isManager, requireProfile } from "@/lib/auth";
import { listDifficulties, listScenarios } from "@/lib/data/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewSimulationForm } from "./new-simulation-form";

export default async function NewSimulationPage() {
  const profile = await requireProfile();
  const [scenarios, difficulties] = await Promise.all([listScenarios({ activeOnly: true }), listDifficulties()]);
  let presets: { id: string; name: string }[] = [];
  if (isManager(profile)) {
    const { data } = await createAdminClient().from("preset_profiles").select("id, name").eq("active", true).order("name");
    presets = data ?? [];
  }
  if (!scenarios.length || !difficulties.length) {
    return (
      <EmptyState
        title="Aún no hay escenarios"
        description="Un administrador debe cargar el contenido inicial desde Admin."
      />
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="Nueva simulación"
        title="¿Con quién vas a practicar?"
        description="Elige el tipo de cliente y la dificultad. El sistema crea un prospecto con una ficha secreta que tendrás que descubrir durante la llamada."
      />
      <NewSimulationForm scenarios={scenarios} difficulties={difficulties} presets={presets} />
    </>
  );
}
