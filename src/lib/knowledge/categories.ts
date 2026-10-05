export const KNOWLEDGE_CATEGORIES: { key: string; label: string }[] = [
  { key: "manual", label: "Manual de ventas" },
  { key: "catalog", label: "Catálogo" },
  { key: "product_info", label: "Información de productos" },
  { key: "technical_sheet", label: "Ficha técnica" },
  { key: "pricing", label: "Precios" },
  { key: "profiling_questions", label: "Preguntas de perfilamiento" },
  { key: "objections", label: "Objeciones comunes" },
  { key: "recommended_responses", label: "Respuestas recomendadas" },
  { key: "policies", label: "Políticas" },
  { key: "installation", label: "Instalación" },
  { key: "logistics", label: "Logística" },
  { key: "faq", label: "FAQs" },
  { key: "competitors", label: "Competidores" },
  { key: "other", label: "Otro" },
];

export const categoryLabel = (key: string) =>
  KNOWLEDGE_CATEGORIES.find((c) => c.key === key)?.label ?? key;
