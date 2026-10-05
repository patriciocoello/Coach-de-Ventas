import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { SEED_DOCUMENTS } from "./knowledge";
import { SEED_PRODUCTS } from "./products";
import { SEED_DIFFICULTIES, SEED_SCENARIOS } from "./scenarios";
import { SEED_SCORING } from "./scoring";

export interface SeedReport {
  products: number;
  documents: number;
  scenarios: number;
  difficulties: number;
  scoring: boolean;
}

// Carga el contenido inicial de Mente Fría. Es idempotente: sólo inserta lo que
// falta (por slug / key / título) y nunca sobreescribe cambios hechos en admin.
export async function seedDefaults(): Promise<SeedReport> {
  const db = createAdminClient();
  const report: SeedReport = { products: 0, documents: 0, scenarios: 0, difficulties: 0, scoring: false };

  const { data: existingProducts } = await db.from("products").select("slug");
  const slugs = new Set((existingProducts ?? []).map((p) => p.slug));
  const newProducts = SEED_PRODUCTS.filter((p) => !slugs.has(p.slug));
  if (newProducts.length) {
    const { error } = await db.from("products").insert(newProducts);
    if (error) throw error;
    report.products = newProducts.length;
  }

  const { data: existingDocs } = await db.from("knowledge_documents").select("title");
  const titles = new Set((existingDocs ?? []).map((d) => d.title));
  const newDocs = SEED_DOCUMENTS.filter((d) => !titles.has(d.title));
  if (newDocs.length) {
    const { error } = await db.from("knowledge_documents").insert(newDocs);
    if (error) throw error;
    report.documents = newDocs.length;
  }

  const { data: existingScenarios } = await db.from("scenarios").select("key");
  const keys = new Set((existingScenarios ?? []).map((s) => s.key));
  const newScenarios = SEED_SCENARIOS.filter((s) => !keys.has(s.key));
  if (newScenarios.length) {
    const { error } = await db.from("scenarios").insert(newScenarios);
    if (error) throw error;
    report.scenarios = newScenarios.length;
  }

  const { data: existingDiff } = await db.from("difficulty_levels").select("key");
  const dkeys = new Set((existingDiff ?? []).map((d) => d.key));
  const newDiff = SEED_DIFFICULTIES.filter((d) => !dkeys.has(d.key));
  if (newDiff.length) {
    const { error } = await db.from("difficulty_levels").insert(newDiff);
    if (error) throw error;
    report.difficulties = newDiff.length;
  }

  const { data: scoring } = await db.from("scoring_config").select("id").eq("id", 1).maybeSingle();
  if (!scoring) {
    const { error } = await db.from("scoring_config").insert({ id: 1, ...SEED_SCORING });
    if (error) throw error;
    report.scoring = true;
  }

  return report;
}

export async function isContentEmpty(): Promise<boolean> {
  const db = createAdminClient();
  const { count } = await db.from("products").select("id", { count: "exact", head: true });
  return !count;
}
