import "server-only";

import { z } from "zod";
import type { AIProvider } from "@/lib/ai/types";
import { catalogToText, documentsToText } from "@/lib/knowledge/context";
import type {
  DifficultyLevel,
  DiscoveryField,
  KnowledgeDocument,
  PersonalityParams,
  Product,
  Scenario,
  SecretProfile,
} from "@/lib/types";
import { describeParams, generateParams, pick, pickBehaviors, randomInt } from "./personality";

// ---------------------------------------------------------------------------
// Datos que decide el código (no el modelo) para garantizar variedad.
// ---------------------------------------------------------------------------
const FEMALE = ["Ana", "Mariana", "Sofía", "Daniela", "Valeria", "Fernanda", "Gabriela", "Lucía", "Paola", "Andrea", "Regina", "Ximena", "Claudia", "Mónica", "Carla", "Renata", "Isabel", "Natalia"];
const MALE = ["Carlos", "Alejandro", "Diego", "Rodrigo", "Javier", "Luis", "Andrés", "Santiago", "Emilio", "Ricardo", "Fernando", "Mauricio", "Jorge", "Pablo", "Sergio", "Eduardo", "Tomás", "Héctor"];
const SURNAMES = ["García", "Martínez", "Hernández", "López", "González", "Rodríguez", "Pérez", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Morales", "Vázquez", "Castillo", "Ortega", "Ruiz", "Mendoza", "Aguilar", "Navarro"];
const CITIES = [
  "Ciudad de México", "Ciudad de México", "Ciudad de México", "Estado de México (Interlomas)", "Querétaro", "Cuernavaca",
  "Puebla", "Guadalajara", "Monterrey", "San Miguel de Allende", "Valle de Bravo", "Mérida", "Tulum", "León", "Toluca", "Cancún",
];
const SOURCES_BY_SCENARIO: Record<string, string[]> = {
  instagram: ["Instagram (anuncio)", "Instagram (reel)", "Instagram (DM)"],
  referido: ["Referido por un cliente"],
};
const SOURCES = ["Instagram", "Instagram", "Página web", "WhatsApp", "Google", "Referido", "Facebook", "TikTok", "Evento / expo"];

export interface ProfileSeedChoices {
  name: string;
  gender: "female" | "male";
  age: number;
  city: string;
  source: string;
  params: PersonalityParams;
  behaviors: string[];
}

export function rollSeed(scenario: Scenario, difficulty: DifficultyLevel): ProfileSeedChoices {
  const gender = Math.random() < 0.5 ? "female" : "male";
  const first = pick(gender === "female" ? FEMALE : MALE);
  const params = generateParams(difficulty);
  const commercial = scenario.segment === "commercial";
  return {
    gender,
    name: `${first} ${pick(SURNAMES)}`,
    age: commercial ? randomInt(30, 58) : randomInt(26, 62),
    city: pick(CITIES),
    source: pick(SOURCES_BY_SCENARIO[scenario.key] ?? SOURCES),
    params,
    behaviors: pickBehaviors(params),
  };
}

// ---------------------------------------------------------------------------
// Schema que llena el modelo
// ---------------------------------------------------------------------------
const str = z.string().catch("");
const strArr = z.array(z.string()).catch([]);

export const GeneratedProfileSchema = z.object({
  profession: str,
  customerType: str,
  segment: z.enum(["residential", "commercial"]).catch("residential"),
  personalitySummary: str,
  speakingStyle: str,
  greeting: str,
  lookingFor: str,
  mainProblem: str,
  motivation: str,
  experience: str,
  recommendedProduct: str,
  recommendedProductReason: str,
  alternativeProduct: z.string().nullable().catch(null),
  installationPlace: str,
  indoorOutdoor: str,
  availableSpace: str,
  restrictions: str,
  budget: z.coerce.number().nullable().catch(null),
  budgetText: str,
  targetDate: str,
  urgency: str,
  decisionMaker: str,
  othersInvolved: str,
  competitors: str,
  knowledgeLevel: str,
  objections: strArr,
  hiddenObjection: str,
  priorities: strArr,
  fears: strArr,
  valuedFeatures: strArr,
  uninterestingFeatures: strArr,
  initialPurchaseProbability: z.coerce.number().min(0).max(100).catch(50),
  closingConditions: str,
  hiddenInfo: z.array(z.object({ info: str, revealWhen: str })).catch([]),
  buyingSignals: strArr,
  prepMessage: z.string().nullable().catch(null),
  facts: z.array(z.object({ key: str, value: str })).catch([]),
});

export type GeneratedProfile = z.infer<typeof GeneratedProfileSchema>;

export function applicableFields(fields: DiscoveryField[], segment: "residential" | "commercial") {
  return fields.filter((f) => f.appliesTo === "all" || f.appliesTo === segment);
}

function buildPrompt(args: {
  scenario: Scenario;
  difficulty: DifficultyLevel;
  seed: ProfileSeedChoices;
  products: Product[];
  docs: KnowledgeDocument[];
  fields: DiscoveryField[];
}) {
  const { scenario, difficulty, seed, products, docs, fields } = args;
  const competitorDocs = docs.filter((d) => d.category === "competitors" && d.active);
  return `Eres un diseñador de simulaciones de venta para Mente Fría (tinas de agua fría / cold plunge y saunas en México).
Crea la FICHA SECRETA de un prospecto ficticio, realista y coherente, para entrenar vendedores. La ficha nunca se le muestra al vendedor durante la llamada.

## Datos fijos (respétalos)
- Nombre: ${seed.name} (${seed.gender === "female" ? "mujer" : "hombre"}), ${seed.age} años
- Ciudad: ${seed.city}
- Canal de llegada: ${seed.source}
- Escenario: ${scenario.name} — ${scenario.description}
- Guía del escenario: ${scenario.prompt_hints || "—"}
- Segmento sugerido: ${scenario.segment}
- Dificultad: ${difficulty.name} — ${difficulty.description}
- Personalidad (0-100): ${JSON.stringify(seed.params)}
${describeParams(seed.params)}

## Catálogo oficial (única fuente de verdad sobre productos)
${catalogToText(products, "brief")}
${competitorDocs.length ? `\n## Competidores documentados\n${documentsToText(competitorDocs, { purpose: "evaluation", maxChars: 8000 })}` : ""}

## Reglas
- "recommendedProduct" DEBE ser exactamente un slug del catálogo y debe encajar de verdad con la necesidad, espacio, uso, calor/frío, urgencia y presupuesto del prospecto. Productos sugeridos para el escenario (no obligatorios): ${scenario.likely_products.join(", ") || "—"}.
- Si el prospecto es un negocio (segment "commercial"), el producto recomendado NUNCA puede llevar Motor Pro.
- "alternativeProduct": slug de una alternativa razonable o null.
- No inventes características ni precios de Mente Fría. Para competidores no uses marcas reales: descríbelos genéricamente ("una tina inflable de Amazon de $25,000", "otra marca mexicana", "baños de hielo en el gym").
- "budget" en MXN (número) o null si de verdad no tiene presupuesto definido; "budgetText" es cómo lo diría el cliente.
- "greeting": cómo contesta el teléfono (ej. "¿Bueno?", "¿Sí, diga?", "Hola, ¿quién habla?"). Corto.
- "speakingStyle": muletillas y forma de hablar en español mexicano coherentes con su edad y profesión.
- "prepMessage": si llegó por mensaje (Instagram, WhatsApp, web), el texto corto que mandó antes de la llamada (puede o no mencionar un modelo); si no, null.
- "objections": 1 a 4 objeciones que puede expresar. "hiddenObjection": la preocupación real que NO dice a menos que el vendedor indague bien.
- "hiddenInfo": 3 a 6 datos que sólo revela si el vendedor pregunta correctamente; "revealWhen" describe qué tipo de pregunta lo destapa.
- "initialPurchaseProbability" coherente con la dificultad y la intención de compra (${seed.params.purchaseIntent}).
- "closingConditions": qué tendría que pasar para que compre o acepte un siguiente paso en esta llamada (sé específico, p. ej. "que le confirmen que cabe por la puerta del jardín y que su esposa esté en la siguiente llamada").
- "facts": un elemento por cada campo de descubrimiento listado abajo, con el valor verdadero desde la perspectiva del cliente (corto y concreto). Si no aplica, escribe "No aplica".
- Dificultad alta = información más escondida, más objeciones y condiciones de cierre más exigentes.
- Todo en español de México.

## Campos de descubrimiento (para "facts")
${fields.map((f) => `- ${f.key}: ${f.label} — ${f.description}`).join("\n")}

Devuelve sólo el JSON.`;
}

export async function generateSecretProfile(args: {
  ai: AIProvider;
  scenario: Scenario;
  difficulty: DifficultyLevel;
  products: Product[];
  docs: KnowledgeDocument[];
  fields: DiscoveryField[];
}): Promise<SecretProfile> {
  const seed = rollSeed(args.scenario, args.difficulty);
  const productSlugs = new Set(args.products.map((p) => p.slug));
  const fields = applicableFields(args.fields, args.scenario.segment === "commercial" ? "commercial" : "residential");

  const generated = await args.ai.generateJSON({
    purpose: "profile",
    system: "Generas fichas de prospectos ficticios para simulaciones de venta. Respondes sólo con JSON válido.",
    messages: [{ role: "user", content: buildPrompt({ ...args, seed, fields: args.scenario.segment === "both" ? args.fields : fields }) }],
    temperature: 1,
    schema: GeneratedProfileSchema,
    mockContext: { seed, scenario: args.scenario, products: args.products, fields: args.fields },
  });

  return finalizeProfile(generated, seed, productSlugs, args.products);
}

export function finalizeProfile(
  g: GeneratedProfile,
  seed: ProfileSeedChoices,
  productSlugs: Set<string>,
  products: Product[],
): SecretProfile {
  // Si el modelo devolvió un slug inexistente, toma el primer producto válido.
  let recommended = g.recommendedProduct;
  if (!productSlugs.has(recommended)) {
    const byName = products.find((p) => p.name.toLowerCase() === recommended.toLowerCase());
    recommended = byName?.slug ?? products.find((p) => p.category.startsWith("Tinas"))?.slug ?? products[0]?.slug ?? "";
  }
  const alternative = g.alternativeProduct && productSlugs.has(g.alternativeProduct) ? g.alternativeProduct : null;
  const facts: Record<string, string> = {};
  for (const f of g.facts) if (f.key) facts[f.key] = f.value;

  return {
    name: seed.name,
    gender: seed.gender,
    age: seed.age,
    city: seed.city,
    source: seed.source,
    params: seed.params,
    behaviors: seed.behaviors,
    profession: g.profession,
    customerType: g.customerType,
    segment: g.segment,
    personalitySummary: g.personalitySummary,
    speakingStyle: g.speakingStyle,
    greeting: g.greeting || "¿Bueno?",
    lookingFor: g.lookingFor,
    mainProblem: g.mainProblem,
    motivation: g.motivation,
    experience: g.experience,
    recommendedProduct: recommended,
    recommendedProductReason: g.recommendedProductReason,
    alternativeProduct: alternative,
    installationPlace: g.installationPlace,
    indoorOutdoor: g.indoorOutdoor,
    availableSpace: g.availableSpace,
    restrictions: g.restrictions,
    budget: g.budget,
    budgetText: g.budgetText,
    targetDate: g.targetDate,
    urgency: g.urgency,
    decisionMaker: g.decisionMaker,
    othersInvolved: g.othersInvolved,
    competitors: g.competitors,
    knowledgeLevel: g.knowledgeLevel,
    objections: g.objections,
    hiddenObjection: g.hiddenObjection,
    priorities: g.priorities,
    fears: g.fears,
    valuedFeatures: g.valuedFeatures,
    uninterestingFeatures: g.uninterestingFeatures,
    initialPurchaseProbability: Math.round(g.initialPurchaseProbability),
    closingConditions: g.closingConditions,
    hiddenInfo: g.hiddenInfo,
    buyingSignals: g.buyingSignals,
    prepMessage: g.prepMessage,
    facts,
  };
}
