import Link from "next/link";
import { notFound } from "next/navigation";
import { EvaluatingView, RetryEvaluation } from "@/components/results/evaluating";
import { FollowupForm } from "@/components/results/followup-form";
import { ResultsReport } from "@/components/results/report";
import { SavePresetButton } from "@/components/results/save-preset";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { isAdmin, requireProfile } from "@/lib/auth";
import { listProducts } from "@/lib/data/catalog";
import { getProfileById, getSecret, getSimulationFor, getTurns } from "@/lib/data/simulations";
import { formatDateTime } from "@/lib/format";

export default async function SimulationPage({ params }: PageProps<"/simulaciones/[id]">) {
  const viewer = await requireProfile();
  const { id } = await params;
  const sim = await getSimulationFor(id, viewer).catch(() => null);
  if (!sim) notFound();
  const own = sim.user_id === viewer.id;
  const seller = own ? viewer : await getProfileById(sim.user_id);

  const header = (
    <PageHeader
      eyebrow={`${sim.scenario_name} · ${sim.difficulty_name} · ${formatDateTime(sim.created_at)}${own ? "" : ` · ${seller?.full_name || seller?.email}`}`}
      title={`Llamada con ${sim.customer_name}`}
      action={
        <div className="flex gap-2">
          {own && <ButtonLink href="/simulaciones/nueva">Nueva simulación</ButtonLink>}
          <ButtonLink href={own ? "/historial" : `/equipo/${sim.user_id}`} variant="secondary">
            Volver
          </ButtonLink>
        </div>
      }
    />
  );

  if (sim.status === "ready" || sim.status === "in_progress") {
    return (
      <>
        {header}
        <Card className="p-8 text-center">
          <p className="text-muted">Esta llamada todavía no termina.</p>
          {own && (
            <ButtonLink href={`/llamada/${sim.id}`} className="mt-4">
              Ir a la llamada
            </ButtonLink>
          )}
        </Card>
      </>
    );
  }
  if (sim.status === "evaluating") return (<>{header}<EvaluatingView id={sim.id} /></>);
  if (sim.status === "failed") return (<>{header}<RetryEvaluation id={sim.id} error={sim.error} canRetry={own} /></>);
  if (sim.status === "abandoned") {
    return (
      <>
        {header}
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold">Llamada sin evaluar</h2>
          <p className="mt-2 text-muted">{sim.error ?? "La llamada terminó antes de que hablaras."}</p>
          <Link href="/simulaciones/nueva" className="mt-4 inline-block text-sm underline">
            Intentar otra simulación
          </Link>
        </Card>
      </>
    );
  }

  const [turns, secret, products] = await Promise.all([
    getTurns(sim.id),
    getSecret(sim.id).catch(() => null),
    listProducts(),
  ]);
  if (!sim.evaluation) notFound();

  return (
    <>
      {header}
      <ResultsReport sim={sim} ev={sim.evaluation} profile={secret?.profile ?? null} turns={turns} products={products} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <FollowupForm id={sim.id} initialMessage={sim.followup_message} initialEval={sim.followup_evaluation} canEdit={own} />
        {isAdmin(viewer) && secret && <SavePresetButton simulationId={sim.id} defaultName={`${sim.customer_label} (${sim.difficulty_name})`} />}
      </div>
    </>
  );
}
