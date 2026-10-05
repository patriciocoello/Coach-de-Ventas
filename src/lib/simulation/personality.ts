import {
  PERSONALITY_KEYS,
  type DifficultyLevel,
  type ParamRanges,
  type PersonalityKey,
  type PersonalityParams,
} from "@/lib/types";

// Motor de personalidad: genera parámetros 0-100 a partir de la dificultad y
// los traduce a instrucciones concretas de comportamiento para el agente.

export const PERSONALITY_LABELS: Record<PersonalityKey, string> = {
  talkativeness: "Locuacidad",
  skepticism: "Escepticismo",
  priceSensitivity: "Sensibilidad al precio",
  technicalKnowledge: "Conocimiento técnico",
  urgency: "Urgencia",
  brandAwareness: "Conocimiento de la marca",
  patience: "Paciencia",
  decisionAuthority: "Autoridad de decisión",
  purchaseIntent: "Intención de compra",
  competitorExposure: "Exposición a competidores",
};

const DEFAULT_RANGE: [number, number] = [30, 70];

export function randomInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sample<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length && out.length < n) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
}

export function generateParams(difficulty: DifficultyLevel): PersonalityParams {
  const ranges = (difficulty.param_ranges ?? {}) as Partial<ParamRanges>;
  const params = {} as PersonalityParams;
  for (const key of PERSONALITY_KEYS) {
    const [min, max] = ranges[key] ?? DEFAULT_RANGE;
    params[key] = randomInt(Math.min(min, max), Math.max(min, max));
  }
  return params;
}

// Catálogo de comportamientos posibles. En cada simulación se eligen sólo
// algunos, ponderados por la personalidad, para que no todas las llamadas se
// sientan iguales.
const BEHAVIORS: { id: string; text: string; weight: (p: PersonalityParams) => number }[] = [
  { id: "interrupt", text: "Interrumpes al vendedor si se extiende demasiado o recita características.", weight: (p) => 100 - p.patience },
  { id: "drift", text: "Desvías ligeramente la conversación hacia algo personal o de tu negocio una o dos veces.", weight: (p) => p.talkativeness },
  { id: "early_price", text: "Preguntas el precio muy pronto, antes de que el vendedor termine de entenderte.", weight: (p) => p.priceSensitivity },
  { id: "discount", text: "Pides descuento o mejores condiciones en algún momento.", weight: (p) => p.priceSensitivity },
  { id: "compare", text: "Comparas con otra opción que viste (más barata o con otra característica).", weight: (p) => p.competitorExposure },
  { id: "doubts", text: "Tienes dudas genuinas sobre si realmente lo vas a usar o si vale la pena.", weight: (p) => p.skepticism },
  { id: "impatience", text: "Muestras impaciencia si sientes que la llamada no avanza ('¿Pero cuánto cuesta?', 'Ando un poco apurado').", weight: (p) => 100 - p.patience },
  { id: "unsure_need", text: "No sabes bien qué necesitas; necesitas que el vendedor te oriente con preguntas.", weight: (p) => 100 - p.technicalKnowledge },
  { id: "contradict", text: "Te contradices ligeramente una vez como persona real (p. ej. primero dices que es sólo para ti y después mencionas a tu pareja).", weight: () => 35 },
  { id: "buying_signals", text: "Das señales de compra cuando el vendedor conecta con lo que te importa ('¿Y cuánto tarda en llegar?', 'Eso sí me gusta').", weight: (p) => p.purchaseIntent },
  { id: "resistance", text: "Muestras resistencia inicial a dar información ('¿Para qué necesitas saber eso?').", weight: (p) => p.skepticism },
  { id: "technical", text: "Haces preguntas técnicas precisas (consumo, temperatura, tiempos de enfriamiento, garantía).", weight: (p) => p.technicalKnowledge },
];

export function pickBehaviors(params: PersonalityParams): string[] {
  const count = randomInt(3, 5);
  const pool = BEHAVIORS.map((b) => ({ ...b, score: b.weight(params) * (0.5 + Math.random()) }));
  pool.sort((a, b) => b.score - a.score);
  return pool.slice(0, count).map((b) => b.text);
}

const level = (v: number) => (v >= 75 ? "muy alto" : v >= 55 ? "alto" : v >= 35 ? "medio" : v >= 15 ? "bajo" : "muy bajo");

// Traduce los parámetros a reglas que el modelo puede seguir.
export function describeParams(p: PersonalityParams): string {
  const lines: string[] = [];

  if (p.talkativeness >= 70) lines.push("Hablas con soltura: respuestas de 1 a 3 frases, a veces cuentas una anécdota corta.");
  else if (p.talkativeness >= 40) lines.push("Respuestas normales: casi siempre 1 o 2 frases cortas.");
  else if (p.talkativeness >= 20) lines.push("Eres de pocas palabras: casi siempre una frase corta, a veces sólo 'sí', 'no' o 'más o menos'.");
  else lines.push("Eres muy parco: respuestas de 1 a 6 palabras. Sólo te extiendes si una pregunta te interesa de verdad.");

  if (p.skepticism >= 70) lines.push("Desconfías de afirmaciones sin sustento y pides pruebas o detalles.");
  else if (p.skepticism >= 45) lines.push("Eres algo cauteloso; no te convences con frases genéricas.");

  if (p.priceSensitivity >= 70) lines.push("El precio es tu principal filtro; reaccionas fuerte a montos altos.");
  else if (p.priceSensitivity >= 45) lines.push("El precio te importa, pero pesa más que te resuelva lo que necesitas.");
  else lines.push("El precio no es tu mayor preocupación si el producto es el correcto.");

  if (p.technicalKnowledge >= 65) lines.push("Sabes de cold plunge y de especificaciones; detectas datos incorrectos o vagos.");
  else if (p.technicalKnowledge < 35) lines.push("Sabes poco del tema; algunos términos técnicos te confunden.");

  if (p.urgency >= 70) lines.push("Tienes prisa por tenerlo pronto (pero sólo lo dices si te preguntan por fechas o si algo se tarda).");
  else if (p.urgency < 30) lines.push("No tienes ninguna prisa; 'apenas estoy viendo opciones'.");

  if (p.brandAwareness >= 65) lines.push("Ya conocías Mente Fría y tienes buena impresión de la marca.");
  else if (p.brandAwareness < 30) lines.push("Casi no conoces la marca.");

  if (p.patience < 35) lines.push("Tienes poca paciencia: si el vendedor habla mucho o da vueltas, lo dejas ver y buscas terminar la llamada.");
  else if (p.patience >= 75) lines.push("Eres paciente y das espacio al vendedor.");

  if (p.decisionAuthority < 40) lines.push("No decides solo: necesitas consultarlo con otra persona (sólo lo dices si te preguntan o cuando te piden cerrar).");
  else if (p.decisionAuthority >= 80) lines.push("Tú tomas la decisión final.");

  if (p.competitorExposure >= 60) lines.push("Ya viste o cotizaste otras opciones y las tienes presentes.");

  lines.push(`Intención de compra inicial: ${level(p.purchaseIntent)} (${p.purchaseIntent}/100).`);
  return lines.map((l) => `- ${l}`).join("\n");
}

// Cuántas palabras puede decir el vendedor antes de que este cliente lo interrumpa.
export function interruptionThresholdWords(p: PersonalityParams): number | null {
  if (p.patience >= 60) return null;
  return Math.round(45 + p.patience * 1.6); // entre ~45 y ~140 palabras
}
