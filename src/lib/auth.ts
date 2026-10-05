import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { ZodError } from "zod";
import { AIProviderError } from "@/lib/ai/types";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!data || !data.active) return null;
  return data as Profile;
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) redirect("/");
  return profile;
}

export const isManager = (p: Profile) => p.role === "manager" || p.role === "admin";
export const isAdmin = (p: Profile) => p.role === "admin";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Para route handlers: lanza HttpError en lugar de redirigir.
export async function apiProfile(roles?: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new HttpError(401, "No autenticado");
  if (roles && !roles.includes(profile.role)) throw new HttpError(403, "Sin permiso");
  return profile;
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
  if (err instanceof ZodError) return Response.json({ error: "Datos inválidos" }, { status: 400 });
  if (err instanceof AIProviderError) {
    const status = err.code === "rate_limit" ? 429 : err.code === "config" || err.code === "auth" ? 503 : 502;
    return Response.json({ error: err.message, code: err.code }, { status });
  }
  console.error(err);
  const message = err instanceof Error ? err.message : "Error inesperado";
  return Response.json({ error: message }, { status: 500 });
}
