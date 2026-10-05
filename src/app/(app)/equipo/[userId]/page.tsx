import { notFound } from "next/navigation";
import { SellerDashboard, SimulationTable } from "@/components/dashboard/seller-dashboard";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getScoringConfig } from "@/lib/data/catalog";
import { getProfileById, listSimulations } from "@/lib/data/simulations";

export default async function SellerPage({ params }: PageProps<"/equipo/[userId]">) {
  await requireRole(["manager", "admin"]);
  const { userId } = await params;
  const seller = await getProfileById(userId);
  if (!seller) notFound();
  const [sims, config] = await Promise.all([listSimulations({ userId }), getScoringConfig()]);
  return (
    <>
      <PageHeader eyebrow="Equipo" title={seller.full_name || seller.email} description={seller.email} />
      <SellerDashboard sims={sims} config={config} own={false} />
      {sims.length > 6 && (
        <Card className="mt-6">
          <CardHeader title="Todas las simulaciones" />
          <SimulationTable sims={sims} />
        </Card>
      )}
    </>
  );
}
