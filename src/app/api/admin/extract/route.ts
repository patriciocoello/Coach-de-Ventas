import { extractText, getDocumentProxy } from "unpdf";
import { apiProfile, errorResponse, HttpError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

const MAX_BYTES = 15 * 1024 * 1024;

// Recibe un archivo (PDF, TXT, MD, CSV), guarda el original en Storage y
// devuelve su texto para que el admin lo revise antes de guardarlo.
export async function POST(req: Request) {
  try {
    await apiProfile(["admin"]);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Falta el archivo");
    if (file.size > MAX_BYTES) throw new HttpError(400, "El archivo es demasiado grande (máx. 15 MB)");

    const bytes = new Uint8Array(await file.arrayBuffer());
    const name = file.name || "documento";
    let text = "";
    if (/\.pdf$/i.test(name) || file.type === "application/pdf") {
      const pdf = await getDocumentProxy(bytes);
      const result = await extractText(pdf, { mergePages: false });
      text = (result.text as string[]).map((t, i) => `--- Página ${i + 1} ---\n${t.trim()}`).join("\n\n");
    } else if (/\.(txt|md|csv|json)$/i.test(name) || file.type.startsWith("text/")) {
      text = new TextDecoder().decode(bytes);
    } else {
      throw new HttpError(400, "Formato no soportado. Sube PDF, TXT, MD o CSV.");
    }

    const db = createAdminClient();
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${name.replace(/[^\w.\-]+/g, "_")}`;
    const { error } = await db.storage.from("documents").upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
    });
    if (error) console.warn("No se pudo guardar el archivo original:", error.message);

    return Response.json({ text: text.trim(), fileName: name, storagePath: error ? null : path });
  } catch (err) {
    return errorResponse(err);
  }
}
