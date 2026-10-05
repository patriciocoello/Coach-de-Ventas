import type { KnowledgeDocument, Product } from "@/lib/types";

// Convierte productos y documentos en texto para los prompts. Los documentos
// internos son la fuente de verdad; aquí no se agrega nada que no venga de la base.

const money = (n: number | null | undefined) =>
  n == null ? "—" : `$${Number(n).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

const STOCK_LABEL: Record<Product["stock_status"], string> = {
  in_stock: "En stock",
  backorder: "Bajo pedido",
  unavailable: "No disponible",
};

const SEGMENT_LABEL: Record<Product["segment"], string> = {
  residential: "Residencial",
  commercial: "Comercial",
  both: "Residencial y comercial",
};

export function productToText(p: Product, detail: "full" | "brief" = "full"): string {
  const head = `### ${p.name} [slug: ${p.slug}] · ${p.category}\nPrecio: ${money(p.price)} ${p.currency} + IVA · Envío: ${money(p.shipping_cost)} · Disponibilidad: ${STOCK_LABEL[p.stock_status]}${p.delivery_time ? ` (${p.delivery_time})` : ""} · Segmento: ${SEGMENT_LABEL[p.segment]}`;
  if (detail === "brief") return `${head}\n${p.description}`;
  const parts = [head, p.description];
  if (p.stock_notes) parts.push(`Notas de stock: ${p.stock_notes}`);
  if (p.price_notes) parts.push(`Notas de precio y condiciones: ${p.price_notes}`);
  if (p.features.length) parts.push(`Características:\n${p.features.map((f) => `- ${f}`).join("\n")}`);
  if (p.benefits.length) parts.push(`Beneficios:\n${p.benefits.map((f) => `- ${f}`).join("\n")}`);
  const specs = Object.entries(p.specs ?? {});
  if (specs.length) parts.push(`Especificaciones:\n${specs.map(([k, v]) => `- ${k}: ${v}`).join("\n")}`);
  if (p.ideal_use) parts.push(`Uso ideal: ${p.ideal_use}`);
  if (p.recommended_customer) parts.push(`Cliente recomendado: ${p.recommended_customer}`);
  if (p.installation_requirements) parts.push(`Instalación: ${p.installation_requirements}`);
  if (p.warranty) parts.push(`Garantía: ${p.warranty}`);
  if (p.faqs?.length) parts.push(`FAQs:\n${p.faqs.map((f) => `- P: ${f.q}\n  R: ${f.a}`).join("\n")}`);
  if (p.objections?.length)
    parts.push(`Objeciones relacionadas:\n${p.objections.map((o) => `- "${o.objection}" → ${o.response}`).join("\n")}`);
  return parts.join("\n");
}

export function catalogToText(products: Product[], detail: "full" | "brief" = "full"): string {
  return products.filter((p) => p.active).map((p) => productToText(p, detail)).join("\n\n");
}

export function documentsToText(docs: KnowledgeDocument[], opts: { purpose: "evaluation" | "customer"; maxChars?: number }) {
  const selected = docs
    .filter((d) => d.active && (opts.purpose === "evaluation" ? d.use_in_evaluation : d.use_in_customer))
    .sort((a, b) => b.priority - a.priority);
  const max = opts.maxChars ?? 120_000;
  let total = 0;
  const out: string[] = [];
  for (const d of selected) {
    const block = `<<DOCUMENTO: ${d.title} · categoría: ${d.category}>>\n${d.content.trim()}\n<<FIN DOCUMENTO>>`;
    if (total + block.length > max) {
      out.push(block.slice(0, Math.max(0, max - total)));
      break;
    }
    out.push(block);
    total += block.length;
  }
  return out.join("\n\n");
}
