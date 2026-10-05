import { SimulationTable } from "@/components/dashboard/seller-dashboard";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { listSimulations } from "@/lib/data/simulations";

export default async function HistoryPage() {
  const profile = await requireProfile();
  const sims = await listSimulations({ userId: profile.id });
  return (
    <>
      <PageHeader eyebrow="Historial" title="Mis simulaciones" action={<ButtonLink href="/simulaciones/nueva">Nueva simulación</ButtonLink>} />
      {sims.length ? (
        <Card>
          <SimulationTable sims={sims} />
        </Card>
      ) : (
        <EmptyState title="Aún no hay simulaciones" action={<ButtonLink href="/simulaciones/nueva">Empezar</ButtonLink>} />
      )}
    </>
  );
}
