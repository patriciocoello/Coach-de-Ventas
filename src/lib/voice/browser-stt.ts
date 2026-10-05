"use client";

import type { TranscriptionCallbacks, TranscriptionProvider } from "./types";

// Reconocimiento de voz gratuito del navegador (Web Speech API).
// Funciona mejor en Chrome y Edge de escritorio.

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export class BrowserTranscription implements TranscriptionProvider {
  readonly name = "browser";
  private rec: SpeechRecognitionLike | null = null;
  private cb: TranscriptionCallbacks | null = null;
  private active = false;
  private paused = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;

  constructor(private lang = "es-MX") {}

  isSupported() {
    return getCtor() !== null;
  }

  start(cb: TranscriptionCallbacks) {
    this.cb = cb;
    this.active = true;
    this.paused = false;
    this.launch();
  }

  pause() {
    this.paused = true;
    this.rec?.abort();
  }

  resume() {
    if (!this.active) return;
    this.paused = false;
    this.launch();
  }

  stop() {
    this.active = false;
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.rec?.abort();
    this.rec = null;
  }

  private launch() {
    const Ctor = getCtor();
    if (!Ctor || !this.cb) return;
    this.rec?.abort();
    const rec = new Ctor();
    rec.lang = this.lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      this.failures = 0;
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0]?.transcript ?? "";
        if (r.isFinal) {
          if (text.trim()) this.cb?.onFinal(text.trim());
        } else {
          interim += text;
        }
      }
      this.cb?.onInterim(interim.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        this.active = false;
        this.cb?.onError("Permiso de micrófono denegado. Habilítalo en el navegador.", true);
        return;
      }
      this.failures += 1;
      if (this.failures > 5) {
        this.cb?.onError(`El reconocimiento de voz falló (${e.error}). Puedes seguir escribiendo.`, false);
      }
    };
    // Chrome corta el reconocimiento continuo cada cierto tiempo: lo reiniciamos.
    rec.onend = () => {
      if (rec !== this.rec) return;
      if (this.active && !this.paused) {
        this.restartTimer = setTimeout(() => this.launch(), this.failures > 0 ? 400 : 50);
      }
    };
    this.rec = rec;
    try {
      rec.start();
    } catch {
      // start() lanza si ya estaba corriendo; onend lo reintentará.
    }
  }
}
