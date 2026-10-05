"use client";

import { useState } from "react";
import { savePresetFromSimulation } from "@/app/(app)/admin/actions";
import { Alert, Button, Card, CardHeader, Input } from "@/components/ui";

export function SavePresetButton({ simulationId, defaultName }: { simulationId: string; defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [state, setState] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <Card className="self-start">
      <CardHeader eyebrow="Admin" title="Reusar este cliente" />
      <div className="space-y-3 p-5">
        <p className="text-sm text-muted">Guarda este perfil secreto como perfil predeterminado para que otros vendedores practiquen con el mismo cliente.</p>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <Button
          variant="secondary"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            const res = await savePresetFromSimulation(simulationId, name);
            setLoading(false);
            setState(res.ok ? { ok: true } : { error: res.error });
          }}
        >
          Guardar como perfil predeterminado
        </Button>
        {state?.ok && <Alert tone="good">Guardado en Admin → Perfiles.</Alert>}
        {state?.error && <Alert tone="bad">{state.error}</Alert>}
      </div>
    </Card>
  );
}
