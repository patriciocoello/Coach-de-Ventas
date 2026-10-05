"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { saveAISettings } from "@/lib/data/catalog";
import { getSecret, getSimulationFor } from "@/lib/data/simulations";
import { seedDefaults, type SeedReport } from "@/lib/seed";
import { createAdminClient } from "@/lib/supabase/admin";
import { PERSONALITY_KEYS } from "@/lib/types";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function assertAdmin() {
  const p = await getCurrentProfile();
  if (!p || p.role !== "admin") throw new Error("Sólo un administrador puede hacer esto.");
  return p;
}

async function run<T>(fn: () => Promise<T>, paths: string[] = []): Promise<ActionResult<T>> {
  try {
    await assertAdmin();
    const data = await fn();
    for (const p of paths) revalidatePath(p);
    return { ok: true, data };
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
        : err instanceof Error
          ? err.message
          : "Error inesperado";
    return { ok: false, error: msg };
  }
}

const check = <T,>(res: { error: { message: string } | null; data?: T | null }) => {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
};

// ------------------------------------------------------------------ Contenido inicial
export async function runSeed(): Promise<ActionResult<SeedReport>> {
  return run(() => seedDefaults(), ["/admin", "/admin/productos", "/admin/conocimiento", "/admin/escenarios"]);
}

// ------------------------------------------------------------------ Productos
const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "sólo minúsculas, números y guiones"),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string(),
  price: z.number().nullable(),
  currency: z.string().default("MXN"),
  price_notes: z.string(),
  shipping_cost: z.number().nullable(),
  delivery_time: z.string(),
  stock_status: z.enum(["in_stock", "backorder", "unavailable"]),
  stock_notes: z.string(),
  segment: z.enum(["residential", "commercial", "both"]),
  features: z.array(z.string()),
  benefits: z.array(z.string()),
  specs: z.record(z.string(), z.string()),
  ideal_use: z.string(),
  recommended_customer: z.string(),
  installation_requirements: z.string(),
  warranty: z.string(),
  images: z.array(z.string()),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })),
  objections: z.array(z.object({ objection: z.string(), response: z.string() })),
  active: z.boolean(),
  sort_order: z.number().int(),
});

export async function saveProduct(input: z.input<typeof ProductSchema>): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const { id, ...p } = ProductSchema.parse(input);
    const db = createAdminClient();
    const row = id
      ? check(await db.from("products").update(p).eq("id", id).select("id").single())
      : check(await db.from("products").insert(p).select("id").single());
    return row as unknown as { id: string };
  }, ["/admin/productos"]);
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return run(async () => {
    check(await createAdminClient().from("products").delete().eq("id", id));
    return undefined;
  }, ["/admin/productos"]);
}

export async function uploadProductImage(form: FormData): Promise<ActionResult<{ url: string }>> {
  return run(async () => {
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Falta la imagen");
    if (file.size > 5 * 1024 * 1024) throw new Error("Máximo 5 MB por imagen");
    if (!file.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen");
    const db = createAdminClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    check(await db.storage.from("product-images").upload(path, file, { contentType: file.type }));
    return { url: db.storage.from("product-images").getPublicUrl(path).data.publicUrl };
  });
}

// ------------------------------------------------------------------ Documentos
const DocSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  category: z.string().min(1),
  content: z.string(),
  priority: z.number().int().min(0).max(100),
  use_in_customer: z.boolean(),
  use_in_evaluation: z.boolean(),
  active: z.boolean(),
  source_file_name: z.string().nullable().optional(),
  storage_path: z.string().nullable().optional(),
});

export async function saveDocument(input: z.input<typeof DocSchema>): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const { id, ...d } = DocSchema.parse(input);
    const db = createAdminClient();
    const row = id
      ? check(await db.from("knowledge_documents").update(d).eq("id", id).select("id").single())
      : check(await db.from("knowledge_documents").insert(d).select("id").single());
    return row as unknown as { id: string };
  }, ["/admin/conocimiento"]);
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  return run(async () => {
    check(await createAdminClient().from("knowledge_documents").delete().eq("id", id));
    return undefined;
  }, ["/admin/conocimiento"]);
}

// ------------------------------------------------------------------ Escenarios y dificultad
const ScenarioSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1).regex(/^[a-z0-9_]+$/, "sólo minúsculas, números y guion bajo"),
  name: z.string().min(1),
  description: z.string(),
  segment: z.enum(["residential", "commercial", "both"]),
  prompt_hints: z.string(),
  likely_products: z.array(z.string()),
  active: z.boolean(),
  sort_order: z.number().int(),
});

export async function saveScenario(input: z.input<typeof ScenarioSchema>): Promise<ActionResult> {
  return run(async () => {
    const { id, ...s } = ScenarioSchema.parse(input);
    const db = createAdminClient();
    if (id) check(await db.from("scenarios").update(s).eq("id", id));
    else check(await db.from("scenarios").insert(s));
    return undefined;
  }, ["/admin/escenarios"]);
}

export async function deleteScenario(id: string): Promise<ActionResult> {
  return run(async () => {
    check(await createAdminClient().from("scenarios").delete().eq("id", id));
    return undefined;
  }, ["/admin/escenarios"]);
}

const range = z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]);
const DifficultySchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  param_ranges: z.object(Object.fromEntries(PERSONALITY_KEYS.map((k) => [k, range])) as Record<(typeof PERSONALITY_KEYS)[number], typeof range>),
  behavior_prompt: z.string(),
  prep_detail: z.enum(["full", "partial", "minimal"]),
  sort_order: z.number().int(),
});

export async function saveDifficulty(input: z.input<typeof DifficultySchema>): Promise<ActionResult> {
  return run(async () => {
    const d = DifficultySchema.parse(input);
    check(await createAdminClient().from("difficulty_levels").upsert(d));
    return undefined;
  }, ["/admin/escenarios"]);
}

// ------------------------------------------------------------------ Score
const ScoringSchema = z.object({
  categories: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        short: z.string().min(1),
        weight: z.number().int().min(0).max(100),
        description: z.string(),
        manualSteps: z.array(z.string()),
        criteria: z.array(z.string()),
      }),
    )
    .min(1),
  rules: z.array(
    z.object({
      id: z.string().min(1),
      description: z.string().min(1),
      category: z.string().min(1),
      penalty: z.number().int().min(0).max(30),
      active: z.boolean(),
    }),
  ),
  discovery_fields: z.array(
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      description: z.string(),
      importance: z.enum(["critical", "high", "medium"]),
      appliesTo: z.enum(["all", "residential", "commercial"]),
      exampleQuestion: z.string(),
    }),
  ),
  coach_notes: z.string(),
});

export async function saveScoring(input: z.input<typeof ScoringSchema>): Promise<ActionResult> {
  return run(async () => {
    const config = ScoringSchema.parse(input);
    const total = config.categories.reduce((a, c) => a + c.weight, 0);
    if (total !== 100) throw new Error(`Los pesos deben sumar 100 (ahora suman ${total}).`);
    const keys = new Set(config.categories.map((c) => c.key));
    const bad = config.rules.find((r) => !keys.has(r.category));
    if (bad) throw new Error(`La regla "${bad.id}" apunta a una categoría que no existe (${bad.category}).`);
    check(await createAdminClient().from("scoring_config").upsert({ id: 1, ...config }));
    return undefined;
  }, ["/admin/score"]);
}

// ------------------------------------------------------------------ Perfiles predeterminados
const PresetSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  scenario_key: z.string().nullable(),
  difficulty_key: z.string().nullable(),
  profile: z.record(z.string(), z.unknown()),
  active: z.boolean(),
});

const REQUIRED_PROFILE_KEYS = ["name", "gender", "greeting", "segment", "recommendedProduct", "facts", "params", "initialPurchaseProbability"];

export async function savePreset(input: z.input<typeof PresetSchema>): Promise<ActionResult> {
  return run(async () => {
    const { id, ...p } = PresetSchema.parse(input);
    const missing = REQUIRED_PROFILE_KEYS.filter((k) => !(k in p.profile));
    if (missing.length) throw new Error(`Al perfil le faltan campos: ${missing.join(", ")}`);
    const db = createAdminClient();
    if (id) check(await db.from("preset_profiles").update(p).eq("id", id));
    else check(await db.from("preset_profiles").insert({ ...p, created_by: (await assertAdmin()).id }));
    return undefined;
  }, ["/admin/perfiles"]);
}

export async function deletePreset(id: string): Promise<ActionResult> {
  return run(async () => {
    check(await createAdminClient().from("preset_profiles").delete().eq("id", id));
    return undefined;
  }, ["/admin/perfiles"]);
}

export async function savePresetFromSimulation(simulationId: string, name: string): Promise<ActionResult> {
  return run(async () => {
    const admin = await assertAdmin();
    const sim = await getSimulationFor(simulationId, admin);
    const secret = await getSecret(simulationId);
    check(
      await createAdminClient().from("preset_profiles").insert({
        name: name || sim.customer_label,
        scenario_key: sim.scenario_key,
        difficulty_key: sim.difficulty_key,
        profile: secret.profile,
        active: true,
        created_by: admin.id,
      }),
    );
    return undefined;
  }, ["/admin/perfiles"]);
}

// ------------------------------------------------------------------ Usuarios
const NewUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  password: z.string().min(8, "mínimo 8 caracteres"),
  role: z.enum(["seller", "manager", "admin"]),
});

export async function createUser(input: z.input<typeof NewUserSchema>): Promise<ActionResult> {
  return run(async () => {
    const u = NewUserSchema.parse(input);
    const db = createAdminClient();
    const { data, error } = await db.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });
    if (error) throw new Error(error.message);
    // El trigger crea el perfil; aseguramos rol y nombre.
    check(await db.from("profiles").update({ full_name: u.full_name, role: u.role }).eq("id", data.user.id));
    return undefined;
  }, ["/admin/usuarios"]);
}

const UpdateUserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1).optional(),
  role: z.enum(["seller", "manager", "admin"]).optional(),
  active: z.boolean().optional(),
});

export async function updateUser(input: z.input<typeof UpdateUserSchema>): Promise<ActionResult> {
  return run(async () => {
    const me = await assertAdmin();
    const { id, ...patch } = UpdateUserSchema.parse(input);
    if (id === me.id && (patch.role && patch.role !== "admin" || patch.active === false)) {
      throw new Error("No puedes quitarte el rol de admin ni desactivarte a ti mismo.");
    }
    const db = createAdminClient();
    check(await db.from("profiles").update(patch).eq("id", id));
    if (patch.active !== undefined) {
      const { error } = await db.auth.admin.updateUserById(id, { ban_duration: patch.active ? "none" : "876000h" });
      if (error) throw new Error(error.message);
    }
    return undefined;
  }, ["/admin/usuarios"]);
}

export async function resetPassword(id: string, password: string): Promise<ActionResult> {
  return run(async () => {
    if (password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
    const { error } = await createAdminClient().auth.admin.updateUserById(id, { password });
    if (error) throw new Error(error.message);
    return undefined;
  });
}

// ------------------------------------------------------------------ IA
export async function saveAIModels(input: { chatModel: string; evalModel: string }): Promise<ActionResult> {
  return run(async () => {
    await saveAISettings({ chatModel: input.chatModel.trim() || undefined, evalModel: input.evalModel.trim() || undefined });
    return undefined;
  }, ["/admin"]);
}
