import "server-only";

import type { AIProvider } from "@/lib/ai/types";
import { catalogToText, documentsToText } from "@/lib/knowledge/context";
import { applicableFields } from "@/lib/simulation/profile-generator";
import type {
  CustomerState,
  DiscoveryField,
  Evaluation,
  FollowupEvaluation,
  KnowledgeDocument,
  Product,
  ScoringConfig,
  SecretProfile,
  TranscriptTurn,
} from "@/lib/types";
import { CoachOutputSchema, FollowupOutputSchema } from "./schema";
import { assembleEvaluation } from "./scoring";

// SALES COACH: agente independiente del cliente. Recibe transcripción,
// perfil secreto, manual, productos y criterios, y devuelve la evaluación.

export interface EvaluationInput {
  turns: TranscriptTurn[];
  profile: SecretProfile;
  state: CustomerState | null;
  config: ScoringConfig;
  products: Product[];
  docs: KnowledgeDocument[];
  scenarioName: string;
  difficultyName: string;
  durationSeconds: number;
  prepBriefShown: boolean;
}

export interface EvaluationProvider {
  evaluate(input: EvaluationInput): Promise<Evaluation>;
  evaluateFollowup(input: FollowupInput): Promise<FollowupEvaluation>;
}

export interface FollowupInput {
  message: string;
  evaluation: Evaluation;
  profile: SecretProfile;
  docs: KnowledgeDocument[];
}

export function formatTranscript(turns: TranscriptTurn[]) {
  return turns
    .map((t) => {
      const mm = Math.floor(t.t_offset_ms / 60000);
      const ss = Math.floor((t.t_offset_ms % 60000) / 1000);
      const who = t.speaker === "seller" ? "VENDEDOR" : "CLIENTE";
      const flags = [t.meta?.interrupted ? "interrumpido por el vendedor" : "", t.meta?.customerInterrupted ? "el cliente interrumpe" : ""]
        .filter(Boolean)
        .join(", ");
      return `#${t.seq} [${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}] ${who}: ${t.text}${flags ? ` (${flags})` : ""}`;
    })
    .join("\n");
}

function buildCoachPrompt(input: EvaluationInput, fields: DiscoveryField[]) {
  const { config, profile } = input;
  const recommended = input.products.find((p) => p.slug === profile.recommendedProduct);
  const alternative = input.products.find((p) => p.slug === profile.alternativeProduct);
  const { params, ...publicProfile } = profile;

  return `Eres un SALES COACH experto y exigente de Mente Fría. Evalúas una llamada de práctica entre un VENDEDOR y un CLIENTE simulado.
Tu evaluación debe ser específica, basada en evidencia de la transcripción (cita números de turno #n y frases reales) y alineada con el MANUAL DE VENTAS de Mente Fría, que tiene prioridad sobre cualquier criterio genérico.

# PRINCIPIOS
- Lo MÁS importante es si el vendedor hizo las preguntas correctas para perfilar al cliente ANTES de venderle.
- No des puntos por ser amable ni por saber del producto si no entendió al prospecto primero.
- Un dato cuenta como "descubierto" sólo si el vendedor lo obtuvo (preguntando o retomando algo que el cliente dijo) y quedó claro en la conversación. "partial" = se tocó superficialmente.
- Verifica toda afirmación del vendedor contra los documentos oficiales y el catálogo. Si inventó algo (precio, característica, fecha, descuento), es una violación grave.
- El feedback NO puede ser genérico: cada punto debe referirse a algo que pasó (o faltó) en esta llamada concreta, con cita.
- Escribe en español de México, en segunda persona ("preguntaste", "te faltó").
- Si la llamada fue muy corta o el vendedor casi no participó, califica bajo y dilo.

# CONTEXTO DE LA SIMULACIÓN
- Escenario: ${input.scenarioName} · Dificultad: ${input.difficultyName}
- Duración: ${Math.round(input.durationSeconds / 60)} min ${input.durationSeconds % 60} s
- Ficha de preparación mostrada al vendedor: ${input.prepBriefShown ? "sí (nombre, canal, tipo de cliente y mensaje previo si existía)" : "no (llamada en frío)"}
- Intención de compra final registrada en vivo por el cliente simulado: ${input.state?.purchaseIntent ?? "—"}/100

# PERFIL SECRETO DEL CLIENTE (el vendedor no lo veía)
${JSON.stringify(publicProfile, null, 1)}
Parámetros de personalidad: ${JSON.stringify(params)}
Producto que probablemente le conviene: ${recommended ? `${recommended.name} (${recommended.slug})` : profile.recommendedProduct} — ${profile.recommendedProductReason}
${alternative ? `Alternativa razonable: ${alternative.name} (${alternative.slug})` : ""}

# CRITERIOS DE EVALUACIÓN
Califica cada categoría de 0 a su peso máximo. Aplica las penalizaciones dentro de la categoría correspondiente.
${config.categories
  .map(
    (c) =>
      `## ${c.key} · ${c.label} (máx. ${c.weight} pts · pasos del manual: ${c.manualSteps.join(", ")})\n${c.description}\n${c.criteria.map((x) => `- ${x}`).join("\n")}`,
  )
  .join("\n\n")}

# REGLAS / PENALIZACIONES (reporta en ruleViolations con su id SÓLO si ocurrieron)
${config.rules
  .filter((r) => r.active)
  .map((r) => `- ${r.id} (−${r.penalty} en ${r.category}): ${r.description}`)
  .join("\n")}

${config.coach_notes ? `# NOTAS ADICIONALES DEL ADMINISTRADOR\n${config.coach_notes}\n` : ""}
# CAMPOS DE DESCUBRIMIENTO (evalúa TODOS en "discovery", con su key)
${fields.map((f) => `- ${f.key}: ${f.label} (${f.importance}) — valor real: ${profile.facts[f.key] ?? "—"}`).join("\n")}

# PASOS DEL MANUAL (evalúa B a K en "manualSteps"; status: done | partial | missing | na)
B Apertura y quién decide · C Situación actual · D Entender el problema y profundizar · E Resultado deseado · F Calificación · G Presentación de la solución · H Confirmación · I Precio · J Manejo de objeciones · K Cierre

# RESULTADO DE LA LLAMADA ("outcome")
payment = pago o anticipo acordado · next_step = siguiente paso con fecha y hora concretas (con todos los que deciden) · discarded = descartado con claridad · open = cualquier otra cosa (incluye "te mando la cotización" sin fecha).

# QUÉ DEBES ENTREGAR
- summary: 2-3 frases con el diagnóstico general.
- categories: una entrada por categoría (key exacta), score y justificación específica.
- discovery: una entrada por campo de descubrimiento; sellerLearned = lo que el vendedor entendió; evidenceTurn = #turno.
- strengths (3-5) y improvements (3-5): con turno y cita textual.
- goodQuestions: las mejores preguntas que hizo (cita textual en "quote").
- missedQuestions: 4-8 preguntas concretas, tal como las diría, que le faltaron.
- missedOpportunities (2-5): momentos donde el cliente dio una señal y el vendedor no la aprovechó; incluye customerSaid, sellerSaid y 2-3 betterQuestions.
- strongestMoment y weakestMoment: un turno cada uno.
- goldenQuestion: LA pregunta que más habría cambiado esta venta, y por qué.
- purchaseProbabilityAfter (0-100) y probabilityFactors (3-5 factores que la movieron desde ${profile.initialPurchaseProbability}%).
- improvedConversation (3-5): intercambios reales (customer, seller) con una mejor respuesta ("better") y su explicación.
- ruleViolations, manualSteps, outcome, outcomeExplanation.
- questionsBeforeRecommendation: cuántas preguntas de descubrimiento hizo antes de recomendar o explicar producto (null si nunca recomendó).
- productRecommended: el producto que recomendó el vendedor (nombre) o null; productFit: si encajaba con el perfil real y por qué.

# MANUAL DE VENTAS Y DOCUMENTOS OFICIALES (fuente de verdad)
${documentsToText(input.docs, { purpose: "evaluation", maxChars: 90_000 })}

# CATÁLOGO OFICIAL
${catalogToText(input.products, "full")}

# TRANSCRIPCIÓN
${formatTranscript(input.turns)}

Devuelve sólo el JSON.`;
}

export class LLMEvaluationProvider implements EvaluationProvider {
  constructor(private ai: AIProvider) {}

  async evaluate(input: EvaluationInput): Promise<Evaluation> {
    const fields = applicableFields(input.config.discovery_fields, input.profile.segment);
    const coach = await this.ai.generateJSON({
      purpose: "evaluation",
      system:
        "Eres un coach de ventas que evalúa llamadas con rigor y evidencia. Nunca inventas citas: sólo citas frases que aparecen en la transcripción. Respondes sólo con JSON válido.",
      messages: [{ role: "user", content: buildCoachPrompt(input, fields) }],
      temperature: 0.3,
      schema: CoachOutputSchema,
      mockContext: input,
    });
    return assembleEvaluation({ coach, config: input.config, fields, profile: input.profile, turns: input.turns });
  }

  async evaluateFollowup(input: FollowupInput): Promise<FollowupEvaluation> {
    const manual = documentsToText(
      input.docs.filter((d) => d.category === "manual"),
      { purpose: "evaluation", maxChars: 40_000 },
    );
    return this.ai.generateJSON({
      purpose: "followup",
      system: "Eres un coach de ventas de Mente Fría. Respondes sólo con JSON válido.",
      messages: [
        {
          role: "user",
          content: `Evalúa el WhatsApp de seguimiento (paso L del manual) que escribió el vendedor después de la llamada.

Resultado de la llamada: ${input.evaluation.outcome} — ${input.evaluation.outcomeExplanation}
Cliente: ${input.profile.name}. Necesidad: ${input.profile.lookingFor}. Objeción principal: ${input.profile.objections[0] ?? "—"}. Objeción oculta: ${input.profile.hiddenObjection}.
Producto recomendado en la llamada: ${input.evaluation.productRecommended ?? "ninguno"}.

Mensaje del vendedor:
"""${input.message}"""

Evalúa contra la plantilla del paso L que corresponde a ese resultado (pagará ya / cotización con fecha / abierta sin fecha / lost): personalización, uso de lo que dijo el cliente, respuesta a la objeción en 1-2 líneas, fecha y hora propuestas por el vendedor, claridad y tono. score de 0 a 10. improvedMessage: una versión mejorada lista para enviar.

${manual}`,
        },
      ],
      temperature: 0.3,
      schema: FollowupOutputSchema,
      mockContext: input,
    });
  }
}
