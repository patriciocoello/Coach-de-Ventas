import type { Evaluation, Simulation } from "@/lib/types";

// Detección de tendencias a partir de varias simulaciones evaluadas.

const RULE_TENDENCY: Record<string, string> = {
  early_recommendation: "Tiendes a recomendar producto demasiado pronto.",
  no_decision_maker: "Sueles olvidar preguntar quién más participa en la decisión.",
  price_apology: "Tiendes a disculparte o justificar el precio.",
  talked_after_price: "Te cuesta quedarte callado después de dar el precio.",
  premature_concession: "Ofreces concesiones (descuento, envío, ProDeck) antes de tiempo.",
  unauthorized_promise: "A veces das información o promesas que no están autorizadas.",
  catalog_dump: "Tiendes a presentar demasiados productos o la ficha técnica completa.",
  motor_pro_b2b: "Has cotizado Motor Pro a clientes comerciales.",
  immediate_rebuttal: "Respondes objeciones de inmediato sin entenderlas primero.",
  asked_when_to_call: "Preguntas \"¿cuándo te marco?\" en lugar de proponer día y hora.",
  open_ending: "Muchas de tus llamadas terminan abiertas, sin fecha ni pago.",
  missing_other_decider: "Agendas siguientes pasos sin incluir a todos los que deciden.",
};

export interface Pattern {
  kind: "discovery" | "rule" | "category" | "outcome";
  key: string;
  title: string;
  detail: string;
  count: number;
  total: number;
}

export interface CategoryAverage {
  key: string;
  label: string;
  short: string;
  avgPct: number;
  avgScore: number;
  max: number;
}

export function completedEvaluations(sims: Simulation[]): { sim: Simulation; ev: Evaluation }[] {
  return sims
    .filter((s) => s.status === "completed" && s.evaluation)
    .map((s) => ({ sim: s, ev: s.evaluation as Evaluation }));
}

export function categoryAverages(evals: Evaluation[], shortLabels: Record<string, string> = {}): CategoryAverage[] {
  const acc = new Map<string, { label: string; sum: number; pct: number; n: number; max: number }>();
  for (const ev of evals) {
    for (const c of ev.categories) {
      const cur = acc.get(c.key) ?? { label: c.label, sum: 0, pct: 0, n: 0, max: c.max };
      cur.sum += c.score;
      cur.pct += c.max ? c.score / c.max : 0;
      cur.n += 1;
      cur.max = c.max;
      acc.set(c.key, cur);
    }
  }
  return [...acc.entries()].map(([key, v]) => ({
    key,
    label: v.label,
    short: shortLabels[key] ?? v.label,
    avgScore: Math.round((v.sum / v.n) * 10) / 10,
    avgPct: Math.round((v.pct / v.n) * 100),
    max: v.max,
  }));
}

export function detectPatterns(evals: Evaluation[], window = 10): Pattern[] {
  const recent = evals.slice(0, window);
  const n = recent.length;
  if (n < 2) return [];
  const patterns: Pattern[] = [];

  // Campos de descubrimiento que más se olvidan
  const missed = new Map<string, { label: string; count: number; total: number }>();
  for (const ev of recent) {
    for (const d of ev.discovery) {
      const cur = missed.get(d.key) ?? { label: d.label, count: 0, total: 0 };
      cur.total += 1;
      if (!d.discovered) cur.count += 1;
      missed.set(d.key, cur);
    }
  }
  for (const [key, v] of missed) {
    if (v.total >= 2 && v.count / v.total >= 0.5) {
      patterns.push({
        kind: "discovery",
        key,
        title: v.label,
        detail: `No descubriste ${v.label.toLowerCase()} en ${v.count} de tus últimas ${v.total} simulaciones.`,
        count: v.count,
        total: v.total,
      });
    }
  }

  // Reglas que se repiten
  const rules = new Map<string, number>();
  for (const ev of recent) {
    const ids = new Set(ev.ruleViolations.map((v) => v.ruleId));
    for (const id of ids) rules.set(id, (rules.get(id) ?? 0) + 1);
  }
  for (const [id, count] of rules) {
    if (count >= 2 || count / n >= 0.4) {
      patterns.push({
        kind: "rule",
        key: id,
        title: RULE_TENDENCY[id] ?? id,
        detail: `Ocurrió en ${count} de tus últimas ${n} simulaciones.`,
        count,
        total: n,
      });
    }
  }

  // Llamadas abiertas
  const open = recent.filter((e) => e.outcome === "open").length;
  if (open / n >= 0.5 && !rules.has("open_ending")) {
    patterns.push({
      kind: "outcome",
      key: "open",
      title: "Llamadas sin cierre",
      detail: `${open} de tus últimas ${n} llamadas terminaron abiertas (sin pago, sin fecha y sin descartar).`,
      count: open,
      total: n,
    });
  }

  return patterns.sort((a, b) => b.count / b.total - a.count / a.total);
}

export function mostMissedQuestions(evals: Evaluation[], limit = 6) {
  // Agrupa por campo de descubrimiento y usa la pregunta de ejemplo como sugerencia.
  const counts = new Map<string, { label: string; count: number }>();
  for (const ev of evals) {
    for (const d of ev.discovery) {
      if (d.discovered) continue;
      const cur = counts.get(d.key) ?? { label: d.label, count: 0 };
      cur.count += 1;
      counts.set(d.key, cur);
    }
  }
  return [...counts.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function frequentErrors(evals: Evaluation[], limit = 6) {
  const counts = new Map<string, { description: string; count: number }>();
  for (const ev of evals) {
    for (const v of ev.ruleViolations) {
      const cur = counts.get(v.ruleId) ?? { description: v.description, count: 0 };
      cur.count += 1;
      counts.set(v.ruleId, cur);
    }
  }
  return [...counts.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
