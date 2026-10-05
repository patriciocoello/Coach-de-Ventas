export function formatDuration(seconds: number | null | undefined) {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatHours(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { timeZone: "America/Mexico_City", ...opts });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function money(n: number | null | undefined) {
  if (n == null) return "—";
  return `$${Number(n).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}

export function scoreTone(score: number | null | undefined): "good" | "warn" | "bad" | "neutral" {
  if (score == null) return "neutral";
  if (score >= 80) return "good";
  if (score >= 60) return "warn";
  return "bad";
}
