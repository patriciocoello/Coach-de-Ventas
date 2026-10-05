"use client";

import { useState } from "react";
import { saveDifficulty } from "@/app/(app)/admin/actions";
import { Alert, Button, Card, CardHeader, Field, Input, Select, Textarea } from "@/components/ui";
import { PERSONALITY_LABELS } from "@/lib/simulation/personality";
import { PERSONALITY_KEYS, type DifficultyLevel } from "@/lib/types";
import { useAction } from "./use-action";

export function DifficultyEditor({ difficulties }: { difficulties: DifficultyLevel[] }) {
  const [selected, setSelected] = useState(difficulties[0]?.key);
  const current = difficulties.find((d) => d.key === selected);
  return (
    <Card>
      <CardHeader eyebrow="Motor de personalidad" title="Niveles de dificultad" />
      <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
        {difficulties.map((d) => (
          <button key={d.key} onClick={() => setSelected(d.key)} className={`rounded-full px-3 py-1 text-sm ${selected === d.key ? "bg-foreground text-white" : "bg-panel text-muted"}`}>
            {d.name}
          </button>
        ))}
      </div>
      {current && <DifficultyForm key={current.key} d={current} />}
    </Card>
  );
}

function DifficultyForm({ d }: { d: DifficultyLevel }) {
  const [f, setF] = useState(d);
  const { pending, message, exec } = useAction();
  const setRange = (k: (typeof PERSONALITY_KEYS)[number], i: 0 | 1, v: string) => {
    const r = [...(f.param_ranges[k] ?? [30, 70])] as [number, number];
    r[i] = Math.max(0, Math.min(100, Number(v) || 0));
    setF({ ...f, param_ranges: { ...f.param_ranges, [k]: r } });
  };
  return (
    <div className="space-y-5 p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Nombre">
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Descripción" className="sm:col-span-2">
          <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
      </div>
      <Field label="Instrucciones de comportamiento para el cliente" hint="Se inyectan tal cual en el prompt del agente cliente.">
        <Textarea rows={5} value={f.behavior_prompt} onChange={(e) => setF({ ...f, behavior_prompt: e.target.value })} />
      </Field>
      <Field label="Detalle de la ficha de preparación" className="sm:w-64">
        <Select value={f.prep_detail} onChange={(e) => setF({ ...f, prep_detail: e.target.value as DifficultyLevel["prep_detail"] })}>
          <option value="full">Completa</option>
          <option value="partial">Parcial</option>
          <option value="minimal">Mínima</option>
        </Select>
      </Field>
      <div>
        <div className="mb-2 text-sm font-medium">Rangos de personalidad (0–100)</div>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {PERSONALITY_KEYS.map((k) => (
            <div key={k} className="flex items-center gap-3 text-sm">
              <span className="flex-1">{PERSONALITY_LABELS[k]}</span>
              <Input className="!h-8 !w-16" value={f.param_ranges[k]?.[0] ?? 30} onChange={(e) => setRange(k, 0, e.target.value)} inputMode="numeric" />
              <span className="text-subtle">a</span>
              <Input className="!h-8 !w-16" value={f.param_ranges[k]?.[1] ?? 70} onChange={(e) => setRange(k, 1, e.target.value)} inputMode="numeric" />
            </div>
          ))}
        </div>
      </div>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <Button disabled={pending} onClick={() => exec(() => saveDifficulty(f))}>
        Guardar dificultad
      </Button>
    </div>
  );
}
