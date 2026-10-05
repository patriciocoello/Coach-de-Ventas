import type {
  CategoryScore,
  DiscoveryField,
  DiscoveryResult,
  Evaluation,
  ScoringConfig,
  SecretProfile,
  TranscriptTurn,
} from "@/lib/types";
import type { CoachOutput } from "./schema";

export function ratingLabel(score: number): string {
  if (score >= 90) return "Venta excelente";
  if (score >= 80) return "Muy buena venta";
  if (score >= 70) return "Buena venta";
  if (score >= 60) return "Venta regular";
  if (score >= 40) return "Necesita mejorar";
  return "Venta deficiente";
}

export function talkRatio(turns: TranscriptTurn[]) {
  const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
  let seller = 0;
  let customer = 0;
  for (const t of turns) {
    if (t.speaker === "seller") seller += words(t.text);
    else customer += words(t.text);
  }
  const total = seller + customer || 1;
  return { seller: Math.round((seller / total) * 100), customer: Math.round((customer / total) * 100) };
}

export function weightsValid(config: ScoringConfig) {
  return config.categories.reduce((a, c) => a + c.weight, 0) === 100;
}

// Une la salida del coach con la configuración y calcula el total.
export function assembleEvaluation(args: {
  coach: CoachOutput;
  config: ScoringConfig;
  fields: DiscoveryField[];
  profile: SecretProfile;
  turns: TranscriptTurn[];
}): Evaluation {
  const { coach, config, fields, profile, turns } = args;
  const totalWeight = config.categories.reduce((a, c) => a + c.weight, 0) || 100;
  const activeRules = new Map(config.rules.filter((r) => r.active).map((r) => [r.id, r]));

  const violations = coach.ruleViolations
    .filter((v) => activeRules.has(v.ruleId))
    .map((v) => ({ ...v, description: activeRules.get(v.ruleId)!.description }));

  const categories: CategoryScore[] = config.categories.map((cat) => {
    const found = coach.categories.find((c) => c.key === cat.key);
    let score = Math.max(0, Math.min(cat.weight, Math.round(found?.score ?? 0)));
    // Una categoría con violaciones nunca puede tener la calificación completa.
    const penalty = violations
      .filter((v) => activeRules.get(v.ruleId)?.category === cat.key)
      .reduce((a, v) => a + (activeRules.get(v.ruleId)?.penalty ?? 0), 0);
    if (penalty > 0) score = Math.min(score, Math.max(0, cat.weight - penalty));
    return { key: cat.key, label: cat.label, score, max: cat.weight, justification: found?.justification ?? "" };
  });

  const raw = categories.reduce((a, c) => a + c.score, 0);
  const totalScore = Math.round((raw / totalWeight) * 100);

  const discovery: DiscoveryResult[] = fields.map((f) => {
    const d = coach.discovery.find((x) => x.key === f.key);
    return {
      key: f.key,
      label: f.label,
      discovered: Boolean(d?.discovered),
      partial: Boolean(d?.partial) && !d?.discovered,
      actualValue: profile.facts[f.key] ?? "",
      sellerLearned: d?.sellerLearned ?? "",
      evidenceTurn: d?.evidenceTurn ?? null,
    };
  });

  return {
    totalScore,
    rating: ratingLabel(totalScore),
    summary: coach.summary,
    categories,
    discovery,
    strengths: coach.strengths,
    improvements: coach.improvements,
    missedQuestions: coach.missedQuestions,
    goodQuestions: coach.goodQuestions,
    missedOpportunities: coach.missedOpportunities,
    strongestMoment: coach.strongestMoment,
    weakestMoment: coach.weakestMoment,
    goldenQuestion: coach.goldenQuestion,
    purchaseProbability: {
      before: profile.initialPurchaseProbability,
      after: Math.round(coach.purchaseProbabilityAfter),
      factors: coach.probabilityFactors,
    },
    improvedConversation: coach.improvedConversation.slice(0, 5),
    ruleViolations: violations,
    manualSteps: coach.manualSteps,
    outcome: coach.outcome,
    outcomeExplanation: coach.outcomeExplanation,
    questionsBeforeRecommendation: coach.questionsBeforeRecommendation,
    productRecommended: coach.productRecommended,
    productFit: coach.productFit,
    talkRatio: talkRatio(turns),
  };
}

export const OUTCOME_LABEL: Record<Evaluation["outcome"], string> = {
  payment: "Pago o anticipo",
  next_step: "Siguiente paso con fecha",
  discarded: "Descartado",
  open: "Llamada abierta",
};
