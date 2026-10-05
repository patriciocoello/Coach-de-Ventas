import { notFound } from "next/navigation";
import { DocumentForm } from "@/components/admin/document-form";
import { PageHeader } from "@/components/ui";
import { getDocument } from "@/lib/data/catalog";

export default async function DocumentEdit({ params }: PageProps<"/admin/conocimiento/[id]">) {
  const { id } = await params;
  const doc = id === "nuevo" ? null : await getDocument(id);
  if (id !== "nuevo" && !doc) notFound();
  return (
    <>
      <PageHeader eyebrow="Admin · Documentos" title={doc ? doc.title : "Nuevo documento"} />
      <DocumentForm doc={doc} />
    </>
  );
}
