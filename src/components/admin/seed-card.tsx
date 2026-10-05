"use client";

import { runSeed } from "@/app/(app)/admin/actions";
import { Alert, Button, Card, CardHeader } from "@/components/ui";
import { useAction } from "./use-action";

export function SeedCard({ empty }: { empty: boolean }) {
  const { pending, message, setMessage, exec } = useAction();
  return (
    <Card>
      <CardHeader eyebrow="Contenido" title="Contenido inicial de Mente Fría" />
      <div className="space-y-4 p-5 text-sm">
        <p className="text-muted">
          Carga el catálogo de septiembre 2026 (23 productos), el manual de llamada (pasos A–L), políticas, objeciones, 22 escenarios, 5 dificultades y los criterios de score.
          Sólo agrega lo que falta: nunca sobrescribe tus cambios.
        </p>
        {empty && <Alert tone="warn">Todavía no hay productos cargados.</Alert>}
        <Button
          variant={empty ? "primary" : "secondary"}
          disabled={pending}
          onClick={async () => {
            const r = await exec(runSeed);
            if (r.ok && r.data) {
              const d = r.data;
              setMessage({
                tone: "good",
                text: `Listo. Agregados: ${d.products} productos, ${d.documents} documentos, ${d.scenarios} escenarios, ${d.difficulties} dificultades${d.scoring ? " y criterios de score" : ""}.`,
              });
            }
          }}
        >
          {pending ? "Cargando…" : "Cargar contenido inicial"}
        </Button>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
      </div>
    </Card>
  );
}
