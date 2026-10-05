import { z, type ZodType } from "zod";

// Extrae y parsea JSON de una respuesta de modelo (tolera ```json ... ```).
export function extractJSON(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.search(/[[{]/);
    const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
    if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1));
    throw new Error("La respuesta del modelo no contiene JSON válido.");
  }
}

// JSON Schema para pasar al modelo como guía de salida estructurada.
// Se limpian palabras clave que los proveedores no siempre aceptan.
export function toJSONSchema(schema: ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { target: "draft-7", unrepresentable: "any" }) as Record<string, unknown>;
  return sanitize(json) as Record<string, unknown>;
}

function sanitize(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitize);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (k === "$schema" || k === "default") continue;
    if ((k === "minimum" || k === "maximum") && typeof v === "number" && Math.abs(v) > 1e9) continue;
    out[k] = sanitize(v);
  }
  return out;
}
