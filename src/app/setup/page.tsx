import { Card, Logo } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";

export default function SetupPage() {
  const ok = isSupabaseConfigured();
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Logo />
      <h1 className="mt-10 text-3xl font-semibold tracking-tight">Falta configurar la aplicación</h1>
      <p className="mt-3 text-muted">
        {ok
          ? "Supabase ya está configurado. Recarga la página."
          : "Agrega estas variables de entorno (en Vercel: Settings → Environment Variables) y vuelve a desplegar."}
      </p>
      <Card className="mt-8 overflow-hidden">
        <pre className="overflow-x-auto bg-panel p-5 text-sm leading-7">{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
AI_PROVIDER=gemini
GEMINI_API_KEY=...`}</pre>
      </Card>
      <p className="mt-6 text-sm text-muted">Las instrucciones completas están en el README del repositorio.</p>
    </main>
  );
}
