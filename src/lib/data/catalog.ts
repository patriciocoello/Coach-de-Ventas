import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  DifficultyLevel,
  KnowledgeDocument,
  Product,
  Scenario,
  ScoringConfig,
} from "@/lib/types";
import { SEED_SCORING } from "@/lib/seed/scoring";

// Repositorio de contenido administrable: productos, documentos, escenarios,
// dificultades y configuración del score.

export async function listProducts(opts: { activeOnly?: boolean } = {}): Promise<Product[]> {
  const db = createAdminClient();
  let q = db.from("products").select("*").order("sort_order").order("name");
  if (opts.activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const db = createAdminClient();
  const { data } = await db.from("products").select("*").eq("id", id).maybeSingle();
  return (data as Product) ?? null;
}

export async function listDocuments(opts: { activeOnly?: boolean } = {}): Promise<KnowledgeDocument[]> {
  const db = createAdminClient();
  let q = db.from("knowledge_documents").select("*").order("priority", { ascending: false }).order("title");
  if (opts.activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as KnowledgeDocument[];
}

export async function getDocument(id: string): Promise<KnowledgeDocument | null> {
  const db = createAdminClient();
  const { data } = await db.from("knowledge_documents").select("*").eq("id", id).maybeSingle();
  return (data as KnowledgeDocument) ?? null;
}

export async function listScenarios(opts: { activeOnly?: boolean } = {}): Promise<Scenario[]> {
  const db = createAdminClient();
  let q = db.from("scenarios").select("*").order("sort_order").order("name");
  if (opts.activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Scenario[];
}

export async function listDifficulties(): Promise<DifficultyLevel[]> {
  const db = createAdminClient();
  const { data, error } = await db.from("difficulty_levels").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as DifficultyLevel[];
}

export async function getScoringConfig(): Promise<ScoringConfig> {
  const db = createAdminClient();
  const { data } = await db.from("scoring_config").select("*").eq("id", 1).maybeSingle();
  if (!data) return SEED_SCORING;
  return {
    categories: data.categories,
    rules: data.rules,
    discovery_fields: data.discovery_fields,
    coach_notes: data.coach_notes ?? "",
  };
}

export interface AISettings {
  chatModel?: string;
  evalModel?: string;
}

export async function getAISettings(): Promise<AISettings> {
  const db = createAdminClient();
  const { data } = await db.from("app_settings").select("value").eq("key", "ai").maybeSingle();
  return (data?.value as AISettings) ?? {};
}

export async function saveAISettings(value: AISettings) {
  const db = createAdminClient();
  const { error } = await db
    .from("app_settings")
    .upsert({ key: "ai", value, updated_at: new Date().toISOString() });
  if (error) throw error;
}
