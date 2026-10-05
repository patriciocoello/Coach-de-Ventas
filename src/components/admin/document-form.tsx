"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteDocument, saveDocument } from "@/app/(app)/admin/actions";
import { Alert, Button, Card, CardHeader, Field, Input, Select, Textarea } from "@/components/ui";
import { KNOWLEDGE_CATEGORIES } from "@/lib/knowledge/categories";
import type { KnowledgeDocument } from "@/lib/types";
import { useAction } from "./use-action";

export function DocumentForm({ doc }: { doc: KnowledgeDocument | null }) {
  const router = useRouter();
  const { pending, message, setMessage, exec } = useAction();
  const [title, setTitle] = useState(doc?.title ?? "");
  const [category, setCategory] = useState(doc?.category ?? "manual");
  const [content, setContent] = useState(doc?.content ?? "");
  const [priority, setPriority] = useState(String(doc?.priority ?? 50));
  const [useEval, setUseEval] = useState(doc?.use_in_evaluation ?? true);
  const [useCustomer, setUseCustomer] = useState(doc?.use_in_customer ?? false);
  const [active, setActive] = useState(doc?.active ?? true);
  const [source, setSource] = useState<{ name: string | null; path: string | null }>({ name: doc?.source_file_name ?? null, path: doc?.storage_path ?? null });
  const [extracting, setExtracting] = useState(false);

  async function onFile(file: File) {
    setExtracting(true);
    setMessage(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/admin/extract", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setExtracting(false);
    if (!res.ok) return setMessage({ tone: "bad", text: data.error ?? "No se pudo leer el archivo." });
    setContent(data.text);
    setSource({ name: data.fileName, path: data.storagePath });
    if (!title) setTitle(data.fileName.replace(/\.[^.]+$/, ""));
    setMessage({ tone: "good", text: "Texto extraído. Revísalo (sobre todo tablas) y guarda." });
  }

  async function save() {
    const res = await exec(() =>
      saveDocument({
        id: doc?.id,
        title,
        category,
        content,
        priority: Number(priority) || 0,
        use_in_customer: useCustomer,
        use_in_evaluation: useEval,
        active,
        source_file_name: source.name,
        storage_path: source.path,
      }),
    );
    if (res.ok && !doc && res.data) router.replace(`/admin/conocimiento/${res.data.id}`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Archivo" eyebrow="Opcional" />
        <div className="p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-8 text-center text-sm text-muted hover:border-foreground">
            {extracting ? "Leyendo archivo…" : "Sube un PDF, TXT, MD o CSV para extraer su texto"}
            {source.name && <span className="mt-1 text-xs text-subtle">Archivo actual: {source.name}</span>}
            <input type="file" accept=".pdf,.txt,.md,.csv,application/pdf,text/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
        </div>
      </Card>
      <Card>
        <CardHeader title="Contenido" />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Field label="Título" className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Categoría">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {KNOWLEDGE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Texto (Markdown)" className="sm:col-span-3" hint="Es exactamente lo que leen los agentes. Mientras más claro y estructurado, mejor.">
            <Textarea rows={22} value={content} onChange={(e) => setContent(e.target.value)} className="font-mono text-xs leading-relaxed" />
          </Field>
          <Field label="Prioridad (0-100)" hint="El manual debería tener la más alta.">
            <Input value={priority} onChange={(e) => setPriority(e.target.value)} inputMode="numeric" />
          </Field>
          <div className="space-y-2 pt-6 text-sm sm:col-span-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useEval} onChange={(e) => setUseEval(e.target.checked)} /> Lo usa el coach para evaluar
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useCustomer} onChange={(e) => setUseCustomer(e.target.checked)} /> Lo puede “saber” el cliente simulado (p. ej. info pública o de competidores)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Activo
            </label>
          </div>
        </div>
      </Card>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <div className="flex gap-3">
        <Button onClick={save} disabled={pending || !title || !content}>
          {pending ? "Guardando…" : "Guardar documento"}
        </Button>
        {doc && (
          <Button
            variant="ghost"
            onClick={async () => {
              if (!confirm(`¿Eliminar "${doc.title}"?`)) return;
              const r = await exec(() => deleteDocument(doc.id));
              if (r.ok) router.replace("/admin/conocimiento");
            }}
          >
            Eliminar
          </Button>
        )}
      </div>
    </div>
  );
}
