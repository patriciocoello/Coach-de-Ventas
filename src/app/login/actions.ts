"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { seedDefaults } from "@/lib/seed";

export interface AuthState {
  error?: string;
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Correo o contraseña incorrectos." };
  redirect(next.startsWith("/") ? next : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function hasAnyUser(): Promise<boolean> {
  const db = createAdminClient();
  const { count } = await db.from("profiles").select("id", { count: "exact", head: true });
  return Boolean(count);
}

// Sólo funciona cuando todavía no existe ningún usuario: crea al primer admin
// y carga el contenido inicial de Mente Fría.
export async function createFirstAdmin(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (await hasAnyUser()) return { error: "Ya existe un administrador. Inicia sesión." };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const fullName = String(form.get("full_name") ?? "").trim();
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  const db = createAdminClient();
  const { error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) return { error: error.message };
  await seedDefaults();
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });
  redirect("/admin");
}
