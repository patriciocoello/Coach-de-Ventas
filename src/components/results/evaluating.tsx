"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, Button, Card } from "@/components/ui";

export function EvaluatingView({ id }: { id: string }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    const poll = setInterval(async () => {
      const res = await fetch(`/api/simulations/${id}/status`).catch(() => null);
      const data = await res?.json().catch(() => null);
      if (data && data.status !== "evaluating") router.refresh();
    }, 3000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [id, router]);
  const steps = ["Leyendo la transcripción", "Comparando contra el manual de ventas", "Revisando qué descubriste del cliente", "Escribiendo tu feedback"];
  const current = Math.min(steps.length - 1, Math.floor(seconds / 6));
  return (
    <Card className="mx-auto max-w-xl p-10 text-center">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-line border-t-foreground" />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Analizando tu llamada</h1>
      <p className="mt-2 text-sm text-muted">El coach está evaluando la conversación completa. Suele tardar entre 15 y 60 segundos.</p>
      <ul className="mx-auto mt-8 max-w-xs space-y-2 text-left text-sm">
        {steps.map((s, i) => (
          <li key={s} className={i <= current ? "text-foreground" : "text-subtle"}>
            {i < current ? "✓" : i === current ? "•" : "○"} {s}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function RetryEvaluation({ id, error, canRetry }: { id: string; error: string | null; canRetry: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function retry() {
    setLoading(true);
    const res = await fetch(`/api/simulations/${id}/retry`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error ?? "No se pudo reintentar.");
      setLoading(false);
      return;
    }
    router.refresh();
  }
  return (
    <Card className="mx-auto max-w-xl p-10 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">No se pudo evaluar la llamada</h1>
      <p className="mt-2 text-sm text-muted">La transcripción está guardada. Puedes intentar la evaluación de nuevo.</p>
      {error && (
        <div className="mt-6 text-left">
          <Alert tone="bad">{error}</Alert>
        </div>
      )}
      {msg && (
        <div className="mt-3 text-left">
          <Alert tone="bad">{msg}</Alert>
        </div>
      )}
      {canRetry && (
        <Button className="mt-6" onClick={retry} disabled={loading}>
          {loading ? "Reintentando…" : "Reintentar evaluación"}
        </Button>
      )}
    </Card>
  );
}
