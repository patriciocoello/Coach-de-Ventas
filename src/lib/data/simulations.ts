import "server-only";

import { HttpError, isManager } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomerState, Profile, SecretProfile, Simulation, TranscriptTurn } from "@/lib/types";

// Repositorio de simulaciones, transcripciones y perfiles secretos.

export interface SimulationSecret {
  simulation_id: string;
  profile: SecretProfile;
  customer_state: CustomerState;
  discovery_live: Record<string, { turn: number }>;
}

export async function getSimulationFor(id: string, viewer: Profile): Promise<Simulation> {
  const db = createAdminClient();
  const { data, error } = await db.from("simulations").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Simulación no encontrada");
  if (data.user_id !== viewer.id && !isManager(viewer)) throw new HttpError(403, "Sin permiso");
  return data as Simulation;
}

export async function getOwnSimulation(id: string, viewer: Profile): Promise<Simulation> {
  const sim = await getSimulationFor(id, viewer);
  if (sim.user_id !== viewer.id) throw new HttpError(403, "Sólo el vendedor que hizo la llamada puede hacer esto");
  return sim;
}

export async function getTurns(simulationId: string): Promise<TranscriptTurn[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("simulation_turns")
    .select("id, seq, speaker, text, t_offset_ms, meta")
    .eq("simulation_id", simulationId)
    .order("seq");
  if (error) throw error;
  return (data ?? []) as TranscriptTurn[];
}

export async function getSecret(simulationId: string): Promise<SimulationSecret> {
  const db = createAdminClient();
  const { data, error } = await db.from("simulation_secrets").select("*").eq("simulation_id", simulationId).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Perfil secreto no encontrado");
  return data as SimulationSecret;
}

export async function updateSimulation(id: string, patch: Partial<Simulation>) {
  const db = createAdminClient();
  const { error } = await db.from("simulations").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateSecretState(id: string, patch: Partial<Pick<SimulationSecret, "customer_state" | "discovery_live">>) {
  const db = createAdminClient();
  const { error } = await db.from("simulation_secrets").update(patch).eq("simulation_id", id);
  if (error) throw error;
}

export async function insertTurn(simulationId: string, turn: Omit<TranscriptTurn, "id">) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("simulation_turns")
    .insert({ simulation_id: simulationId, ...turn, meta: turn.meta ?? {} })
    .select("id, seq, speaker, text, t_offset_ms, meta")
    .single();
  if (error) throw error;
  return data as TranscriptTurn;
}

export async function listSimulations(opts: { userId?: string; limit?: number; status?: string[] } = {}): Promise<Simulation[]> {
  const db = createAdminClient();
  let q = db.from("simulations").select("*").order("created_at", { ascending: false });
  if (opts.userId) q = q.eq("user_id", opts.userId);
  if (opts.status) q = q.in("status", opts.status);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Simulation[];
}

export async function listProfiles(): Promise<Profile[]> {
  const db = createAdminClient();
  const { data, error } = await db.from("profiles").select("*").order("full_name");
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const db = createAdminClient();
  const { data } = await db.from("profiles").select("*").eq("id", id).maybeSingle();
  return (data as Profile) ?? null;
}
