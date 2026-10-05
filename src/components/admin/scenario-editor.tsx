"use client";

import { useState } from "react";
import { deleteScenario, saveScenario } from "@/app/(app)/admin/actions";
import { Alert, Badge, Button, Card, CardHeader, Field, Input, Select, Textarea } from "@/components/ui";
import type { Scenario } from "@/lib/types";
import { useAction } from "./use-action";

const EMPTY: Omit<Scenario, "id"> = { key: "", name: "", description: "", segment: "residential", prompt_hints: "", likely_products: [], active: true, sort_order: 999 };

export function ScenarioEditor({ scenarios, productSlugs }: { scenarios: Scenario[]; productSlugs: string[] }) {
  const [editing, setEditing] = useState<(Omit<Scenario, "id"> & { id?: string }) | null>(null);
  const { pending, message, exec } = useAction();

  return (
    <Card>
      <CardHeader eyebrow="Tipos de cliente" title={`Escenarios (${scenarios.length})`} action={<Button size="sm" onClick={() => setEditing({ ...EMPTY })}>Agregar escenario</Button>} />
      {editing && (
        <div className="grid gap-4 border-b border-line bg-panel p-5 sm:grid-cols-2">
          <Field label="Nombre">
            <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </Field>
          <Field label="Clave" hint="minúsculas y guion bajo, ej. centro_yoga">
            <Input value={editing.key} onChange={(e) => setEditing({ ...editing, key: e.target.value })} disabled={Boolean(editing.id)} />
          </Field>
          <Field label="Descripción (la ve el vendedor)" className="sm:col-span-2">
            <Input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          </Field>
          <Field label="Guía para el generador (secreta)" className="sm:col-span-2">
            <Textarea value={editing.prompt_hints} onChange={(e) => setEditing({ ...editing, prompt_hints: e.target.value })} />
          </Field>
          <Field label="Segmento">
            <Select value={editing.segment} onChange={(e) => setEditing({ ...editing, segment: e.target.value as Scenario["segment"] })}>
              <option value="residential">Residencial</option>
              <option value="commercial">Comercial</option>
              <option value="both">Mixto</option>
            </Select>
          </Field>
          <Field label="Productos sugeridos" hint={`Slugs separados por coma. Disponibles: ${productSlugs.join(", ")}`}>
            <Input value={editing.likely_products.join(", ")} onChange={(e) => setEditing({ ...editing, likely_products: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Activo
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button
              disabled={pending}
              onClick={async () => {
                const r = await exec(() => saveScenario(editing));
                if (r.ok) setEditing(null);
              }}
            >
              Guardar
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
      {message && (
        <div className="p-4">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      )}
      <ul className="divide-y divide-line">
        {scenarios.map((s) => (
          <li key={s.id} className="flex items-center gap-4 px-5 py-3 text-sm">
            <div className="flex-1">
              <div className="font-medium">
                {s.name} {!s.active && <Badge>Inactivo</Badge>}
              </div>
              <div className="text-muted">{s.description}</div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setEditing(s)}>
              Editar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm(`¿Eliminar el escenario ${s.name}?`)) exec(() => deleteScenario(s.id), "Eliminado.");
              }}
            >
              ✕
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
