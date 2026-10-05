import { DifficultyEditor } from "@/components/admin/difficulty-editor";
import { ScenarioEditor } from "@/components/admin/scenario-editor";
import { PageHeader } from "@/components/ui";
import { listDifficulties, listProducts, listScenarios } from "@/lib/data/catalog";

export default async function ScenariosAdmin() {
  const [scenarios, difficulties, products] = await Promise.all([listScenarios(), listDifficulties(), listProducts()]);
  return (
    <>
      <PageHeader eyebrow="Admin" title="Escenarios y dificultad" description="Los escenarios orientan al generador de clientes. La dificultad cambia de verdad cómo se comporta el cliente." />
      <div className="space-y-10">
        <ScenarioEditor scenarios={scenarios} productSlugs={products.map((p) => p.slug)} />
        <DifficultyEditor difficulties={difficulties} />
      </div>
    </>
  );
}
