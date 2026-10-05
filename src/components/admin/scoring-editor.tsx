"use client";

import { useState } from "react";
import { saveScoring } from "@/app/(app)/admin/actions";
import { Alert, Badge, Button, Card, CardHeader, Field, Input, Select, Textarea } from "@/components/ui";
import type { DiscoveryField, ScoringCategory, ScoringConfig, ScoringRule } from "@/lib/types";
import { useAction } from "./use-action";

export function ScoringEditor({ config }: { config: ScoringConfig }) {
  const [cats, setCats] = useState<ScoringCategory[]>(config.categories);
  const [rules, setRules] = useState<ScoringRule[]>(config.rules);
  const [fields, setFields] = useState<DiscoveryField[]>(config.discovery_fields);
  const [notes, setNotes] = useState(config.coach_notes);
  const { pending, message, exec } = useAction();
  const total = cats.reduce((a, c) => a + (Number(c.weight) || 0), 0);

  const upCat = (i: number, patch: Partial<ScoringCategory>) => setCats(cats.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const upRule = (i: number, patch: Partial<ScoringRule>) => setRules(rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const upField = (i: number, patch: Partial<DiscoveryField>) => setFields(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Categorías y pesos" action={<Badge tone={total === 100 ? "good" : "bad"}>Total: {total}/100</Badge>} />
        <div className="divide-y divide-line">
          {cats.map((c, i) => (
            <details key={c.key} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-3">
                <span className="flex-1 text-sm font-medium">{c.label}</span>
                <span className="text-xs text-subtle">Pasos {c.manualSteps.join(", ")}</span>
                <Input
                  className="!h-8 !w-20 text-right"
                  value={c.weight}
                  onClick={(e) => e.preventDefault()}
                  onChange={(e) => upCat(i, { weight: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                  inputMode="numeric"
                />
                <span className="text-xs text-subtle">pts</span>
              </summary>
              <div className="grid gap-4 bg-panel px-5 py-4 sm:grid-cols-2">
                <Field label="Nombre">
                  <Input value={c.label} onChange={(e) => upCat(i, { label: e.target.value })} />
                </Field>
                <Field label="Nombre corto">
                  <Input value={c.short} onChange={(e) => upCat(i, { short: e.target.value })} />
                </Field>
                <Field label="Descripción" className="sm:col-span-2">
                  <Input value={c.description} onChange={(e) => upCat(i, { description: e.target.value })} />
                </Field>
                <Field label="Pasos del manual" hint="Letras separadas por coma">
                  <Input value={c.manualSteps.join(", ")} onChange={(e) => upCat(i, { manualSteps: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
                </Field>
                <Field label="Criterios" hint="Uno por línea" className="sm:col-span-2">
                  <Textarea rows={6} value={c.criteria.join("\n")} onChange={(e) => upCat(i, { criteria: e.target.value.split("\n").filter((x) => x.trim()) })} />
                </Field>
              </div>
            </details>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Reglas y penalizaciones" action={<Button size="sm" variant="secondary" onClick={() => setRules([...rules, { id: `regla_${rules.length + 1}`, description: "", category: cats[0].key, penalty: 3, active: true }])}>Agregar regla</Button>} />
        <div className="divide-y divide-line">
          {rules.map((r, i) => (
            <div key={i} className="grid items-center gap-3 px-5 py-3 sm:grid-cols-[auto_1fr_160px_80px_auto]">
              <input type="checkbox" checked={r.active} onChange={(e) => upRule(i, { active: e.target.checked })} aria-label="Activa" />
              <Input value={r.description} onChange={(e) => upRule(i, { description: e.target.value })} />
              <Select value={r.category} onChange={(e) => upRule(i, { category: e.target.value })}>
                {cats.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.short}
                  </option>
                ))}
              </Select>
              <Input value={r.penalty} onChange={(e) => upRule(i, { penalty: Number(e.target.value.replace(/\D/g, "")) || 0 })} inputMode="numeric" aria-label="Penalización" />
              <button className="text-sm text-subtle hover:text-bad" onClick={() => setRules(rules.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Campos de descubrimiento (perfilamiento)"
          eyebrow="Lo que el vendedor debe descubrir"
          action={<Button size="sm" variant="secondary" onClick={() => setFields([...fields, { key: `campo_${fields.length + 1}`, label: "", description: "", importance: "medium", appliesTo: "all", exampleQuestion: "" }])}>Agregar campo</Button>}
        />
        <div className="divide-y divide-line">
          {fields.map((f, i) => (
            <div key={i} className="grid gap-3 px-5 py-3 sm:grid-cols-[140px_1fr_1.4fr_120px_120px_auto]">
              <Input value={f.key} onChange={(e) => upField(i, { key: e.target.value })} aria-label="Clave" className="font-mono text-xs" />
              <Input value={f.label} onChange={(e) => upField(i, { label: e.target.value })} placeholder="Nombre" />
              <Input value={f.exampleQuestion} onChange={(e) => upField(i, { exampleQuestion: e.target.value })} placeholder="Pregunta de ejemplo" />
              <Select value={f.importance} onChange={(e) => upField(i, { importance: e.target.value as DiscoveryField["importance"] })}>
                <option value="critical">Crítico</option>
                <option value="high">Alto</option>
                <option value="medium">Medio</option>
              </Select>
              <Select value={f.appliesTo} onChange={(e) => upField(i, { appliesTo: e.target.value as DiscoveryField["appliesTo"] })}>
                <option value="all">Todos</option>
                <option value="residential">Residencial</option>
                <option value="commercial">Comercial</option>
              </Select>
              <button className="text-sm text-subtle hover:text-bad" onClick={() => setFields(fields.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Notas para el coach" />
        <div className="p-5">
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </Card>

      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <Button
        disabled={pending || total !== 100}
        onClick={() => exec(() => saveScoring({ categories: cats, rules, discovery_fields: fields, coach_notes: notes }), "Criterios guardados. Se aplican a las próximas evaluaciones.")}
      >
        {total !== 100 ? `Los pesos deben sumar 100 (${total})` : pending ? "Guardando…" : "Guardar criterios"}
      </Button>
    </div>
  );
}
