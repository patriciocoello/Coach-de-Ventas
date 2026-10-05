import { ScoringEditor } from "@/components/admin/scoring-editor";
import { PageHeader } from "@/components/ui";
import { getScoringConfig } from "@/lib/data/catalog";

export default async function ScoreAdmin() {
  const config = await getScoringConfig();
  return (
    <>
      <PageHeader eyebrow="Admin" title="Criterios de score" description="Pesos por categoría, reglas del manual con penalización y campos de descubrimiento que se evalúan en cada llamada." />
      <ScoringEditor config={config} />
    </>
  );
}
