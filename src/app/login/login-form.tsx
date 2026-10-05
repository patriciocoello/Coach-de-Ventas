"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { createFirstAdmin, signIn, type AuthState } from "./actions";

export function LoginForm({ next, firstRun }: { next: string; firstRun: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(firstRun ? createFirstAdmin : signIn, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {firstRun && (
        <Field label="Nombre completo">
          <Input name="full_name" required autoComplete="name" />
        </Field>
      )}
      <Field label="Correo">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Contraseña" hint={firstRun ? "Mínimo 8 caracteres." : undefined}>
        <Input name="password" type="password" required autoComplete={firstRun ? "new-password" : "current-password"} />
      </Field>
      {state.error && <Alert tone="bad">{state.error}</Alert>}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Un momento…" : firstRun ? "Crear administrador" : "Entrar"}
      </Button>
    </form>
  );
}
