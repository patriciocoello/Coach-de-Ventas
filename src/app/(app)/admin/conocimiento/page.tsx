import Link from "next/link";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { listDocuments } from "@/lib/data/catalog";
import { formatDate } from "@/lib/format";
import { categoryLabel } from "@/lib/knowledge/categories";

export default async function KnowledgeAdmin() {
  const docs = await listDocuments();
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Manual y documentos"
        description="Manual de ventas, políticas, objeciones, FAQs, instalación, logística, competidores… El coach evalúa contra estos documentos y el manual tiene prioridad."
        action={<ButtonLink href="/admin/conocimiento/nuevo">Subir o crear documento</ButtonLink>}
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-subtle">
              <th className="px-5 py-3 font-medium">Documento</th>
              <th className="px-5 py-3 font-medium">Categoría</th>
              <th className="px-5 py-3 font-medium">Prioridad</th>
              <th className="px-5 py-3 font-medium">Uso</th>
              <th className="px-5 py-3 font-medium">Actualizado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {docs.map((d) => (
              <tr key={d.id} className="hover:bg-panel">
                <td className="px-5 py-3">
                  <Link href={`/admin/conocimiento/${d.id}`} className="font-medium hover:underline">
                    {d.title}
                  </Link>
                  <div className="text-xs text-subtle">{d.content.length.toLocaleString("es-MX")} caracteres{d.source_file_name ? ` · ${d.source_file_name}` : ""}</div>
                </td>
                <td className="px-5 py-3">{categoryLabel(d.category)}</td>
                <td className="px-5 py-3 tabular-nums">{d.priority}</td>
                <td className="space-x-1 px-5 py-3">
                  {!d.active && <Badge>Inactivo</Badge>}
                  {d.use_in_evaluation && <Badge tone="dark">Coach</Badge>}
                  {d.use_in_customer && <Badge tone="ice">Cliente</Badge>}
                </td>
                <td className="px-5 py-3 text-muted">{formatDate(d.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
