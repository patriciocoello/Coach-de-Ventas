import { AISettingsCard } from "@/components/admin/ai-settings";
import { SeedCard } from "@/components/admin/seed-card";
import { Card, CardHeader, PageHeader, Stat } from "@/components/ui";
import { serverEnv } from "@/lib/env";
import { getAISettings } from "@/lib/data/catalog";
import { createAdminClient } from "@/lib/supabase/admin";

async function count(table: string) {
  const { count } = await createAdminClient().from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

export default async function AdminHome() {
  const [products, docs, scenarios, users, sims, settings] = await Promise.all([
    count("products"),
    count("knowledge_documents"),
    count("scenarios"),
    count("profiles"),
    count("simulations"),
    getAISettings(),
  ]);
  const env = serverEnv();
  return (
    <>
      <PageHeader eyebrow="Admin" title="Resumen" description="Contenido, IA y usuarios de la plataforma." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Productos" value={products} />
        <Stat label="Documentos" value={docs} />
        <Stat label="Escenarios" value={scenarios} />
        <Stat label="Usuarios" value={users} />
        <Stat label="Simulaciones" value={sims} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AISettingsCard
          provider={env.aiProvider}
          hasKey={Boolean(env.geminiApiKey)}
          chatModel={settings.chatModel ?? env.geminiChatModel}
          evalModel={settings.evalModel ?? env.geminiEvalModel}
        />
        <SeedCard empty={products === 0} />
      </div>
      <Card className="mt-6">
        <CardHeader eyebrow="Voz" title="Cómo funciona la voz" />
        <div className="space-y-2 p-5 text-sm text-muted">
          <p>
            La llamada usa el reconocimiento y la síntesis de voz del navegador (gratis). Funciona mejor en <b>Chrome o Edge de computadora</b>, con audífonos.
            En Edge, las voces “Natural” en español de México suenan casi humanas.
          </p>
          <p>
            La arquitectura está lista para cambiar a voz en tiempo real (speech-to-speech) con OpenAI Realtime o Gemini Live: ver <code>src/lib/voice/realtime.ts</code>.
          </p>
        </div>
      </Card>
    </>
  );
}
