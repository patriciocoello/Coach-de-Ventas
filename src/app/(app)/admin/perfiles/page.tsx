import { PresetEditor } from "@/components/admin/preset-editor";
import { PageHeader } from "@/components/ui";
import { listDifficulties, listScenarios } from "@/lib/data/catalog";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function PresetsAdmin() {
  const [{ data }, scenarios, difficulties] = await Promise.all([
    createAdminClient().from("preset_profiles").select("*").order("created_at", { ascending: false }),
    listScenarios(),
    listDifficulties(),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Perfiles predeterminados"
        description="Clientes fijos para que todo el equipo practique con el mismo caso. Puedes guardar uno desde los resultados de cualquier simulación o pegar el JSON de un perfil."
      />
      <PresetEditor presets={data ?? []} scenarios={scenarios.map((s) => ({ key: s.key, name: s.name }))} difficulties={difficulties.map((d) => ({ key: d.key, name: d.name }))} />
    </>
  );
}
