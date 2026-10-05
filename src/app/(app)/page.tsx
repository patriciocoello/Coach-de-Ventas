import { SellerDashboard } from "@/components/dashboard/seller-dashboard";
import { Alert, ButtonLink, PageHeader } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { getScoringConfig } from "@/lib/data/catalog";
import { listSimulations } from "@/lib/data/simulations";
import { isContentEmpty } from "@/lib/seed";

export default async function HomePage() {
  const profile = await requireProfile();
  const [sims, config, empty] = await Promise.all([listSimulations({ userId: profile.id }), getScoringConfig(), isContentEmpty()]);
  const first = (profile.full_name || profile.email).split(" ")[0];
  return (
    <>
      <PageHeader
        eyebrow="Tu progreso"
        title={`Hola, ${first}`}
        description="Practica llamadas reales por voz y mejora tu descubrimiento, objeciones y cierre."
        action={<ButtonLink href="/simulaciones/nueva" size="lg">Nueva simulación</ButtonLink>}
      />
      {empty && (
        <div className="mb-6">
          <Alert tone="warn">
            Falta cargar el catálogo y el manual de Mente Fría. {profile.role === "admin" ? "Entra a Admin y pulsa “Cargar contenido inicial”." : "Pídele a un administrador que lo cargue."}
          </Alert>
        </div>
      )}
      <SellerDashboard sims={sims} config={config} own />
    </>
  );
}
