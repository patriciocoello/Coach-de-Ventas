"use client";

import { useState } from "react";
import { saveAIModels } from "@/app/(app)/admin/actions";
import { Alert, Badge, Button, Card, CardHeader, Field, Input } from "@/components/ui";
import { useAction } from "./use-action";

interface ModelInfo {
  id: string;
  label: string;
}

export function AISettingsCard({ provider, hasKey, chatModel, evalModel }: { provider: string; hasKey: boolean; chatModel: string; evalModel: string }) {
  const [chat, setChat] = useState(chatModel);
  const [evalM, setEvalM] = useState(evalModel);
  const [models, setModels] = useState<ModelInfo[] | null>(null);
  const [test, setTest] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const { pending, message, exec } = useAction();

  async function probe() {
    setTesting(true);
    setTest(null);
    const res = await fetch("/api/admin/models");
    const data = await res.json().catch(() => ({}));
    setTesting(false);
    if (!res.ok) return setTest({ tone: "bad", text: data.error ?? "No se pudo conectar." });
    setModels(data.models);
    setTest({ tone: "good", text: `Conexión correcta (${data.provider}). Cliente: ${data.current.chat} · Coach: ${data.current.eval}` });
  }

  return (
    <Card>
      <CardHeader
        eyebrow="Inteligencia artificial"
        title="Proveedor y modelos"
        action={<Badge tone={provider === "mock" ? "warn" : hasKey ? "good" : "bad"}>{provider === "mock" ? "Modo demo" : hasKey ? provider : "Falta API key"}</Badge>}
      />
      <div className="space-y-4 p-5 text-sm">
        {provider === "mock" && <Alert tone="warn">AI_PROVIDER=mock: las respuestas son de demostración. Usa AI_PROVIDER=gemini para entrenar de verdad.</Alert>}
        {provider === "gemini" && !hasKey && <Alert tone="bad">Agrega GEMINI_API_KEY en las variables de entorno (gratis en aistudio.google.com/apikey).</Alert>}
        <Field label="Modelo del cliente (rápido)" hint="Vacío = gemini-2.5-flash. Recomendado: un modelo Flash o Flash-Lite para baja latencia.">
          <Input list="ai-models" value={chat} onChange={(e) => setChat(e.target.value)} placeholder="gemini-2.5-flash" />
        </Field>
        <Field label="Modelo del coach (evaluación)" hint="Vacío = gemini-2.5-flash. Un modelo más potente evalúa con más detalle.">
          <Input list="ai-models" value={evalM} onChange={(e) => setEvalM(e.target.value)} placeholder="gemini-2.5-flash" />
        </Field>
        <datalist id="ai-models">{models?.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</datalist>
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} onClick={() => exec(() => saveAIModels({ chatModel: chat, evalModel: evalM }))}>
            Guardar modelos
          </Button>
          <Button variant="secondary" disabled={testing} onClick={probe}>
            {testing ? "Probando…" : "Probar conexión y listar modelos"}
          </Button>
        </div>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        {test && <Alert tone={test.tone}>{test.text}</Alert>}
        {models && <p className="text-xs text-subtle">{models.length} modelos disponibles para tu key. Escribe en los campos para ver sugerencias.</p>}
      </div>
    </Card>
  );
}
