import clsx from "clsx";
import type { ReactNode } from "react";
import { Badge, Card, CardHeader } from "@/components/ui";
import { OUTCOME_LABEL } from "@/lib/evaluation/scoring";
import { formatDuration, money } from "@/lib/format";
import type { Evaluation, Product, SecretProfile, Simulation, TranscriptTurn } from "@/lib/types";

// Reporte de resultados de una simulación. Componente de servidor.

export function ResultsReport({
  sim,
  ev,
  profile,
  turns,
  products,
}: {
  sim: Simulation;
  ev: Evaluation;
  profile: SecretProfile | null;
  turns: TranscriptTurn[];
  products: Product[];
}) {
  const productName = (slug: string | null | undefined) => products.find((p) => p.slug === slug)?.name ?? slug ?? "—";
  const discovered = ev.discovery.filter((d) => d.discovered).length;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------ Encabezado */}
      <Card className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1fr_1.4fr]">
          <div className="bg-foreground p-8 text-white">
            <div className="eyebrow text-white/50">Calificación</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-7xl font-semibold tabular-nums tracking-tight">{ev.totalScore}</span>
              <span className="text-2xl text-white/40">/ 100</span>
            </div>
            <div className="mt-2 text-lg font-semibold uppercase tracking-[0.12em]">{ev.rating}</div>
            <p className="mt-5 text-sm leading-relaxed text-white/70">{ev.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1">{sim.customer_label}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{sim.difficulty_name}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{formatDuration(sim.duration_seconds)}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Resultado: {OUTCOME_LABEL[ev.outcome]}</span>
            </div>
          </div>
          <div className="p-8">
            <div className="eyebrow mb-4">Por categoría</div>
            <div className="space-y-4">
              {ev.categories.map((c) => (
                <div key={c.key}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{c.label}</span>
                    <span className="tabular-nums">
                      <span className="font-semibold">{c.score}</span>
                      <span className="text-subtle">/{c.max}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-panel">
                    <div
                      className={clsx("h-full rounded-full", pctTone(c.score / c.max))}
                      style={{ width: `${Math.round((c.score / Math.max(1, c.max)) * 100)}%` }}
                    />
                  </div>
                  {c.justification && <p className="mt-1.5 text-xs leading-relaxed text-muted">{c.justification}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ------------------------------------------------ Pregunta de oro + probabilidad */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-foreground p-6">
          <div className="eyebrow">Pregunta de oro</div>
          <p className="mt-1 text-xs text-subtle">La pregunta que más habría cambiado esta venta</p>
          <p className="mt-4 text-xl font-semibold leading-snug">“{ev.goldenQuestion.question || "—"}”</p>
          {ev.goldenQuestion.why && <p className="mt-3 text-sm text-muted">{ev.goldenQuestion.why}</p>}
        </Card>
        <ProbabilityCard before={ev.purchaseProbability.before} after={ev.purchaseProbability.after} factors={ev.purchaseProbability.factors} />
      </div>

      {/* ------------------------------------------------ Feedback */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FeedbackCard title="Lo que hiciste bien" tone="good" items={ev.strengths} />
        <FeedbackCard title="Áreas de mejora" tone="bad" items={ev.improvements} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Preguntas que te faltaron" eyebrow="Para la próxima" />
          <ul className="divide-y divide-line">
            {ev.missedQuestions.map((q) => (
              <li key={q} className="px-5 py-3 text-sm">“{q}”</li>
            ))}
            {!ev.missedQuestions.length && <li className="px-5 py-4 text-sm text-muted">Ninguna relevante.</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Preguntas que hiciste bien" eyebrow="Tus mejores preguntas" />
          <ul className="divide-y divide-line">
            {ev.goodQuestions.map((q, i) => (
              <li key={i} className="px-5 py-3 text-sm">
                {q.quote && <div className="font-medium">“{q.quote}”</div>}
                <div className="mt-0.5 text-muted">{q.text}</div>
                {q.turn != null && <TurnRef n={q.turn} />}
              </li>
            ))}
            {!ev.goodQuestions.length && <li className="px-5 py-4 text-sm text-muted">No se detectaron preguntas destacadas.</li>}
          </ul>
        </Card>
      </div>

      {/* ------------------------------------------------ Descubrimiento */}
      <Card>
        <CardHeader
          eyebrow="La parte más importante"
          title="Información descubierta"
          action={
            <Badge tone={discovered / Math.max(1, ev.discovery.length) >= 0.7 ? "good" : discovered / Math.max(1, ev.discovery.length) >= 0.4 ? "warn" : "bad"}>
              {discovered} de {ev.discovery.length}
            </Badge>
          }
        />
        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {ev.discovery.map((d) => (
            <div key={d.key} className="bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{d.label}</span>
                {d.discovered ? (
                  <Badge tone="good">✓ descubierto</Badge>
                ) : d.partial ? (
                  <Badge tone="warn">~ parcial</Badge>
                ) : (
                  <Badge tone="bad">✕ no</Badge>
                )}
              </div>
              {d.sellerLearned && <p className="mt-2 text-xs text-muted">Entendiste: {d.sellerLearned}</p>}
              {d.actualValue && <p className="mt-1 text-xs text-subtle">Real: {d.actualValue}</p>}
            </div>
          ))}
        </div>
      </Card>

      {/* ------------------------------------------------ Perfil secreto */}
      {profile && (
        <Card>
          <CardHeader eyebrow="Ahora sí" title="Perfil secreto revelado" />
          <div className="grid gap-px bg-line md:grid-cols-2">
            <SecretRow label="Cliente" value={`${profile.name}, ${profile.age} años · ${profile.profession} · ${profile.city}`} />
            <SecretRow label="Tipo de cliente" value={`${profile.customerType} (${profile.segment === "commercial" ? "comercial" : "residencial"})`} />
            <SecretRow label="Qué buscaba" value={profile.lookingFor} />
            <SecretRow label="Motivación" value={profile.motivation} />
            <SecretRow label="Problema principal" value={profile.mainProblem} />
            <SecretRow label="Presupuesto real" value={`${profile.budgetText}${profile.budget ? ` (${money(profile.budget)})` : ""}`} found={isFound(ev, "budget")} />
            <SecretRow label="Urgencia / fecha" value={`${profile.urgency} · ${profile.targetDate}`} found={isFound(ev, "timeline")} />
            <SecretRow label="Decisor" value={`${profile.decisionMaker}${profile.othersInvolved ? ` · ${profile.othersInvolved}` : ""}`} found={isFound(ev, "decision_makers")} />
            <SecretRow label="Competidores" value={profile.competitors} found={isFound(ev, "competitors")} />
            <SecretRow label="Instalación" value={`${profile.installationPlace} · ${profile.indoorOutdoor} · ${profile.availableSpace}`} found={isFound(ev, "space")} />
            <SecretRow label="Objeción oculta" value={profile.hiddenObjection} found={isFound(ev, "main_concern")} highlight />
            <SecretRow
              label="Producto probablemente adecuado"
              value={`${productName(profile.recommendedProduct)}${profile.alternativeProduct ? ` (alternativa: ${productName(profile.alternativeProduct)})` : ""} — ${profile.recommendedProductReason}`}
              highlight
            />
            <SecretRow label="Lo que recomendaste" value={`${ev.productRecommended ?? "No recomendaste producto"} · ${ev.productFit}`} />
            <SecretRow label="Para avanzar necesitaba" value={profile.closingConditions} />
          </div>
        </Card>
      )}

      {/* ------------------------------------------------ Oportunidades perdidas */}
      {ev.missedOpportunities.length > 0 && (
        <Card>
          <CardHeader eyebrow="Muy importante" title="Oportunidades perdidas" />
          <div className="divide-y divide-line">
            {ev.missedOpportunities.map((m, i) => (
              <div key={i} className="grid gap-4 p-5 md:grid-cols-[1.3fr_1fr]">
                <div className="space-y-2">
                  {m.turn != null && <TurnRef n={m.turn} />}
                  <Bubble who="Cliente">{m.customerSaid}</Bubble>
                  <Bubble who="Tú" seller>
                    {m.sellerSaid}
                  </Bubble>
                </div>
                <div>
                  <div className="eyebrow mb-2">Podrías haber preguntado</div>
                  <ul className="space-y-1.5 text-sm font-medium">
                    {m.betterQuestions.map((q) => (
                      <li key={q}>“{q}”</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-muted">{m.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ------------------------------------------------ Momentos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MomentCard title="Momento más fuerte" tone="good" moment={ev.strongestMoment} />
        <MomentCard title="Momento más débil" tone="bad" moment={ev.weakestMoment} />
      </div>

      {/* ------------------------------------------------ Conversación mejorada */}
      {ev.improvedConversation.length > 0 && (
        <Card>
          <CardHeader eyebrow="Cómo sonaría mejor" title="Conversación mejorada" />
          <div className="divide-y divide-line">
            {ev.improvedConversation.map((x, i) => (
              <div key={i} className="space-y-2 p-5">
                {x.turn != null && <TurnRef n={x.turn} />}
                <Bubble who="Cliente">{x.customer}</Bubble>
                <Bubble who="Tú dijiste" seller muted>
                  {x.seller}
                </Bubble>
                <Bubble who="Mejor respuesta" seller strong>
                  {x.better}
                </Bubble>
                <p className="pt-1 text-sm text-muted">{x.explanation}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ------------------------------------------------ Manual + reglas */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader eyebrow="Contra el manual" title="Pasos de la llamada" />
          <ul className="divide-y divide-line">
            {ev.manualSteps.map((s) => (
              <li key={s.step} className="flex gap-4 px-5 py-3">
                <span className="w-6 text-lg font-semibold">{s.step}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {s.name}
                    <StepBadge status={s.status} />
                  </div>
                  {s.note && <p className="mt-0.5 text-xs text-muted">{s.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader eyebrow="Penalizaciones" title="Reglas del manual" />
            <div className="p-5">
              {ev.ruleViolations.length === 0 ? (
                <p className="text-sm text-good">✓ No rompiste ninguna regla del manual.</p>
              ) : (
                <ul className="space-y-3">
                  {ev.ruleViolations.map((v, i) => (
                    <li key={i} className="text-sm">
                      <div className="font-medium text-bad">✕ {v.description}</div>
                      {v.quote && <div className="mt-0.5 text-muted">“{v.quote}”</div>}
                      {v.turn != null && <TurnRef n={v.turn} />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
          <Card className="p-5">
            <div className="eyebrow">Resultado de la llamada</div>
            <div className="mt-2 text-lg font-semibold">{OUTCOME_LABEL[ev.outcome]}</div>
            <p className="mt-1 text-sm text-muted">{ev.outcomeExplanation}</p>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
              <div>
                <div className="text-xs text-subtle">Preguntas antes de recomendar</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{ev.questionsBeforeRecommendation ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-subtle">Quién habló más</div>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-panel">
                  <div className="bg-foreground" style={{ width: `${ev.talkRatio.seller}%` }} />
                  <div className="bg-ice" style={{ width: `${ev.talkRatio.customer}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>Tú {ev.talkRatio.seller}%</span>
                  <span>Cliente {ev.talkRatio.customer}%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ------------------------------------------------ Transcripción */}
      <Card>
        <details>
          <summary className="cursor-pointer list-none px-5 py-4">
            <span className="eyebrow">Transcripción completa</span>
            <span className="ml-2 text-sm text-muted">({turns.length} intervenciones) · ver</span>
          </summary>
          <div className="space-y-3 border-t border-line p-5">
            {turns.map((t) => (
              <div key={t.seq} id={`turno-${t.seq}`} className="flex gap-3 text-sm">
                <span className="w-10 shrink-0 font-mono text-xs text-subtle">#{t.seq}</span>
                <span className="w-14 shrink-0 font-mono text-xs text-subtle">{formatDuration(Math.floor(t.t_offset_ms / 1000))}</span>
                <span className={clsx("w-16 shrink-0 text-xs font-semibold uppercase", t.speaker === "seller" ? "text-foreground" : "text-ice")}>
                  {t.speaker === "seller" ? "Tú" : "Cliente"}
                </span>
                <span className="flex-1">{t.text}</span>
              </div>
            ))}
          </div>
        </details>
      </Card>
    </div>
  );
}

function isFound(ev: Evaluation, key: string) {
  const d = ev.discovery.find((x) => x.key === key);
  return d ? d.discovered : undefined;
}

function pctTone(p: number) {
  if (p >= 0.8) return "bg-good";
  if (p >= 0.6) return "bg-warn";
  return "bg-bad";
}

function TurnRef({ n }: { n: number }) {
  return (
    <a href={`#turno-${n}`} className="mt-1 inline-block font-mono text-[11px] text-subtle hover:text-foreground">
      turno #{n}
    </a>
  );
}

function Bubble({ who, children, seller, strong, muted }: { who: string; children: ReactNode; seller?: boolean; strong?: boolean; muted?: boolean }) {
  return (
    <div className={clsx("flex flex-col", seller ? "items-end" : "items-start")}>
      <div className="mb-0.5 text-[10px] uppercase tracking-[0.16em] text-subtle">{who}</div>
      <div
        className={clsx(
          "max-w-[92%] rounded-2xl px-4 py-2 text-sm",
          !seller && "rounded-bl-sm bg-panel",
          seller && !strong && "rounded-br-sm border border-line",
          muted && "text-muted line-through decoration-black/20",
          strong && "rounded-br-sm bg-foreground text-white",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function FeedbackCard({ title, tone, items }: { title: string; tone: "good" | "bad"; items: Evaluation["strengths"] }) {
  return (
    <Card>
      <CardHeader title={title} eyebrow={tone === "good" ? "Fortalezas" : "Qué cambiar"} />
      <ul className="divide-y divide-line">
        {items.map((s, i) => (
          <li key={i} className="flex gap-3 px-5 py-4 text-sm">
            <span className={clsx("mt-0.5 font-semibold", tone === "good" ? "text-good" : "text-bad")}>{tone === "good" ? "✓" : "!"}</span>
            <div>
              <p className="leading-relaxed">{s.text}</p>
              {s.quote && <p className="mt-1 text-muted">“{s.quote}”</p>}
              {s.turn != null && <TurnRef n={s.turn} />}
            </div>
          </li>
        ))}
        {!items.length && <li className="px-5 py-4 text-sm text-muted">—</li>}
      </ul>
    </Card>
  );
}

function MomentCard({ title, tone, moment }: { title: string; tone: "good" | "bad"; moment: Evaluation["strongestMoment"] }) {
  return (
    <Card className="p-6">
      <div className={clsx("eyebrow", tone === "good" ? "!text-good" : "!text-bad")}>{title}</div>
      {moment.quote && <p className="mt-3 text-lg font-medium leading-snug">“{moment.quote}”</p>}
      <p className="mt-2 text-sm text-muted">{moment.explanation}</p>
      {moment.turn != null && <TurnRef n={moment.turn} />}
    </Card>
  );
}

function SecretRow({ label, value, found, highlight }: { label: string; value: string; found?: boolean; highlight?: boolean }) {
  return (
    <div className={clsx("bg-white p-4", highlight && "bg-ice-soft/50")}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-subtle">{label}</span>
        {found === true && <span className="text-xs text-good">✓ lo descubriste</span>}
        {found === false && <span className="text-xs text-bad">✕ no lo descubriste</span>}
      </div>
      <div className="mt-1 text-sm">{value || "—"}</div>
    </div>
  );
}

function StepBadge({ status }: { status: Evaluation["manualSteps"][number]["status"] }) {
  if (status === "done") return <Badge tone="good">✓ hecho</Badge>;
  if (status === "partial") return <Badge tone="warn">~ parcial</Badge>;
  if (status === "na") return <Badge>no aplica</Badge>;
  return <Badge tone="bad">✕ faltó</Badge>;
}

function ProbabilityCard({ before, after, factors }: { before: number; after: number; factors: string[] }) {
  const delta = after - before;
  return (
    <Card className="p-6">
      <div className="eyebrow">Probabilidad de compra</div>
      <div className="mt-4 flex items-end gap-6">
        <div>
          <div className="text-xs text-subtle">Antes de la llamada</div>
          <div className="text-4xl font-semibold tabular-nums text-muted">{before}%</div>
        </div>
        <div className={clsx("pb-2 text-lg font-semibold", delta >= 0 ? "text-good" : "text-bad")}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}
        </div>
        <div>
          <div className="text-xs text-subtle">Después de la llamada</div>
          <div className="text-4xl font-semibold tabular-nums">{after}%</div>
        </div>
      </div>
      <div className="relative mt-5 h-2 rounded-full bg-panel">
        <div className="absolute inset-y-0 left-0 rounded-full bg-line" style={{ width: `${before}%` }} />
        <div className={clsx("absolute inset-y-0 left-0 rounded-full", delta >= 0 ? "bg-good" : "bg-bad")} style={{ width: `${after}%`, opacity: 0.85 }} />
        <div className="absolute -top-1 h-4 w-0.5 bg-foreground" style={{ left: `${before}%` }} title="Antes" />
      </div>
      {factors.length > 0 && (
        <ul className="mt-5 space-y-1 text-sm text-muted">
          {factors.map((f) => (
            <li key={f}>– {f}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
