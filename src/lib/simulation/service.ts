import "server-only";

import { getAIProvider, getEvaluationProvider } from "@/lib/ai";
import { HttpError } from "@/lib/auth";
import { getScoringConfig, listDifficulties, listDocuments, listProducts, listScenarios } from "@/lib/data/catalog";
import {
  getOwnSimulation,
  getSecret,
  getTurns,
  insertTurn,
  updateSecretState,
  updateSimulation,
} from "@/lib/data/simulations";
import { documentsToText } from "@/lib/knowledge/context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomerState, Profile, SecretProfile, Simulation } from "@/lib/types";
import { buildCustomerMessages, buildCustomerSystemPrompt, cleanSpoken, MetaStreamSplitter, type TurnEvent } from "./customer-agent";
import { interruptionThresholdWords, pick } from "./personality";
import { buildPrepBrief, buildVoiceHint, customerLabel } from "./prep-brief";
import { applicableFields, generateSecretProfile } from "./profile-generator";

// Orquestador del motor de simulación. Las rutas API sólo llaman aquí.

const MAX_TURNS = 240;
const MAX_SELLER_CHARS = 2000;

export interface CreateSimulationInput {
  scenarioKey: string; // "random" para aleatorio
  difficultyKey: string;
  prepMode: "prep" | "cold";
  presetId?: string | null;
}

export async function createSimulation(user: Profile, input: CreateSimulationInput): Promise<Simulation> {
  const [scenarios, difficulties, products, docs, config] = await Promise.all([
    listScenarios({ activeOnly: true }),
    listDifficulties(),
    listProducts({ activeOnly: true }),
    listDocuments({ activeOnly: true }),
    getScoringConfig(),
  ]);
  if (!scenarios.length || !difficulties.length || !products.length) {
    throw new HttpError(400, "Falta cargar el contenido inicial (productos, escenarios y dificultades). Pídele a un admin que entre a Admin.");
  }

  let profile: SecretProfile;
  let scenario = input.scenarioKey === "random" ? pick(scenarios) : scenarios.find((s) => s.key === input.scenarioKey);
  let difficulty = difficulties.find((d) => d.key === input.difficultyKey);

  if (input.presetId) {
    const db = createAdminClient();
    const { data: preset } = await db.from("preset_profiles").select("*").eq("id", input.presetId).eq("active", true).maybeSingle();
    if (!preset) throw new HttpError(404, "Perfil predeterminado no encontrado");
    profile = preset.profile as SecretProfile;
    scenario = scenarios.find((s) => s.key === preset.scenario_key) ?? scenario ?? scenarios[0];
    difficulty = difficulties.find((d) => d.key === preset.difficulty_key) ?? difficulty;
  } else {
    if (!scenario) throw new HttpError(400, "Escenario inválido");
    if (!difficulty) throw new HttpError(400, "Dificultad inválida");
    const ai = await getAIProvider();
    profile = await generateSecretProfile({ ai, scenario, difficulty, products, docs, fields: config.discovery_fields });
  }
  if (!scenario || !difficulty) throw new HttpError(400, "Escenario o dificultad inválidos");

  const db = createAdminClient();
  const { data: sim, error } = await db
    .from("simulations")
    .insert({
      user_id: user.id,
      scenario_key: scenario.key,
      scenario_name: scenario.name,
      difficulty_key: difficulty.key,
      difficulty_name: difficulty.name,
      prep_mode: input.prepMode,
      status: "ready",
      customer_name: profile.name,
      customer_label: customerLabel(profile, scenario.name),
      prep_brief: input.prepMode === "prep" ? buildPrepBrief(profile, difficulty) : null,
      voice_hint: buildVoiceHint(profile),
    })
    .select("*")
    .single();
  if (error) throw error;

  const state: CustomerState = { purchaseIntent: profile.params.purchaseIntent, mood: "neutral", revealed: [], turns: 0 };
  const { error: secretError } = await db
    .from("simulation_secrets")
    .insert({ simulation_id: sim.id, profile, customer_state: state, discovery_live: {} });
  if (secretError) throw secretError;

  return sim as Simulation;
}

/** Comportamiento que el navegador necesita saber (sin revelar el perfil). */
export function clientCallConfig(profile: SecretProfile) {
  return { interruptAfterWords: interruptionThresholdWords(profile.params) };
}

export async function startSimulation(user: Profile, id: string) {
  const sim = await getOwnSimulation(id, user);
  const secret = await getSecret(id);
  const turns = await getTurns(id);
  let startedAt = sim.started_at;
  if (sim.status === "ready") {
    startedAt = new Date().toISOString();
    await updateSimulation(id, { status: "in_progress", started_at: startedAt });
  } else if (sim.status !== "in_progress") {
    throw new HttpError(409, "Esta simulación ya terminó.");
  }
  let greeting = turns.find((t) => t.speaker === "customer" && t.seq === 1);
  if (!greeting) {
    greeting = await insertTurn(id, {
      seq: 1,
      speaker: "customer",
      text: secret.profile.greeting || "¿Bueno?",
      t_offset_ms: 0,
      meta: { event: "start" },
    });
  }
  const resumed = turns.length > 1;
  return {
    greeting,
    turns: resumed ? turns.map(({ seq, speaker, text, t_offset_ms }) => ({ seq, speaker, text, t_offset_ms })) : [],
    elapsedMs: resumed && startedAt ? Date.now() - new Date(startedAt).getTime() : 0,
    config: clientCallConfig(secret.profile),
  };
}

export interface TurnInput {
  sellerText?: string;
  tOffsetMs: number;
  event: TurnEvent;
  customerInterrupts?: boolean;
  /** El vendedor interrumpió la respuesta anterior del cliente. */
  interruption?: { seq: number; spokenText: string } | null;
}

export type TurnStreamEvent =
  | { type: "seller"; seq: number }
  | { type: "text"; text: string }
  | { type: "done"; seq: number; text: string; hangup: boolean }
  | { type: "error"; message: string };

export async function* runCustomerTurn(user: Profile, id: string, input: TurnInput): AsyncGenerator<TurnStreamEvent> {
  const sim = await getOwnSimulation(id, user);
  if (sim.status !== "in_progress") throw new HttpError(409, "La llamada no está activa.");

  const [secret, difficulties, config, products, docs] = await Promise.all([
    getSecret(id),
    listDifficulties(),
    getScoringConfig(),
    listProducts({ activeOnly: true }),
    listDocuments({ activeOnly: true }),
  ]);

  if (input.interruption) await applyInterruption(id, input.interruption);

  let turns = await getTurns(id);
  if (turns.length >= MAX_TURNS) throw new HttpError(409, "Se alcanzó el máximo de turnos de esta llamada.");
  let nextSeq = (turns[turns.length - 1]?.seq ?? 0) + 1;

  const sellerText = (input.sellerText ?? "").trim().slice(0, MAX_SELLER_CHARS);
  if (input.event === "turn") {
    if (!sellerText) throw new HttpError(400, "Texto vacío");
    const sellerTurn = await insertTurn(id, {
      seq: nextSeq,
      speaker: "seller",
      text: sellerText,
      t_offset_ms: Math.max(0, Math.round(input.tOffsetMs)),
      meta: { event: "turn" },
    });
    turns = [...turns, sellerTurn];
    nextSeq += 1;
    yield { type: "seller", seq: sellerTurn.seq };
  }

  const difficulty = difficulties.find((d) => d.key === sim.difficulty_key) ?? difficulties[0];
  const fields = applicableFields(config.discovery_fields, secret.profile.segment);
  const state = secret.customer_state;
  const customerKnowledge = documentsToText(docs, { purpose: "customer", maxChars: 12_000 });
  const system = buildCustomerSystemPrompt({ profile: secret.profile, difficulty, fields, products, state, customerKnowledge });
  const messages = buildCustomerMessages(turns, input.event, { customerInterrupts: input.customerInterrupts });

  const ai = await getAIProvider();
  const splitter = new MetaStreamSplitter();
  for await (const chunk of ai.streamText({
    purpose: "customer",
    system,
    messages,
    temperature: 0.9,
    maxOutputTokens: 400,
    mockContext: { profile: secret.profile, state, fields },
  })) {
    const out = splitter.push(chunk);
    if (out) yield { type: "text", text: out };
  }
  const { spoken, meta, rest } = splitter.finish();
  if (rest) yield { type: "text", text: rest };

  const text = spoken || "Mmm.";
  const customerTurn = await insertTurn(id, {
    seq: nextSeq,
    speaker: "customer",
    text,
    t_offset_ms: Math.max(0, Math.round(input.tOffsetMs)),
    meta: {
      event: input.event,
      revealed: meta?.revealed ?? [],
      purchaseIntent: meta?.intent,
      mood: meta?.mood,
      hangup: meta?.hangup ?? false,
      customerInterrupted: input.customerInterrupts ?? false,
    },
  });

  // Estado oculto del cliente y descubrimiento en vivo
  const validKeys = new Set(fields.map((f) => f.key));
  const newlyRevealed = (meta?.revealed ?? []).filter((k) => validKeys.has(k));
  const discovery = { ...secret.discovery_live };
  for (const k of newlyRevealed) if (!discovery[k]) discovery[k] = { turn: customerTurn.seq };
  const newState: CustomerState = {
    purchaseIntent: meta?.intent ?? state.purchaseIntent,
    mood: meta?.mood || state.mood,
    revealed: Array.from(new Set([...state.revealed, ...newlyRevealed])),
    turns: state.turns + 1,
  };
  await updateSecretState(id, { customer_state: newState, discovery_live: discovery });

  yield { type: "done", seq: customerTurn.seq, text, hangup: Boolean(meta?.hangup) };
}

async function applyInterruption(id: string, interruption: { seq: number; spokenText: string }) {
  const db = createAdminClient();
  const spoken = cleanSpoken(interruption.spokenText);
  const { data: turn } = await db
    .from("simulation_turns")
    .select("id, speaker, meta")
    .eq("simulation_id", id)
    .eq("seq", interruption.seq)
    .maybeSingle();
  if (!turn || turn.speaker !== "customer") return;
  if (!spoken) {
    // El cliente no llegó a hablar: el turno no existió.
    await db.from("simulation_turns").delete().eq("id", turn.id);
    return;
  }
  await db
    .from("simulation_turns")
    .update({ text: spoken, meta: { ...(turn.meta ?? {}), interrupted: true } })
    .eq("id", turn.id);
}

export async function endSimulation(
  user: Profile,
  id: string,
  input: { durationSeconds: number; interruption?: { seq: number; spokenText: string } | null },
) {
  const sim = await getOwnSimulation(id, user);
  if (sim.status === "completed" || sim.status === "evaluating") return sim;
  if (input.interruption) await applyInterruption(id, input.interruption);
  const turns = await getTurns(id);
  const sellerTurns = turns.filter((t) => t.speaker === "seller").length;
  const startedAt = sim.started_at ? new Date(sim.started_at).getTime() : Date.now();
  const serverDuration = Math.round((Date.now() - startedAt) / 1000);
  const duration = Math.max(0, Math.min(serverDuration + 5, Math.round(input.durationSeconds || serverDuration)));

  if (sellerTurns === 0) {
    await updateSimulation(id, {
      status: "abandoned",
      ended_at: new Date().toISOString(),
      duration_seconds: duration,
      error: "La llamada terminó sin intervenciones del vendedor.",
    });
    return { ...sim, status: "abandoned" as const };
  }
  await updateSimulation(id, { status: "evaluating", ended_at: new Date().toISOString(), duration_seconds: duration, error: null });
  return { ...sim, status: "evaluating" as const };
}

export async function evaluateSimulation(id: string) {
  const db = createAdminClient();
  const { data: sim } = await db.from("simulations").select("*").eq("id", id).single();
  try {
    const [secret, turns, config, products, docs] = await Promise.all([
      getSecret(id),
      getTurns(id),
      getScoringConfig(),
      listProducts({ activeOnly: true }),
      listDocuments({ activeOnly: true }),
    ]);
    const evaluator = await getEvaluationProvider();
    const evaluation = await evaluator.evaluate({
      turns,
      profile: secret.profile,
      state: secret.customer_state,
      config,
      products,
      docs,
      scenarioName: sim.scenario_name,
      difficultyName: sim.difficulty_name,
      durationSeconds: sim.duration_seconds ?? 0,
      prepBriefShown: sim.prep_mode === "prep",
    });
    await updateSimulation(id, {
      status: "completed",
      score: evaluation.totalScore,
      rating: evaluation.rating,
      category_scores: evaluation.categories,
      outcome: evaluation.outcome,
      evaluation,
      error: null,
    });
  } catch (err) {
    console.error("evaluateSimulation", err);
    await updateSimulation(id, {
      status: "failed",
      error: err instanceof Error ? err.message : "No se pudo evaluar la llamada.",
    });
  }
}

export async function retryEvaluation(user: Profile, id: string) {
  const sim = await getOwnSimulation(id, user);
  if (sim.status !== "failed") throw new HttpError(409, "Esta simulación no necesita reevaluarse.");
  await updateSimulation(id, { status: "evaluating", error: null });
}

export async function submitFollowup(user: Profile, id: string, message: string) {
  const sim = await getOwnSimulation(id, user);
  if (sim.status !== "completed" || !sim.evaluation) throw new HttpError(409, "Primero debe terminar la evaluación de la llamada.");
  const clean = message.trim().slice(0, 3000);
  if (clean.length < 10) throw new HttpError(400, "Escribe el mensaje completo.");
  const [secret, docs] = await Promise.all([getSecret(id), listDocuments({ activeOnly: true })]);
  const evaluator = await getEvaluationProvider();
  const followup = await evaluator.evaluateFollowup({ message: clean, evaluation: sim.evaluation, profile: secret.profile, docs });
  await updateSimulation(id, { followup_message: clean, followup_evaluation: followup });
  return followup;
}

