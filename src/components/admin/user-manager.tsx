"use client";

import { useState } from "react";
import { createUser, resetPassword, updateUser } from "@/app/(app)/admin/actions";
import { Alert, Badge, Button, Card, CardHeader, Field, Input, Select } from "@/components/ui";
import type { Profile, UserRole } from "@/lib/types";
import { useAction } from "./use-action";

const ROLES: { key: UserRole; label: string }[] = [
  { key: "seller", label: "Vendedor" },
  { key: "manager", label: "Gerente" },
  { key: "admin", label: "Admin" },
];

export function UserManager({ users, meId }: { users: Profile[]; meId: string }) {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "seller" as UserRole });
  const { pending, message, exec } = useAction();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Agregar usuario" />
        <div className="grid gap-4 p-5 sm:grid-cols-4">
          <Field label="Nombre">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </Field>
          <Field label="Correo">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Contraseña inicial" hint="Mínimo 8 caracteres. Compártela con el vendedor.">
            <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Rol">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
              {ROLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-4">
            <Button
              disabled={pending}
              onClick={async () => {
                const r = await exec(() => createUser(form), `Usuario ${form.email} creado.`);
                if (r.ok) setForm({ full_name: "", email: "", password: "", role: "seller" });
              }}
            >
              Crear usuario
            </Button>
          </div>
        </div>
      </Card>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-subtle">
              <th className="px-5 py-3 font-medium">Usuario</th>
              <th className="px-5 py-3 font-medium">Rol</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3">
                  <div className="font-medium">
                    {u.full_name || "—"} {u.id === meId && <Badge>Tú</Badge>}
                  </div>
                  <div className="text-xs text-subtle">{u.email}</div>
                </td>
                <td className="px-5 py-3">
                  <Select className="!h-8 !w-36" value={u.role} disabled={u.id === meId} onChange={(e) => exec(() => updateUser({ id: u.id, role: e.target.value as UserRole }), "Rol actualizado.")}>
                    {ROLES.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-5 py-3">{u.active ? <Badge tone="good">Activo</Badge> : <Badge tone="bad">Desactivado</Badge>}</td>
                <td className="space-x-2 whitespace-nowrap px-5 py-3 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const pw = prompt(`Nueva contraseña para ${u.email} (mínimo 8 caracteres):`);
                      if (pw) exec(() => resetPassword(u.id, pw), "Contraseña actualizada.");
                    }}
                  >
                    Contraseña
                  </Button>
                  {u.id !== meId && (
                    <Button size="sm" variant="secondary" onClick={() => exec(() => updateUser({ id: u.id, active: !u.active }), u.active ? "Usuario desactivado." : "Usuario activado.")}>
                      {u.active ? "Desactivar" : "Activar"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
