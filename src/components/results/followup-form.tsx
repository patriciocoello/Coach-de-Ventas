"use client";

import { useState } from "react";
import { Alert, Badge, Button, Card, CardHeader, Textarea } from "@/components/ui";
import type { FollowupEvaluation } from "@/lib/types";

export function FollowupForm({ id, initialMessage, initialEval, canEdit }: { id: string; initialMessage: string | null; initialEval: FollowupEvaluation | null; canEdit: boolean }) {
  const [message, setMessage] = useState(initialMessage ?? "");
  const [ev, setEv] = useState<FollowupEvaluation | null>(initialEval);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/simulations/${id}/followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo evaluar el mensaje.");
    setEv(data);
  }

  return (
    <Card>
      <CardHeader
        eyebrow="Paso L · opcional"
        title="WhatsApp de seguimiento"
        action={ev ? <Badge tone={ev.score >= 8 ? "good" : ev.score >= 6 ? "warn" : "bad"}>{ev.score}/10</Badge> : <Badge>No cuenta en el score</Badge>}
      />
      <div className="space-y-4 p-5">
        <p className="text-sm text-muted">Escribe el mensaje que mandarías en los 30 minutos después de colgar. El coach lo evalúa contra las plantillas del manual.</p>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} disabled={!canEdit} placeholder="Hola, [nombre]. Gracias por tu tiempo…" />
        {error && <Alert tone="bad">{error}</Alert>}
        {canEdit && (
          <Button onClick={submit} disabled={loading || message.trim().length < 10}>
            {loading ? "Evaluando…" : ev ? "Evaluar de nuevo" : "Evaluar mensaje"}
          </Button>
        )}
        {ev && (
          <div className="space-y-4 border-t border-line pt-4">
            <p className="text-sm">{ev.feedback}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <List title="Bien" items={ev.strengths} />
              <List title="Mejorar" items={ev.improvements} />
            </div>
            {ev.improvedMessage && (
              <div>
                <div className="eyebrow mb-2">Versión mejorada</div>
                <div className="whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-[#e7f8e3] px-4 py-3 text-sm">{ev.improvedMessage}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="eyebrow mb-2">{title}</div>
      <ul className="space-y-1 text-sm">
        {items.map((i) => (
          <li key={i}>– {i}</li>
        ))}
      </ul>
    </div>
  );
}
