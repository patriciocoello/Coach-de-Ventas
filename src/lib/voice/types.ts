// Abstracciones de voz (lado navegador).
//
// Hoy la llamada usa un pipeline:  TranscriptionProvider (STT)  →  servidor
// (LLM en streaming)  →  VoiceProvider (TTS).  La UI sólo conoce
// ConversationEngine, así que mañana se puede sustituir por un motor
// speech-to-speech en tiempo real (OpenAI Realtime, Gemini Live…) sin tocar
// la pantalla de llamada. Ver realtime.ts.

export type CallState =
  | "idle"
  | "connecting"
  | "ringing"
  | "listening"
  | "seller_speaking"
  | "thinking"
  | "customer_speaking"
  | "ended"
  | "error";

export interface LiveTurn {
  key: string;
  seq?: number;
  speaker: "seller" | "customer";
  text: string;
  tOffsetMs: number;
  pending?: boolean;
  interrupted?: boolean;
}

export interface ConversationEvents {
  onState(state: CallState): void;
  onTranscript(turns: LiveTurn[]): void;
  onInterim(text: string): void;
  onError(message: string, fatal: boolean): void;
  /** El cliente colgó o la llamada llegó a su límite. */
  onRemoteEnd(reason: "hangup" | "time_limit"): void;
}

export interface ConversationEngine {
  start(): Promise<void>;
  /** Termina la llamada y devuelve los datos para cerrar en el servidor. */
  stop(): { interruption: { seq: number; spokenText: string } | null };
  setMuted(muted: boolean): void;
  /** Respaldo por texto (si el micrófono falla). */
  sendText(text: string): void;
  readonly elapsedMs: number;
}

// --------------------------------------------------------------------------
// Proveedores intercambiables del pipeline
// --------------------------------------------------------------------------
export interface TranscriptionCallbacks {
  onInterim(text: string): void;
  onFinal(text: string): void;
  onError(code: string, fatal: boolean): void;
}

export interface TranscriptionProvider {
  readonly name: string;
  isSupported(): boolean;
  start(cb: TranscriptionCallbacks): void;
  pause(): void;
  resume(): void;
  stop(): void;
}

export interface VoiceOptions {
  gender: "female" | "male";
  rate: number;
  pitch: number;
  voiceURI?: string | null;
}

export interface VoiceProvider {
  readonly name: string;
  isSupported(): boolean;
  configure(opts: VoiceOptions): void;
  /** Encola un fragmento (una frase) para hablar. */
  enqueue(text: string): void;
  /** Detiene inmediatamente (barge-in). Devuelve el texto que alcanzó a decir. */
  cancel(): string;
  readonly speaking: boolean;
  onIdle?: () => void;
  onStart?: () => void;
}
