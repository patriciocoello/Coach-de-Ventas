"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteProduct, saveProduct, uploadProductImage } from "@/app/(app)/admin/actions";
import { Alert, Button, Card, CardHeader, Field, Input, Select, Textarea } from "@/components/ui";
import type { Product } from "@/lib/types";
import { useAction } from "./use-action";

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const blocks = (s: string) =>
  s
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      const [first, ...rest] = b.split("\n");
      return [first.trim(), rest.join("\n").trim()] as const;
    });

export function ProductForm({ product, categories }: { product: Product | null; categories: string[] }) {
  const router = useRouter();
  const { pending, message, setMessage, exec } = useAction();
  const p = product;
  const [f, setF] = useState({
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    category: p?.category ?? categories[0] ?? "",
    description: p?.description ?? "",
    price: p?.price?.toString() ?? "",
    price_notes: p?.price_notes ?? "",
    shipping_cost: p?.shipping_cost?.toString() ?? "",
    delivery_time: p?.delivery_time ?? "",
    stock_status: p?.stock_status ?? "in_stock",
    stock_notes: p?.stock_notes ?? "",
    segment: p?.segment ?? "both",
    features: (p?.features ?? []).join("\n"),
    benefits: (p?.benefits ?? []).join("\n"),
    specs: Object.entries(p?.specs ?? {}).map(([k, v]) => `${k}: ${v}`).join("\n"),
    ideal_use: p?.ideal_use ?? "",
    recommended_customer: p?.recommended_customer ?? "",
    installation_requirements: p?.installation_requirements ?? "",
    warranty: p?.warranty ?? "",
    faqs: (p?.faqs ?? []).map((x) => `${x.q}\n${x.a}`).join("\n\n"),
    objections: (p?.objections ?? []).map((x) => `${x.objection}\n${x.response}`).join("\n\n"),
    active: p?.active ?? true,
    sort_order: p?.sort_order?.toString() ?? "0",
  });
  const [images, setImages] = useState<string[]>(p?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function save() {
    const specs: Record<string, string> = {};
    for (const l of lines(f.specs)) {
      const i = l.indexOf(":");
      if (i > 0) specs[l.slice(0, i).trim()] = l.slice(i + 1).trim();
    }
    const res = await exec(() =>
      saveProduct({
        id: p?.id,
        slug: f.slug || f.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        name: f.name,
        category: f.category,
        description: f.description,
        price: f.price ? Number(f.price.replace(/[^0-9.]/g, "")) : null,
        currency: "MXN",
        price_notes: f.price_notes,
        shipping_cost: f.shipping_cost ? Number(f.shipping_cost.replace(/[^0-9.]/g, "")) : null,
        delivery_time: f.delivery_time,
        stock_status: f.stock_status as Product["stock_status"],
        stock_notes: f.stock_notes,
        segment: f.segment as Product["segment"],
        features: lines(f.features),
        benefits: lines(f.benefits),
        specs,
        ideal_use: f.ideal_use,
        recommended_customer: f.recommended_customer,
        installation_requirements: f.installation_requirements,
        warranty: f.warranty,
        images,
        faqs: blocks(f.faqs).map(([q, a]) => ({ q, a })),
        objections: blocks(f.objections).map(([objection, response]) => ({ objection, response })),
        active: f.active,
        sort_order: Number(f.sort_order) || 0,
      }),
    );
    if (res.ok && !p && res.data) router.replace(`/admin/productos/${res.data.id}`);
  }

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadProductImage(fd);
    setUploading(false);
    if (res.ok && res.data) setImages((i) => [...i, res.data!.url]);
    else if (!res.ok) setMessage({ tone: "bad", text: res.error });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="General" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Nombre">
            <Input value={f.name} onChange={set("name")} />
          </Field>
          <Field label="Identificador (slug)" hint="Se usa internamente. Ej. mf-one">
            <Input value={f.slug} onChange={set("slug")} placeholder="se genera del nombre" />
          </Field>
          <Field label="Categoría">
            <Input list="cats" value={f.category} onChange={set("category")} />
            <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Segmento">
            <Select value={f.segment} onChange={set("segment")}>
              <option value="both">Residencial y comercial</option>
              <option value="residential">Residencial</option>
              <option value="commercial">Comercial</option>
            </Select>
          </Field>
          <Field label="Descripción" className="sm:col-span-2">
            <Textarea value={f.description} onChange={set("description")} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Precio y disponibilidad" />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Field label="Precio (MXN + IVA)">
            <Input value={f.price} onChange={set("price")} inputMode="numeric" />
          </Field>
          <Field label="Envío (MXN)">
            <Input value={f.shipping_cost} onChange={set("shipping_cost")} inputMode="numeric" />
          </Field>
          <Field label="Tiempo de entrega">
            <Input value={f.delivery_time} onChange={set("delivery_time")} />
          </Field>
          <Field label="Stock">
            <Select value={f.stock_status} onChange={set("stock_status")}>
              <option value="in_stock">En stock</option>
              <option value="backorder">Bajo pedido</option>
              <option value="unavailable">No disponible</option>
            </Select>
          </Field>
          <Field label="Notas de stock" className="sm:col-span-2">
            <Input value={f.stock_notes} onChange={set("stock_notes")} />
          </Field>
          <Field label="Condiciones, anticipo y concesiones autorizadas" className="sm:col-span-3" hint="El coach usa esto para detectar descuentos o promesas no autorizadas.">
            <Textarea value={f.price_notes} onChange={set("price_notes")} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Producto" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Características" hint="Una por línea">
            <Textarea rows={6} value={f.features} onChange={set("features")} />
          </Field>
          <Field label="Beneficios" hint="Uno por línea">
            <Textarea rows={6} value={f.benefits} onChange={set("benefits")} />
          </Field>
          <Field label="Especificaciones" hint="Una por línea: Clave: valor" className="sm:col-span-2">
            <Textarea rows={6} value={f.specs} onChange={set("specs")} />
          </Field>
          <Field label="Uso ideal">
            <Textarea value={f.ideal_use} onChange={set("ideal_use")} />
          </Field>
          <Field label="Tipo de cliente recomendado">
            <Textarea value={f.recommended_customer} onChange={set("recommended_customer")} />
          </Field>
          <Field label="Requisitos de instalación">
            <Textarea value={f.installation_requirements} onChange={set("installation_requirements")} />
          </Field>
          <Field label="Garantía">
            <Textarea value={f.warranty} onChange={set("warranty")} />
          </Field>
          <Field label="FAQs" hint="Bloques separados por una línea vacía: primera línea la pregunta, después la respuesta.">
            <Textarea rows={6} value={f.faqs} onChange={set("faqs")} />
          </Field>
          <Field label="Objeciones relacionadas" hint="Bloques separados por una línea vacía: primera línea la objeción, después la respuesta recomendada.">
            <Textarea rows={6} value={f.objections} onChange={set("objections")} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Fotografías" />
        <div className="p-5">
          <div className="flex flex-wrap gap-3">
            {images.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-24 w-24 rounded-xl border border-line object-cover" />
                <button onClick={() => setImages((i) => i.filter((x) => x !== url))} className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-foreground text-xs text-white">
                  ✕
                </button>
              </div>
            ))}
            <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border border-dashed border-line text-xs text-muted hover:border-foreground">
              {uploading ? "Subiendo…" : "+ Foto"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Activo (se usa en las simulaciones)
        </label>
        <Field label="Orden" className="w-24">
          <Input value={f.sort_order} onChange={set("sort_order")} />
        </Field>
      </div>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <div className="flex gap-3">
        <Button onClick={save} disabled={pending || !f.name}>
          {pending ? "Guardando…" : "Guardar producto"}
        </Button>
        {p && (
          <Button
            variant="ghost"
            onClick={async () => {
              if (!confirm(`¿Eliminar ${p.name}? Mejor desactívalo si sólo no quieres usarlo.`)) return;
              const r = await exec(() => deleteProduct(p.id));
              if (r.ok) router.replace("/admin/productos");
            }}
          >
            Eliminar
          </Button>
        )}
      </div>
    </div>
  );
}
