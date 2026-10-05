import { z } from "zod";

// Lo que devuelve el modelo coach. El total, la etiqueta y la proporción de
// habla se calculan en código (scoring.ts) para que sean consistentes.

const str = z.string().catch("");
const turn = z.coerce.number().int().nullable().catch(null);

const feedback = z.object({ text: str, turn, quote: z.string().nullable().catch(null) });

export const CoachOutputSchema = z.object({
  summary: str,
  categories: z
    .array(z.object({ key: str, score: z.coerce.number().catch(0), justification: str }))
    .catch([]),
  discovery: z
    .array(
      z.object({
        key: str,
        discovered: z.coerce.boolean().catch(false),
        partial: z.coerce.boolean().catch(false),
        sellerLearned: str,
        evidenceTurn: turn,
      }),
    )
    .catch([]),
  strengths: z.array(feedback).catch([]),
  improvements: z.array(feedback).catch([]),
  missedQuestions: z.array(z.string()).catch([]),
  goodQuestions: z.array(feedback).catch([]),
  missedOpportunities: z
    .array(
      z.object({
        turn,
        customerSaid: str,
        sellerSaid: str,
        explanation: str,
        betterQuestions: z.array(z.string()).catch([]),
      }),
    )
    .catch([]),
  strongestMoment: z.object({ turn, quote: str, explanation: str }).catch({ turn: null, quote: "", explanation: "" }),
  weakestMoment: z.object({ turn, quote: str, explanation: str }).catch({ turn: null, quote: "", explanation: "" }),
  goldenQuestion: z.object({ question: str, why: str }).catch({ question: "", why: "" }),
  purchaseProbabilityAfter: z.coerce.number().min(0).max(100).catch(50),
  probabilityFactors: z.array(z.string()).catch([]),
  improvedConversation: z
    .array(z.object({ turn, customer: str, seller: str, better: str, explanation: str }))
    .catch([]),
  ruleViolations: z.array(z.object({ ruleId: str, turn, quote: z.string().nullable().catch(null) })).catch([]),
  manualSteps: z
    .array(
      z.object({
        step: str,
        name: str,
        status: z.enum(["done", "partial", "missing", "na"]).catch("missing"),
        note: str,
      }),
    )
    .catch([]),
  outcome: z.enum(["payment", "next_step", "discarded", "open"]).catch("open"),
  outcomeExplanation: str,
  questionsBeforeRecommendation: z.coerce.number().int().nullable().catch(null),
  productRecommended: z.string().nullable().catch(null),
  productFit: str,
});

export type CoachOutput = z.infer<typeof CoachOutputSchema>;

export const FollowupOutputSchema = z.object({
  score: z.coerce.number().min(0).max(10).catch(0),
  feedback: str,
  strengths: z.array(z.string()).catch([]),
  improvements: z.array(z.string()).catch([]),
  improvedMessage: str,
});
