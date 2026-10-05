"use client";

import { useState } from "react";
import { deletePreset, savePreset } from "@/app/(app)/admin/actions";
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";
import { useAction } from "./use-action";

interface Preset {
  id: string;
  name: string;
  scenario_key: string | null;
  difficulty_key: string | null;
  profile: Record<string, unknown>;
  active: boolean;
}

export function PresetEditor({ presets, scenarios, difficulties }: { presets: Preset[]; scenarios: { key: string; name: string }[]; difficulties: { key: string; name: string }[] }) {
  const [editing, setEditing] = useState<(Omit<Preset, "id" | "profile"> & { id?: string; json: string }) | null>(null);
  const { pending, message, setMessage, exec } = useAction();

  function open(p?: Preset) {
    setMessage(null);
    setEditing(
      p
        ? { id: p.id, name: p.name, scenario_key: p.scenario_key, difficulty_key: p.difficulty_key, active: p.active, json: JSON.stringify(p.profile, null, 2) }
        : { name: "", scenario_key: scenarios[0]?.key ?? null, difficulty_key: difficulties[0]?.key ?? null, active: true, json: "{\n  \n}" },
    );
  }

  async function save() {
    if (!editing) return;
    let profile: Record<string, unknown>;
    try {
      profile = JSON.parse(editing.json);
    } catch {
      setMessage({ tone: "bad", text: "El JSON del perfil no es válido." });
      return;
    }
    const { json, ...rest } = editing;
    void json;
    const r = await exec(() => savePreset({ ...rest, profile }));
    if (r.ok) setEditing(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => open()}>Nuevo perfil (JSON)</Button>
      </div>
      {editing && (
        <Card>
          <CardHeader title={editing.id ? "Editar perfil" : "Nuevo perfil"} />
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <Field label="Nombre">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Escenario">
              <Select value={editing.scenario_key ?? ""} onChange={(e) => setEditing({ ...editing, scenario_key: e.target.value || null })}>
                {scenarios.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dificultad">
              <Select value={editing.difficulty_key ?? ""} onChange={(e) => setEditing({ ...editing, difficulty_key: e.target.value || null })}>
                {difficulties.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Perfil secreto (JSON)" className="sm:col-span-3" hint="Mismo formato que los perfiles generados. Lo más fácil: guarda uno desde una simulación y edítalo aquí.">
              <Textarea rows={20} value={editing.json} onChange={(e) => setEditing({ ...editing, json: e.target.value })} className="font-mono text-xs" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Activo
            </label>
            <div className="flex gap-2 sm:col-span-3">
              <Button onClick={save} disabled={pending}>
                Guardar
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {presets.length === 0 ? (
        <EmptyState title="Sin perfiles predeterminados" description="Termina una simulación y, en los resultados, usa “Guardar como perfil predeterminado”." />
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {presets.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                <div className="flex-1">
                  <div className="font-medium">
                    {p.name} {!p.active && <Badge>Inactivo</Badge>}
                  </div>
                  <div className="text-muted">
                    {scenarios.find((s) => s.key === p.scenario_key)?.name ?? p.scenario_key} · {difficulties.find((d) => d.key === p.difficulty_key)?.name ?? p.difficulty_key} · {String(p.profile.name ?? "")}
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => open(p)}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => confirm(`¿Eliminar ${p.name}?`) && exec(() => deletePreset(p.id), "Eliminado.")}>
                  ✕
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
