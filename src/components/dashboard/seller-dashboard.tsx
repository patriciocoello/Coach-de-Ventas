import Link from "next/link";
import { TrendChart } from "@/components/charts/trend-charts";
import { Badge, ButtonLink, Card, CardHeader, EmptyState, Stat } from "@/components/ui";
import { categoryAverages, completedEvaluations, detectPatterns, frequentErrors, mostMissedQuestions } from "@/lib/evaluation/patterns";
import { formatDate, formatDuration, formatHours, scoreTone } from "@/lib/format";
import type { DiscoveryField, ScoringConfig, Simulation } from "@/lib/types";

// Dashboard personal de un vendedor. Lo usan el inicio y la vista de equipo.
export function SellerDashboard({ sims, config, own }: { sims: Simulation[]; config: ScoringConfig; own: boolean }) {
  const done = completedEvaluations(sims); // más reciente primero
  if (!done.length) {
    return (
      <EmptyState
        title={own ? "Todavía no tienes simulaciones" : "Este vendedor aún no tiene simulaciones evaluadas"}
        description={own ? "Haz tu primera llamada de práctica. Al terminar verás tu calificación, tu feedback y tu evolución aquí." : undefined}
        action={own ? <ButtonLink href="/simulaciones/nueva" size="lg">Iniciar primera simulación</ButtonLink> : undefined}
      />
    );
  }
  const evals = done.map((d) => d.ev);
  const avg = Math.round(evals.reduce((a, e) => a + e.totalScore, 0) / evals.length);
  const last = done[0];
  const totalSeconds = sims.reduce((a, s) => a + (s.duration_seconds ?? 0), 0);
  const shorts = Object.fromEntries(config.categories.map((c) => [c.key, c.short]));
  const cats = categoryAverages(evals, shorts);
  const patterns = detectPatterns(evals);
  const errors = frequentErrors(evals);
  const missed = mostMissedQuestions(evals);
  const fieldByKey = new Map<string, DiscoveryField>(config.discovery_fields.map((f) => [f.key, f]));

  const chronological = [...done].reverse();
  const scoreSeries = chronological.map(({ sim, ev }) => ({
    label: formatDate(sim.created_at),
    value: ev.totalScore,
    title: `${sim.scenario_name} · ${sim.difficulty_name}`,
  }));
  const catSeries = (key: string) =>
    chronological.map(({ sim, ev }) => {
      const c = ev.categories.find((x) => x.key === key);
      return { label: formatDate(sim.created_at), value: c ? Math.round((c.score / Math.max(1, c.max)) * 100) : 0, title: `${c?.score ?? 0}/${c?.max ?? 0} · ${sim.scenario_name}` };
    });
  const trendKeys = ["discovery", "objections", "closing", "listening"].filter((k) => config.categories.some((c) => c.key === k));
  const weakest = [...cats].sort((a, b) => a.avgPct - b.avgPct)[0];
  const main = patterns[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Score promedio" value={avg} sub={`${evals.length} evaluadas`} />
        <Stat label="Último score" value={last.ev.totalScore} sub={<Link className="underline-offset-2 hover:underline" href={`/simulaciones/${last.sim.id}`}>{last.sim.scenario_name} · {formatDate(last.sim.created_at)}</Link>} />
        <Stat label="Simulaciones" value={sims.filter((s) => s.status !== "ready").length} sub="en total" />
        <Stat label="Tiempo entrenando" value={formatHours(totalSeconds)} sub="de llamadas" />
      </div>

      {(main || weakest) && (
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-[1fr_1.4fr]">
            <div className="bg-foreground p-6 text-white">
              <div className="eyebrow text-white/50">Principal área de mejora</div>
              <div className="mt-3 text-2xl font-semibold">{main ? main.title : weakest.label}</div>
              <p className="mt-2 text-sm text-white/70">
                {main ? main.detail : `Es tu categoría más baja: ${weakest.avgPct}% en promedio.`}
              </p>
            </div>
            <div className="p-6">
              <div className="eyebrow mb-3">Patrones detectados</div>
              {patterns.length > 1 ? (
                <ul className="space-y-2 text-sm">
                  {patterns.slice(1, 6).map((p) => (
                    <li key={p.kind + p.key} className="flex gap-2">
                      <span className="text-warn">●</span>
                      <span>
                        <span className="font-medium">{p.title}</span> <span className="text-muted">{p.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Con más simulaciones podremos detectar tendencias más claras.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader eyebrow="Evolución" title="Score a lo largo del tiempo" />
          <div className="p-4">
            <TrendChart data={scoreSeries} />
          </div>
        </Card>
        <Card>
          <CardHeader eyebrow="Promedio" title="Por categoría" />
          <div className="space-y-3 p-5">
            {cats.map((c) => (
              <div key={c.key}>
                <div className="flex justify-between text-sm">
                  <span>{c.label}</span>
                  <span className="tabular-nums text-muted">
                    {c.avgScore}/{c.max}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-panel">
                  <div className="h-full rounded-full bg-ice" style={{ width: `${c.avgPct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {trendKeys.map((k) => (
          <Card key={k} className="p-4">
            <div className="text-sm font-semibold">{shorts[k]}</div>
            <div className="text-xs text-subtle">% del máximo</div>
            <TrendChart data={catSeries(k)} height={120} unit="%" />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader eyebrow="Descubrimiento" title="Lo que más se te olvida preguntar" />
          <ul className="divide-y divide-line">
            {missed.map((m) => (
              <li key={m.key} className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <div className="font-medium">{m.label}</div>
                  {fieldByKey.get(m.key)?.exampleQuestion && <div className="text-muted">“{fieldByKey.get(m.key)!.exampleQuestion}”</div>}
                </div>
                <Badge tone="bad">
                  {m.count}/{evals.length}
                </Badge>
              </li>
            ))}
            {!missed.length && <li className="px-5 py-4 text-sm text-muted">¡Descubriste todo en tus llamadas!</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader eyebrow="Reglas del manual" title="Errores frecuentes" />
          <ul className="divide-y divide-line">
            {errors.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
                <span>{e.description}</span>
                <Badge tone="warn">{e.count}×</Badge>
              </li>
            ))}
            {!errors.length && <li className="px-5 py-4 text-sm text-muted">Sin errores repetidos.</li>}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader eyebrow="Recientes" title="Últimas simulaciones" action={own ? <Link href="/historial" className="text-sm text-muted hover:text-foreground">Ver todas →</Link> : undefined} />
        <SimulationTable sims={sims.slice(0, 6)} />
      </Card>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  ready: "Sin iniciar",
  in_progress: "En curso",
  evaluating: "Evaluando",
  failed: "Error",
  abandoned: "Sin evaluar",
};

export function SimulationTable({ sims }: { sims: Simulation[] }) {
  if (!sims.length) return <p className="px-5 py-6 text-sm text-muted">Sin simulaciones.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-subtle">
            <th className="px-5 py-3 font-medium">Fecha</th>
            <th className="px-5 py-3 font-medium">Cliente</th>
            <th className="px-5 py-3 font-medium">Escenario</th>
            <th className="px-5 py-3 font-medium">Dificultad</th>
            <th className="px-5 py-3 font-medium">Duración</th>
            <th className="px-5 py-3 text-right font-medium">Score</th>
            <th className="px-5 py-3 font-medium">Resultado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sims.map((s) => (
            <tr key={s.id} className="hover:bg-panel">
              <td className="px-5 py-3 text-muted">
                <Link href={s.status === "ready" || s.status === "in_progress" ? `/llamada/${s.id}` : `/simulaciones/${s.id}`} className="block">
                  {formatDate(s.created_at)}
                </Link>
              </td>
              <td className="px-5 py-3 font-medium">
                <Link href={`/simulaciones/${s.id}`}>{s.customer_name}</Link>
              </td>
              <td className="px-5 py-3">{s.scenario_name}</td>
              <td className="px-5 py-3">{s.difficulty_name}</td>
              <td className="px-5 py-3 tabular-nums">{formatDuration(s.duration_seconds)}</td>
              <td className="px-5 py-3 text-right">
                {s.score != null ? <Badge tone={scoreTone(s.score)}>{s.score}</Badge> : <span className="text-subtle">—</span>}
              </td>
              <td className="px-5 py-3 text-muted">{s.status === "completed" ? s.rating : STATUS_LABEL[s.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
