import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";
import { getCurrentProfile } from "@/lib/auth";
import { hasAnyUser } from "./actions";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentProfile()) redirect("/");
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";
  const firstRun = !(await hasAnyUser());
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-foreground p-12 text-white lg:flex">
        <Logo className="text-white" />
        <div>
          <div className="eyebrow mb-4 text-white/50">Sales training</div>
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Quien hace las preguntas dirige la llamada.
          </h1>
          <p className="mt-4 max-w-md text-white/60">
            Practica llamadas reales por voz con clientes simulados y recibe una evaluación contra el manual de Mente Fría.
          </p>
        </div>
        <div className="text-xs text-white/40">Primero preguntar, después recomendar y finalmente cerrar.</div>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{firstRun ? "Configura tu cuenta" : "Entrar"}</h2>
          <p className="mb-8 mt-2 text-sm text-muted">
            {firstRun
              ? "Todavía no hay usuarios. La primera cuenta será la de administrador y cargará el catálogo y el manual de Mente Fría."
              : "Usa el correo y la contraseña que te dio tu administrador."}
          </p>
          <LoginForm next={next} firstRun={firstRun} />
        </div>
      </section>
    </main>
  );
}
