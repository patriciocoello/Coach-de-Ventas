import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env, serverEnv } from "@/lib/env";

// Cliente con service role: ignora RLS. Úsalo sólo en el servidor y siempre
// después de verificar al usuario y sus permisos.
export function createAdminClient() {
  const key = serverEnv().supabaseServiceRoleKey;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.");
  return createClient(env.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
