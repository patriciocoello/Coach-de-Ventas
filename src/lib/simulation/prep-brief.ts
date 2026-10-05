import type { DifficultyLevel, PrepBrief, SecretProfile, VoiceHint } from "@/lib/types";

// Ficha de preparación (paso A del manual): sólo lo que un vendedor real
// tendría antes de marcar. Nunca incluye presupuesto, necesidad, objeciones ni
// producto recomendado.

const MODEL_KEYWORDS: [RegExp, string][] = [
  [/\bone\b/i, "MF ONE"],
  [/\bhorizon\b/i, "MF Horizon"],
  [/\bbarrel\b/i, "MF Barrel"],
  [/\bsteel\b/i, "MF Steel"],
  [/\btwo\b/i, "MF Two"],
  [/\bsauna|huum|harvia\b/i, "Sauna"],
];

export function buildPrepBrief(profile: SecretProfile, difficulty: DifficultyLevel): PrepBrief {
  const detail = difficulty.prep_detail;
  const message = detail === "minimal" ? (Math.random() < 0.5 ? profile.prepMessage : null) : profile.prepMessage;
  const mentioned = MODEL_KEYWORDS.find(([re]) => re.test(message ?? ""))?.[1] ?? null;
  return {
    name: profile.name,
    source: profile.source,
    customerType: detail === "minimal" ? null : profile.segment === "commercial" ? profile.customerType : detail === "full" ? profile.customerType : null,
    city: detail === "full" ? profile.city : null,
    message,
    previousConversation: null,
    productMentioned: mentioned,
    callObjective:
      "Entender qué necesita, recomendar el producto correcto y salir con pago/anticipo, siguiente paso con fecha y hora con todos los que deciden, o descartado.",
  };
}

export function buildVoiceHint(profile: SecretProfile): VoiceHint {
  const p = profile.params;
  // Personas impacientes hablan un poco más rápido; personas mayores, un poco más lento.
  const rate = 1 + (50 - p.patience) / 400 - (profile.age > 55 ? 0.05 : 0);
  return {
    gender: profile.gender,
    rate: Math.round(Math.min(1.15, Math.max(0.9, rate)) * 100) / 100,
    pitch: profile.gender === "female" ? 1.05 : 0.95,
  };
}

export function customerLabel(profile: SecretProfile, scenarioName: string): string {
  const first = profile.name.split(" ")[0];
  return `${first} — ${scenarioName}`;
}
