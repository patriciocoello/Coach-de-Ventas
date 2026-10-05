import type { DifficultyLevel, MarketSegment, Scenario } from "@/lib/types";

type SeedScenario = Omit<Scenario, "id">;

const s = (
  key: string,
  name: string,
  segment: MarketSegment,
  description: string,
  prompt_hints: string,
  likely_products: string[],
  sort_order: number,
): SeedScenario => ({ key, name, segment, description, prompt_hints, likely_products, active: true, sort_order });

export const SEED_SCENARIOS: SeedScenario[] = [
  s("residencial", "Residencial", "residential", "Persona que lo quiere para su casa.", "Uso personal o familiar en su casa actual. Puede ser por salud, sueño, estrés o entrenamiento.", ["mf-horizon-premium", "mf-horizon-pro", "mf-one"], 10),
  s("casa_nueva", "Casa nueva", "residential", "Está construyendo o acaba de comprar casa.", "Está construyendo o mudándose; tiene fecha de entrega de la casa y quiere integrar el equipo al diseño. Puede haber arquitecto o pareja involucrados.", ["mf-one", "huum-003"], 20),
  s("remodelacion", "Remodelación", "residential", "Remodela un espacio (terraza, jardín, baño).", "Está remodelando; le importan las medidas, el acceso y la estética. Restricciones de espacio o de obra.", ["mf-one", "mf-barrel-premium"], 30),
  s("wellness", "Centro wellness", "commercial", "Abre o tiene un centro wellness.", "Negocio de bienestar; piensa en número de clientes al día, experiencia que quiere ofrecer, fecha de apertura y retorno de inversión. A clientes comerciales no se les cotiza Motor Pro.", ["mf-one", "mf-horizon-premium", "huum-005"], 40),
  s("spa", "Spa", "commercial", "Spa que quiere agregar contraste frío/calor.", "Spa con huéspedes o clientes recurrentes; le importa la estética, el ozono/higiene y la operación diaria.", ["mf-one", "huum-003"], 50),
  s("hotel", "Hotel", "commercial", "Hotel boutique o resort.", "Hotel que quiere un plus para huéspedes; hay gerente, dueño o corporativo involucrado; compras con proceso y factura.", ["mf-one", "mf-steel-horizon", "huum-005"], 60),
  s("gimnasio", "Gimnasio", "commercial", "Gimnasio o box de CrossFit.", "Alto tráfico de usuarios, quiere servicio nuevo de recuperación; le preocupa la durabilidad y el mantenimiento.", ["mf-steel-barrel", "mf-horizon-premium", "motor-comercial-2hp"], 70),
  s("club_deportivo", "Club deportivo", "commercial", "Club deportivo o de golf/tenis.", "Club con socios; decisión por comité o gerente; presupuesto anual; varios usuarios al día.", ["mf-steel-barrel", "mf-one"], 80),
  s("fisioterapia", "Fisioterapia", "commercial", "Clínica de fisioterapia.", "Clínica que usa frío para recuperación de pacientes; le importa la temperatura exacta, la higiene y la evidencia.", ["mf-one", "mf-horizon-premium"], 90),
  s("recuperacion", "Centro de recuperación", "commercial", "Centro de recuperación deportiva.", "Negocio de recuperación (crioterapia, compresión); ya conoce el frío; compara especificaciones.", ["mf-steel-barrel", "mf-one"], 100),
  s("atleta", "Atleta", "residential", "Atleta amateur o profesional.", "Entrena fuerte (maratón, triatlón, CrossFit, futbol); quiere recuperarse mejor; probablemente ya hizo baños de hielo.", ["mf-horizon-pro", "mf-horizon-premium", "mf-barrel-pro"], 110),
  s("entrenador", "Entrenador", "both", "Entrenador personal o coach.", "Lo quiere para sus clientes y para él; puede revenderlo o recomendarlo; busca algo portátil o para su estudio.", ["mf-horizon-premium", "mf-barrel-premium"], 120),
  s("arquitecto", "Arquitecto", "both", "Arquitecto que especifica para un cliente.", "Habla en nombre de su cliente final; le importan medidas, fichas técnicas, requisitos eléctricos y tiempos. El decisor es su cliente.", ["mf-one", "huum-003", "mf-steel-horizon"], 130),
  s("interiorista", "Interiorista", "both", "Diseñador de interiores.", "Le importa la estética, colores, materiales y cómo se integra al espacio. El decisor es el cliente final.", ["mf-one", "huum-001"], 140),
  s("desarrollo", "Desarrollo inmobiliario", "commercial", "Desarrollador que equipa amenidades.", "Amenidades para un desarrollo; volumen potencial de varias unidades; proceso largo con varios decisores; fechas de obra.", ["mf-one", "huum-005", "mf-steel-barrel"], 150),
  s("empresa", "Empresa", "commercial", "Empresa que lo quiere para sus colaboradores.", "Programa de bienestar corporativo; RR. HH. y dirección involucrados; requiere factura.", ["mf-one", "mf-horizon-premium"], 160),
  s("instagram", "Cliente de Instagram", "residential", "Llegó por un anuncio o reel de Instagram.", "Vio un reel; poco conocimiento; curioso; puede preguntar precio de inmediato. Mandó un DM corto.", ["mf-horizon-pro", "mf-horizon-premium"], 170),
  s("referido", "Cliente referido", "residential", "Lo refirió un cliente actual.", "Un amigo ya tiene una tina Mente Fría; llega con confianza pero con expectativas específicas por lo que le contó su amigo.", ["mf-one", "mf-horizon-premium"], 180),
  s("comparando", "Comparando competencia", "both", "Está comparando con otras marcas.", "Evalúa 2–3 opciones; compara precio, garantía y especificaciones; quiere saber por qué Mente Fría.", ["mf-horizon-premium", "mf-one"], 190),
  s("sensible_precio", "Muy sensible al precio", "residential", "Le importa mucho el precio.", "Presupuesto ajustado; pregunta precio pronto; pide descuento; puede funcionar con la opción de entrada.", ["mf-horizon-pro", "mf-barrel-pro"], 200),
  s("info_rapida", "Quiere información rápida", "residential", "Tiene prisa y quiere datos ya.", "Está ocupado; contesta entre juntas; quiere precio y que le manden info; impaciente con preguntas que no ve útiles.", ["mf-horizon-premium", "mf-horizon-pro"], 210),
  s("ya_cotizo", "Ya cotizó con otra marca", "both", "Ya tiene una cotización de otra marca.", "Tiene una cotización concreta de otra marca (sin nombrar marcas reales); usa el precio de la competencia para negociar.", ["mf-horizon-premium", "mf-one"], 220),
];

const r = (a: number, b: number): [number, number] => [a, b];

export const SEED_DIFFICULTIES: DifficultyLevel[] = [
  {
    key: "facil",
    name: "Fácil",
    description: "Cliente abierto, da bastante información y muestra interés.",
    param_ranges: {
      talkativeness: r(65, 90), skepticism: r(5, 30), priceSensitivity: r(10, 50), technicalKnowledge: r(10, 60),
      urgency: r(50, 90), brandAwareness: r(30, 80), patience: r(70, 95), decisionAuthority: r(60, 100),
      purchaseIntent: r(60, 85), competitorExposure: r(0, 30),
    },
    behavior_prompt:
      "Eres un cliente abierto y amable. Contestas con detalle cuando te preguntan y a veces agregas un dato relacionado de tu vida. Aun así, NO reveles datos clave (presupuesto, decisor, fechas, medidas) si no te los preguntan. Si el vendedor hace buenas preguntas, muestras entusiasmo y señales de compra. Puedes cerrar en esta llamada si te recomiendan bien.",
    prep_detail: "full",
    sort_order: 10,
  },
  {
    key: "medio",
    name: "Medio",
    description: "Cliente normal que requiere buen descubrimiento.",
    param_ranges: {
      talkativeness: r(40, 70), skepticism: r(25, 55), priceSensitivity: r(30, 70), technicalKnowledge: r(20, 60),
      urgency: r(30, 70), brandAwareness: r(20, 60), patience: r(50, 80), decisionAuthority: r(40, 90),
      purchaseIntent: r(40, 65), competitorExposure: r(20, 60),
    },
    behavior_prompt:
      "Eres un cliente normal. Contestas lo que te preguntan sin extenderte mucho. Tienes al menos una objeción real. Si el vendedor te presenta producto antes de entenderte, te enfrías un poco y preguntas el precio. Sólo avanzas si sientes que te entendieron.",
    prep_detail: "partial",
    sort_order: 20,
  },
  {
    key: "dificil",
    name: "Difícil",
    description: "Cliente con objeciones y respuestas más breves.",
    param_ranges: {
      talkativeness: r(20, 50), skepticism: r(50, 75), priceSensitivity: r(50, 85), technicalKnowledge: r(30, 70),
      urgency: r(15, 55), brandAwareness: r(10, 50), patience: r(30, 60), decisionAuthority: r(20, 80),
      purchaseIntent: r(25, 50), competitorExposure: r(50, 85),
    },
    behavior_prompt:
      "Eres un cliente difícil. Respuestas breves (a veces una o dos palabras). Preguntas el precio pronto. Tienes varias objeciones y una oculta que sólo sale si el vendedor pregunta bien. Si el vendedor habla mucho o recita características, te impacientas. Si te presionan sin entenderte, dices que lo vas a pensar. Nunca facilitas el trabajo del vendedor.",
    prep_detail: "partial",
    sort_order: 30,
  },
  {
    key: "muy_dificil",
    name: "Muy difícil",
    description: "Cliente escéptico, poco comunicativo y con varias alternativas.",
    param_ranges: {
      talkativeness: r(10, 35), skepticism: r(70, 90), priceSensitivity: r(60, 95), technicalKnowledge: r(30, 80),
      urgency: r(5, 40), brandAwareness: r(0, 40), patience: r(15, 45), decisionAuthority: r(10, 70),
      purchaseIntent: r(15, 40), competitorExposure: r(70, 100),
    },
    behavior_prompt:
      "Eres muy escéptico y poco comunicativo. Contestas con lo mínimo ('sí', 'más o menos', 'no sé'). Ya viste varias alternativas más baratas y lo mencionas. Desconfías de afirmaciones sin sustento. Si el vendedor no hace preguntas abiertas y relevantes, la conversación se muere y buscas colgar ('mándame la info por WhatsApp'). Sólo te abres un poco cuando el vendedor demuestra que entendió tu situación con tus propias palabras.",
    prep_detail: "minimal",
    sort_order: 40,
  },
  {
    key: "experto",
    name: "Experto",
    description: "Cliente sofisticado que detecta si le venden antes de entenderlo.",
    param_ranges: {
      talkativeness: r(30, 60), skepticism: r(75, 95), priceSensitivity: r(40, 80), technicalKnowledge: r(65, 95),
      urgency: r(20, 60), brandAwareness: r(20, 60), patience: r(20, 50), decisionAuthority: r(70, 100),
      purchaseIntent: r(30, 55), competitorExposure: r(60, 95),
    },
    behavior_prompt:
      "Eres un comprador sofisticado (directivo, empresario o comprador profesional). Conoces el producto y la competencia, haces preguntas técnicas precisas y detectas de inmediato cuando el vendedor intenta vender antes de entender tu situación: en ese caso lo dices con educación pero con firmeza ('Espérame, todavía no sabes qué necesito') y bajas tu interés. Pones a prueba al vendedor con preguntas cuya respuesta no está en la información oficial para ver si inventa. Valoras la precisión, la honestidad y un siguiente paso claro. Respondes bien a vendedores que dirigen la llamada con preguntas inteligentes.",
    prep_detail: "minimal",
    sort_order: 50,
  },
];
