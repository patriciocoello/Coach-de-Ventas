// Tipos de dominio compartidos por UI, motor de simulación y motor de evaluación.

export type UserRole = "seller" | "manager" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Productos y conocimiento
// ---------------------------------------------------------------------------
export type StockStatus = "in_stock" | "backorder" | "unavailable";
export type MarketSegment = "residential" | "commercial" | "both";

export interface FAQ {
  q: string;
  a: string;
}

export interface ProductObjection {
  objection: string;
  response: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number | null;
  currency: string;
  price_notes: string;
  shipping_cost: number | null;
  delivery_time: string;
  stock_status: StockStatus;
  stock_notes: string;
  segment: MarketSegment;
  features: string[];
  benefits: string[];
  specs: Record<string, string>;
  ideal_use: string;
  recommended_customer: string;
  installation_requirements: string;
  warranty: string;
  images: string[];
  faqs: FAQ[];
  objections: ProductObjection[];
  active: boolean;
  sort_order: number;
  updated_at?: string;
}

export type ProductInput = Omit<Product, "id" | "updated_at">;

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  source_file_name: string | null;
  storage_path: string | null;
  priority: number;
  use_in_customer: boolean;
  use_in_evaluation: boolean;
  active: boolean;
  updated_at?: string;
}

// ---------------------------------------------------------------------------
// Escenarios, dificultad y personalidad
// ---------------------------------------------------------------------------
export const PERSONALITY_KEYS = [
  "talkativeness",
  "skepticism",
  "priceSensitivity",
  "technicalKnowledge",
  "urgency",
  "brandAwareness",
  "patience",
  "decisionAuthority",
  "purchaseIntent",
  "competitorExposure",
] as const;

export type PersonalityKey = (typeof PERSONALITY_KEYS)[number];
export type PersonalityParams = Record<PersonalityKey, number>;
export type ParamRanges = Record<PersonalityKey, [number, number]>;

export interface Scenario {
  id: string;
  key: string;
  name: string;
  description: string;
  segment: MarketSegment;
  prompt_hints: string;
  likely_products: string[];
  active: boolean;
  sort_order: number;
}

export type PrepDetail = "full" | "partial" | "minimal";

export interface DifficultyLevel {
  key: string;
  name: string;
  description: string;
  param_ranges: ParamRanges;
  behavior_prompt: string;
  prep_detail: PrepDetail;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// Perfil secreto del cliente
// ---------------------------------------------------------------------------
export interface HiddenInfo {
  info: string;
  revealWhen: string;
}

export interface SecretProfile {
  name: string;
  gender: "female" | "male";
  age: number;
  city: string;
  profession: string;
  customerType: string;
  segment: "residential" | "commercial";
  source: string; // de dónde llegó: Instagram, referido, web…
  personalitySummary: string;
  speakingStyle: string;
  greeting: string; // primera frase al contestar
  lookingFor: string;
  mainProblem: string;
  motivation: string;
  experience: string;
  recommendedProduct: string; // slug
  recommendedProductReason: string;
  alternativeProduct: string | null;
  installationPlace: string;
  indoorOutdoor: string;
  availableSpace: string;
  restrictions: string;
  budget: number | null;
  budgetText: string;
  targetDate: string;
  urgency: string;
  decisionMaker: string;
  othersInvolved: string;
  competitors: string;
  knowledgeLevel: string;
  objections: string[];
  hiddenObjection: string;
  priorities: string[];
  fears: string[];
  valuedFeatures: string[];
  uninterestingFeatures: string[];
  initialPurchaseProbability: number; // 0-100
  closingConditions: string; // qué necesita para avanzar
  hiddenInfo: HiddenInfo[];
  behaviors: string[]; // subconjunto de comportamientos para esta llamada
  buyingSignals: string[];
  prepMessage: string | null; // mensaje que mandó antes de la llamada (si aplica)
  facts: Record<string, string>; // valor verdadero por campo de descubrimiento
  params: PersonalityParams;
}

export interface PrepBrief {
  name: string;
  source: string;
  customerType: string | null;
  city: string | null;
  message: string | null;
  previousConversation: string | null;
  productMentioned: string | null;
  callObjective: string;
}

export interface CustomerState {
  purchaseIntent: number;
  mood: string;
  revealed: string[]; // keys de campos ya revelados
  turns: number;
}

// ---------------------------------------------------------------------------
// Transcripción
// ---------------------------------------------------------------------------
export type Speaker = "seller" | "customer";

export interface TranscriptTurn {
  id?: string;
  seq: number;
  speaker: Speaker;
  text: string;
  t_offset_ms: number;
  meta?: TurnMeta;
}

export interface TurnMeta {
  revealed?: string[];
  purchaseIntent?: number;
  mood?: string;
  interrupted?: boolean; // el vendedor interrumpió al cliente
  customerInterrupted?: boolean; // el cliente interrumpió al vendedor
  event?: "start" | "silence" | "turn";
  hangup?: boolean;
}

// ---------------------------------------------------------------------------
// Configuración de evaluación
// ---------------------------------------------------------------------------
export interface ScoringCategory {
  key: string;
  label: string;
  short: string;
  weight: number;
  description: string;
  manualSteps: string[];
  criteria: string[];
}

export interface ScoringRule {
  id: string;
  description: string;
  category: string;
  penalty: number;
  active: boolean;
}

export interface DiscoveryField {
  key: string;
  label: string;
  description: string;
  importance: "critical" | "high" | "medium";
  appliesTo: "all" | "residential" | "commercial";
  exampleQuestion: string;
}

export interface ScoringConfig {
  categories: ScoringCategory[];
  rules: ScoringRule[];
  discovery_fields: DiscoveryField[];
  coach_notes: string;
}

// ---------------------------------------------------------------------------
// Evaluación
// ---------------------------------------------------------------------------
export type CallOutcome = "payment" | "next_step" | "discarded" | "open";

export interface CategoryScore {
  key: string;
  label: string;
  score: number;
  max: number;
  justification: string;
}

export interface DiscoveryResult {
  key: string;
  label: string;
  discovered: boolean;
  partial: boolean;
  actualValue: string;
  sellerLearned: string;
  evidenceTurn: number | null;
}

export interface FeedbackItem {
  text: string;
  turn: number | null;
  quote: string | null;
}

export interface MissedOpportunity {
  turn: number | null;
  customerSaid: string;
  sellerSaid: string;
  explanation: string;
  betterQuestions: string[];
}

export interface Moment {
  turn: number | null;
  quote: string;
  explanation: string;
}

export interface ImprovedExchange {
  turn: number | null;
  customer: string;
  seller: string;
  better: string;
  explanation: string;
}

export interface RuleViolation {
  ruleId: string;
  description: string;
  turn: number | null;
  quote: string | null;
}

export interface ManualStepCheck {
  step: string;
  name: string;
  status: "done" | "partial" | "missing" | "na";
  note: string;
}

export interface Evaluation {
  totalScore: number;
  rating: string;
  summary: string;
  categories: CategoryScore[];
  discovery: DiscoveryResult[];
  strengths: FeedbackItem[];
  improvements: FeedbackItem[];
  missedQuestions: string[];
  goodQuestions: FeedbackItem[];
  missedOpportunities: MissedOpportunity[];
  strongestMoment: Moment;
  weakestMoment: Moment;
  goldenQuestion: { question: string; why: string };
  purchaseProbability: { before: number; after: number; factors: string[] };
  improvedConversation: ImprovedExchange[];
  ruleViolations: RuleViolation[];
  manualSteps: ManualStepCheck[];
  outcome: CallOutcome;
  outcomeExplanation: string;
  questionsBeforeRecommendation: number | null;
  productRecommended: string | null;
  productFit: string;
  talkRatio: { seller: number; customer: number };
}

export interface FollowupEvaluation {
  score: number; // 0-10
  feedback: string;
  strengths: string[];
  improvements: string[];
  improvedMessage: string;
}

// ---------------------------------------------------------------------------
// Simulación
// ---------------------------------------------------------------------------
export type SimulationStatus =
  | "ready"
  | "in_progress"
  | "evaluating"
  | "completed"
  | "failed"
  | "abandoned";

export interface VoiceHint {
  gender: "female" | "male";
  rate: number;
  pitch: number;
}

export interface Simulation {
  id: string;
  user_id: string;
  scenario_key: string;
  scenario_name: string;
  difficulty_key: string;
  difficulty_name: string;
  prep_mode: "prep" | "cold";
  status: SimulationStatus;
  customer_name: string;
  customer_label: string;
  prep_brief: PrepBrief | null;
  voice_hint: VoiceHint;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  score: number | null;
  rating: string | null;
  category_scores: CategoryScore[] | null;
  outcome: CallOutcome | null;
  evaluation: Evaluation | null;
  followup_message: string | null;
  followup_evaluation: FollowupEvaluation | null;
  error: string | null;
  created_at: string;
}
