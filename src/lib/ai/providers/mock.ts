import "server-only";

import type { AIProvider, GenerateJSONOptions, GenerateOptions, ModelInfo } from "@/lib/ai/types";
import type { EvaluationInput, FollowupInput } from "@/lib/evaluation/coach";
import type { ProfileSeedChoices } from "@/lib/simulation/profile-generator";
import { META_DELIMITER } from "@/lib/simulation/customer-agent";
import type { CustomerState, DiscoveryField, Product, Scenario, SecretProfile } from "@/lib/types";

// Proveedor de demostración: no llama a ninguna API. Sirve para desarrollar y
// probar el flujo completo sin API key (AI_PROVIDER=mock). Sus respuestas son
// simples y deterministas; no sirve para entrenar de verdad.

const KEYWORDS: Record<string, RegExp> = {
  who_for: /para (ti|quién|un negocio|tu casa)|personal|negocio/i,
  attraction: /llam[oó] la atención|cómo (nos )?(conociste|llegaste)/i,
  business_type: /tipo de negocio|a quién atiende/i,
  use_goal: /para qué|objetivo|lograr|usar(í|i)as/i,
  motivation: /por qué ahora|justo ahora|qué te hizo/i,
  problem_impact: /afecta|problema/i,
  experience: /(has|habías) (usado|utilizado|probado)|experiencia|antes/i,
  current_solution: /solución|actualmente|hielo/i,
  location: /dónde|instalar|ubicaci/i,
  indoor_outdoor: /interior|exterior|adentro|afuera|techo/i,
  space: /espacio|medida|metros|cabe/i,
  electrical: /eléctric|contacto|drenaje|corriente/i,
  heating: /calient|calor|calefac/i,
  users_frequency: /cuántas personas|frecuencia|qué tan seguido|diario/i,
  model_interest: /modelo|viste|te gustó/i,
  key_feature: /característica|más importante/i,
  timeline: /cuándo|fecha|para cuándo|urgen/i,
  budget: /presupuesto|inversión|cuánto (quieres|piensas|tienes)|rango/i,
  decision_makers: /alguien más|decisión|decide|socio|pareja|esposa|esposo/i,
  competitors: /otras opciones|otra marca|competencia|comparando|cotizado/i,
  main_concern: /preocupa|duda|miedo/i,
};

export class MockProvider implements AIProvider {
  readonly name = "mock";

  modelFor() {
    return "mock";
  }

  async *streamText(opts: GenerateOptions): AsyncIterable<string> {
    const text = this.customerReply(opts);
    for (const word of text.split(/(?<= )/)) {
      await new Promise((r) => setTimeout(r, 15));
      yield word;
    }
  }

  async generateText(opts: GenerateOptions): Promise<string> {
    if (opts.purpose === "customer") return this.customerReply(opts);
    return "Respuesta de demostración.";
  }

  async generateJSON<T>(opts: GenerateJSONOptions<T>): Promise<T> {
    let obj: unknown = {};
    if (opts.purpose === "profile") obj = this.profile(opts.mockContext as MockProfileContext);
    else if (opts.purpose === "evaluation") obj = this.evaluation(opts.mockContext as EvaluationInput);
    else if (opts.purpose === "followup") obj = this.followup(opts.mockContext as FollowupInput);
    return opts.schema.parse(obj);
  }

  async listModels(): Promise<ModelInfo[]> {
    return [{ id: "mock", label: "Mock (sin IA)" }];
  }

  private customerReply(opts: GenerateOptions): string {
    const ctx = opts.mockContext as { profile: SecretProfile; state: CustomerState; fields: DiscoveryField[] } | undefined;
    const last = [...opts.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (!ctx) return `Mmm, ok.\n${META_DELIMITER}{"revealed":[],"intent":50,"mood":"neutral","hangup":false}`;
    const { profile, state } = ctx;
    const revealed: string[] = [];
    let reply = "";
    if (/silencio|sin decir nada/.test(last)) reply = "¿Hola? ¿Sigues ahí?";
    else if (/adiós|hasta luego|bye|gracias por tu tiempo/i.test(last)) reply = "Va, gracias. Hasta luego.";
    else if (/precio|cuesta|inversión es/i.test(last) && /\$|mil/.test(last)) reply = "Mmm, está más alto de lo que pensaba.";
    else {
      for (const [key, re] of Object.entries(KEYWORDS)) {
        if (re.test(last) && profile.facts[key]) {
          revealed.push(key);
          reply = profile.facts[key];
          break;
        }
      }
      if (!reply) reply = /\?/.test(last) || /qué|cómo|dónde|cuál/i.test(last) ? "Mmm, no sé, la verdad." : "Ajá.";
    }
    const intent = Math.min(100, state.purchaseIntent + (revealed.length ? 3 : -1));
    const hangup = /hasta luego/.test(reply);
    return `${reply}\n${META_DELIMITER}${JSON.stringify({ revealed, intent, mood: revealed.length ? "interesado" : "neutral", hangup })}`;
  }

  private profile(ctx: MockProfileContext) {
    const { seed, scenario, products, fields } = ctx;
    const commercial = scenario.segment === "commercial";
    const product = products.find((p) => scenario.likely_products.includes(p.slug)) ?? products[0];
    const facts: Record<string, string> = {
      who_for: commercial ? "Para mi negocio" : "Para mí y mi pareja",
      attraction: "Vi un reel en Instagram y me dio curiosidad",
      business_type: commercial ? `${scenario.name} con unos 80 clientes al día` : "No aplica",
      use_goal: "Recuperación después de entrenar y dormir mejor",
      motivation: "Un amigo empezó a hacerlo y le cambió el sueño",
      problem_impact: "Duermo mal y ando cansado todo el día",
      experience: "Sólo he hecho baños de hielo un par de veces",
      current_solution: "Regaderazos de agua fría",
      location: `En mi casa en ${seed.city}`,
      indoor_outdoor: "En la terraza, techada",
      space: "Como dos metros por uno, no tengo la medida exacta",
      electrical: "Hay contacto cerca, drenaje no sé",
      heating: "Me gustaría que también caliente en invierno",
      users_frequency: "Dos personas, casi diario",
      model_interest: "Vi la Horizon",
      key_feature: "Que no tenga que comprar hielo",
      timeline: "Antes de fin de mes",
      budget: "Como noventa mil pesos",
      decision_makers: "Lo decido con mi pareja",
      competitors: "Vi una inflable más barata en Amazon",
      main_concern: "Que no la use después de un mes",
    };
    return {
      profession: commercial ? "Dueño de negocio" : "Contador",
      customerType: scenario.name,
      segment: commercial ? "commercial" : "residential",
      personalitySummary: "Persona práctica, algo reservada al inicio.",
      speakingStyle: "Usa 'mmm' y 'la verdad'.",
      greeting: "¿Bueno?",
      lookingFor: "Una tina de agua fría para su rutina",
      mainProblem: facts.problem_impact,
      motivation: facts.motivation,
      experience: facts.experience,
      recommendedProduct: product?.slug ?? "",
      recommendedProductReason: "Encaja con su espacio y quiere calor.",
      alternativeProduct: null,
      installationPlace: facts.location,
      indoorOutdoor: facts.indoor_outdoor,
      availableSpace: facts.space,
      restrictions: "Ninguna relevante",
      budget: 90000,
      budgetText: facts.budget,
      targetDate: facts.timeline,
      urgency: "Media",
      decisionMaker: facts.decision_makers,
      othersInvolved: "Su pareja",
      competitors: facts.competitors,
      knowledgeLevel: "Básico",
      objections: ["Está caro", "Lo tengo que platicar con mi pareja"],
      hiddenObjection: facts.main_concern,
      priorities: ["Precio", "Que caliente"],
      fears: ["No usarla"],
      valuedFeatures: ["Calor", "Sin hielo"],
      uninterestingFeatures: ["App"],
      initialPurchaseProbability: seed.params.purchaseIntent,
      closingConditions: "Que su pareja esté en la siguiente llamada",
      hiddenInfo: [{ info: "Su pareja es la que paga", revealWhen: "Si preguntan quién decide" }],
      buyingSignals: ["¿Y cuánto tarda en llegar?"],
      prepMessage: scenario.key === "instagram" ? "Hola, ¿precio de la Horizon?" : null,
      facts: fields.map((f) => ({ key: f.key, value: facts[f.key] ?? "No aplica" })),
    };
  }

  private evaluation(input: EvaluationInput) {
    const sellerText = input.turns.filter((t) => t.speaker === "seller").map((t) => t.text).join(" ");
    const discovered = Object.entries(KEYWORDS).filter(([, re]) => re.test(sellerText)).map(([k]) => k);
    const ratio = discovered.length / Math.max(1, input.config.discovery_fields.length);
    const firstSeller = input.turns.find((t) => t.speaker === "seller");
    return {
      summary: "Evaluación de demostración (proveedor mock). Configura Gemini para una evaluación real.",
      categories: input.config.categories.map((c) => ({
        key: c.key,
        score: Math.round(c.weight * (c.key === "discovery" ? ratio : 0.5 + ratio / 2)),
        justification: "Calificación aproximada del modo demostración.",
      })),
      discovery: input.config.discovery_fields.map((f) => ({
        key: f.key,
        discovered: discovered.includes(f.key),
        partial: false,
        sellerLearned: discovered.includes(f.key) ? input.profile.facts[f.key] ?? "" : "",
        evidenceTurn: null,
      })),
      strengths: firstSeller ? [{ text: "Abriste la conversación.", turn: firstSeller.seq, quote: firstSeller.text }] : [],
      improvements: [{ text: "Profundiza más en el problema antes de recomendar.", turn: null, quote: null }],
      missedQuestions: input.config.discovery_fields.filter((f) => !discovered.includes(f.key)).slice(0, 5).map((f) => f.exampleQuestion),
      goodQuestions: [],
      missedOpportunities: [],
      strongestMoment: { turn: firstSeller?.seq ?? null, quote: firstSeller?.text ?? "", explanation: "Inicio de la llamada." },
      weakestMoment: { turn: null, quote: "", explanation: "—" },
      goldenQuestion: { question: "Además de ti, ¿hay alguien más involucrado en la decisión?", why: "Define el cierre posible." },
      purchaseProbabilityAfter: input.state?.purchaseIntent ?? input.profile.initialPurchaseProbability,
      probabilityFactors: ["Modo demostración"],
      improvedConversation: [],
      ruleViolations: [],
      manualSteps: ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K"].map((s) => ({ step: s, name: s, status: "missing", note: "" })),
      outcome: "open",
      outcomeExplanation: "Modo demostración.",
      questionsBeforeRecommendation: null,
      productRecommended: null,
      productFit: "—",
    };
  }

  private followup(input: FollowupInput) {
    return {
      score: input.message.length > 80 ? 7 : 4,
      feedback: "Evaluación de demostración del WhatsApp.",
      strengths: ["Enviaste el seguimiento."],
      improvements: ["Propón día y hora concretos."],
      improvedMessage: `Hola, ${input.profile.name.split(" ")[0]}. Gracias por tu tiempo…`,
    };
  }
}

interface MockProfileContext {
  seed: ProfileSeedChoices;
  scenario: Scenario;
  products: Product[];
  fields: DiscoveryField[];
}
