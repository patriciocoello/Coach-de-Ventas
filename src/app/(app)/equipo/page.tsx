import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { listProfiles, listSimulations } from "@/lib/data/simulations";
import { categoryAverages, completedEvaluations } from "@/lib/evaluation/patterns";
import { formatDate, formatHours, scoreTone } from "@/lib/format";

export default async function TeamPage() {
  await requireRole(["manager", "admin"]);
  const [profiles, sims] = await Promise.all([listProfiles(), listSimulations()]);
  const rows = profiles
    .filter((p) => p.active)
    .map((p) => {
      const mine = sims.filter((s) => s.user_id === p.id);
      const done = completedEvaluations(mine);
      const scores = done.map((d) => d.ev.totalScore);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      const recent = scores.slice(0, 3);
      const prior = scores.slice(3, 6);
      const trend = recent.length && prior.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length - prior.reduce((a, b) => a + b, 0) / prior.length) : null;
      const cats = categoryAverages(done.map((d) => d.ev));
      const discovery = cats.find((c) => c.key === "discovery")?.avgPct ?? null;
      return {
        p,
        count: done.length,
        avg,
        last: done[0]?.ev.totalScore ?? null,
        lastAt: done[0]?.sim.created_at ?? null,
        trend,
        discovery,
        seconds: mine.reduce((a, s) => a + (s.duration_seconds ?? 0), 0),
      };
    })
    .sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));

  const all = completedEvaluations(sims);
  const teamAvg = all.length ? Math.round(all.reduce((a, d) => a + d.ev.totalScore, 0) / all.length) : null;

  return (
    <>
      <PageHeader eyebrow="Gerencia" title="Equipo" description="Ranking y evolución de cada vendedor." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Score promedio del equipo" value={teamAvg ?? "—"} />
        <Stat label="Simulaciones evaluadas" value={all.length} />
        <Stat label="Vendedores activos" value={rows.filter((r) => r.count > 0).length} sub={`de ${rows.length}`} />
        <Stat label="Tiempo total" value={formatHours(rows.reduce((a, r) => a + r.seconds, 0))} />
      </div>
      {rows.length ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-subtle">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Vendedor</th>
                <th className="px-5 py-3 font-medium">Simulaciones</th>
                <th className="px-5 py-3 font-medium">Promedio</th>
                <th className="px-5 py-3 font-medium">Último</th>
                <th className="px-5 py-3 font-medium">Tendencia</th>
                <th className="px-5 py-3 font-medium">Descubrimiento</th>
                <th className="px-5 py-3 font-medium">Última práctica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r, i) => (
                <tr key={r.p.id} className="hover:bg-panel">
                  <td className="px-5 py-3 text-subtle">{i + 1}</td>
                  <td className="px-5 py-3">
                    <Link href={`/equipo/${r.p.id}`} className="font-medium hover:underline">
                      {r.p.full_name || r.p.email}
                    </Link>
                  </td>
                  <td className="px-5 py-3 tabular-nums">{r.count}</td>
                  <td className="px-5 py-3">{r.avg != null ? <Badge tone={scoreTone(r.avg)}>{r.avg}</Badge> : "—"}</td>
                  <td className="px-5 py-3 tabular-nums">{r.last ?? "—"}</td>
                  <td className="px-5 py-3 tabular-nums">
                    {r.trend == null ? <span className="text-subtle">—</span> : <span className={r.trend >= 0 ? "text-good" : "text-bad"}>{r.trend >= 0 ? "▲" : "▼"} {Math.abs(r.trend)}</span>}
                  </td>
                  <td className="px-5 py-3 tabular-nums">{r.discovery != null ? `${r.discovery}%` : "—"}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(r.lastAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title="Aún no hay vendedores" description="Agrégalos en Admin → Usuarios." />
      )}
    </>
  );
}
