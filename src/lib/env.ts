// Variables de entorno. Las que no llevan NEXT_PUBLIC_ sólo existen en el
// servidor: las API keys nunca llegan al navegador.

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
};

export function serverEnv() {
  return {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? "",
    aiProvider: (process.env.AI_PROVIDER ?? "gemini").toLowerCase(),
    geminiApiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "",
    geminiChatModel: process.env.GEMINI_CHAT_MODEL ?? "",
    geminiEvalModel: process.env.GEMINI_EVAL_MODEL ?? "",
  };
}

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
