"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Card, Select } from "@/components/ui";
import type { DifficultyLevel, Scenario } from "@/lib/types";

const SEGMENT: Record<string, string> = { residential: "Residencial", commercial: "Comercial", both: "Mixto" };

export function NewSimulationForm({
  scenarios,
  difficulties,
  presets,
}: {
  scenarios: Scenario[];
  difficulties: DifficultyLevel[];
  presets: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [scenario, setScenario] = useState("random");
  const [difficulty, setDifficulty] = useState(difficulties[1]?.key ?? difficulties[0].key);
  const [prepMode, setPrepMode] = useState<"prep" | "cold">("prep");
  const [preset, setPreset] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioKey: scenario, difficultyKey: difficulty, prepMode, presetId: preset || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear la simulación.");
      router.push(`/llamada/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="eyebrow mb-3">1 · Tipo de cliente</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => setScenario("random")}
            className={clsx(
              "rounded-2xl border p-4 text-left transition",
              scenario === "random" ? "border-foreground bg-foreground text-white" : "border-line hover:border-foreground",
            )}
          >
            <div className="font-semibold">Escenario aleatorio</div>
            <div className={clsx("mt-1 text-sm", scenario === "random" ? "text-white/70" : "text-muted")}>
              Como en la vida real: no sabes quién va a contestar.
            </div>
          </button>
          {scenarios.map((s) => (
            <button
              key={s.key}
              onClick={() => setScenario(s.key)}
              className={clsx(
                "rounded-2xl border p-4 text-left transition",
                scenario === s.key ? "border-foreground bg-foreground text-white" : "border-line hover:border-foreground",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{s.name}</span>
                <span className={clsx("text-[10px] uppercase tracking-wider", scenario === s.key ? "text-white/60" : "text-subtle")}>
                  {SEGMENT[s.segment]}
                </span>
              </div>
              <div className={clsx("mt-1 text-sm", scenario === s.key ? "text-white/70" : "text-muted")}>{s.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="eyebrow mb-3">2 · Dificultad</div>
        <div className="grid gap-3 sm:grid-cols-5">
          {difficulties.map((d, i) => (
            <button
              key={d.key}
              onClick={() => setDifficulty(d.key)}
              className={clsx(
                "rounded-2xl border p-4 text-left transition",
                difficulty === d.key ? "border-foreground bg-foreground text-white" : "border-line hover:border-foreground",
              )}
            >
              <div className="flex gap-1" aria-hidden>
                {difficulties.map((_, j) => (
                  <span key={j} className={clsx("h-1.5 w-4 rounded-full", j <= i ? (difficulty === d.key ? "bg-white" : "bg-foreground") : difficulty === d.key ? "bg-white/25" : "bg-line")} />
                ))}
              </div>
              <div className="mt-3 font-semibold">{d.name}</div>
              <div className={clsx("mt-1 text-sm", difficulty === d.key ? "text-white/70" : "text-muted")}>{d.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="eyebrow mb-3">3 · Preparación (paso A)</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["prep", "Con ficha de preparación", "Ves lo que tendría un vendedor real antes de marcar: nombre, de dónde llegó y, a veces, el mensaje que mandó."],
              ["cold", "Llamada en frío", "No sabes nada del cliente. Todo se descubre en la llamada."],
            ] as const
          ).map(([key, title, desc]) => (
            <button
              key={key}
              onClick={() => setPrepMode(key)}
              className={clsx(
                "rounded-2xl border p-4 text-left transition",
                prepMode === key ? "border-foreground ring-1 ring-foreground" : "border-line hover:border-foreground",
              )}
            >
              <div className="font-semibold">{title}</div>
              <div className="mt-1 text-sm text-muted">{desc}</div>
            </button>
          ))}
        </div>
      </section>

      {presets.length > 0 && (
        <section>
          <div className="eyebrow mb-3">Opcional · Perfil predeterminado</div>
          <Card className="p-4">
            <Select value={preset} onChange={(e) => setPreset(e.target.value)}>
              <option value="">Generar un cliente nuevo</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <p className="mt-2 text-xs text-subtle">Un perfil predeterminado usa su propio escenario y dificultad.</p>
          </Card>
        </section>
      )}

      {error && <Alert tone="bad">{error}</Alert>}
      <div className="flex items-center gap-4">
        <Button size="lg" onClick={create} disabled={loading}>
          {loading ? "Creando cliente…" : "Preparar llamada"}
        </Button>
        {loading && <span className="text-sm text-muted">Generando un prospecto con ficha secreta (unos segundos).</span>}
      </div>
    </div>
  );
}
