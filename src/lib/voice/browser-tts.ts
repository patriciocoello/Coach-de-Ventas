"use client";

import type { VoiceOptions, VoiceProvider } from "./types";

// Voz gratuita del navegador (speechSynthesis). En Edge las voces "Online
// (Natural)" en español de México (Dalia, Jorge) suenan muy naturales.

const FEMALE_HINTS = /dalia|sabina|paulina|helena|laura|elvira|mónica|monica|lupe|renata|camila|francisca|paloma|marisol|female|mujer|larissa|beatriz/i;
const MALE_HINTS = /jorge|raul|raúl|pablo|gerardo|álvaro|alvaro|diego|juan|carlos|enrique|tomás|tomas|male|hombre|andrés|andres/i;

export function spanishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("es"));
}

function scoreVoice(v: SpeechSynthesisVoice, gender: "female" | "male") {
  let s = 0;
  const lang = v.lang.toLowerCase();
  if (lang === "es-mx") s += 50;
  else if (lang === "es-us" || lang === "es-419") s += 30;
  else if (lang.startsWith("es")) s += 10;
  if (/natural|online|neural/i.test(v.name)) s += 40;
  if (/google/i.test(v.name)) s += 15;
  if (gender === "female" ? FEMALE_HINTS.test(v.name) : MALE_HINTS.test(v.name)) s += 25;
  if (gender === "female" ? MALE_HINTS.test(v.name) : FEMALE_HINTS.test(v.name)) s -= 30;
  return s;
}

export function pickVoice(gender: "female" | "male", preferredURI?: string | null): SpeechSynthesisVoice | null {
  const voices = spanishVoices();
  if (preferredURI) {
    const found = voices.find((v) => v.voiceURI === preferredURI);
    if (found) return found;
  }
  return voices.sort((a, b) => scoreVoice(b, gender) - scoreVoice(a, gender))[0] ?? null;
}

export function waitForVoices(timeoutMs = 1500): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    if (window.speechSynthesis.getVoices().length) return resolve();
    const t = setTimeout(resolve, timeoutMs);
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });
}

export class BrowserVoice implements VoiceProvider {
  readonly name = "browser";
  private opts: VoiceOptions = { gender: "female", rate: 1, pitch: 1 };
  private voice: SpeechSynthesisVoice | null = null;
  private queue: string[] = [];
  private current: string | null = null;
  private spokenSoFar: string[] = [];
  private generation = 0;
  onIdle?: () => void;
  onStart?: () => void;

  isSupported() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  configure(opts: VoiceOptions) {
    this.opts = opts;
    this.voice = pickVoice(opts.gender, opts.voiceURI);
  }

  get speaking() {
    return this.current !== null || this.queue.length > 0;
  }

  get voiceName() {
    return this.voice?.name ?? null;
  }

  enqueue(text: string) {
    const clean = text.trim();
    if (!clean) return;
    if (!this.speaking) this.spokenSoFar = [];
    this.queue.push(clean);
    if (!this.current) this.next();
  }

  cancel(): string {
    this.generation += 1;
    const spoken = [...this.spokenSoFar, this.current ?? ""].join(" ").trim();
    this.queue = [];
    this.current = null;
    this.spokenSoFar = [];
    if (this.isSupported()) window.speechSynthesis.cancel();
    return spoken;
  }

  private next() {
    const text = this.queue.shift();
    if (text === undefined) {
      this.current = null;
        this.onIdle?.();
      return;
    }
    const gen = this.generation;
    const wasIdle = this.current === null && this.spokenSoFar.length === 0;
    this.current = text;
    const u = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      u.voice = this.voice;
      u.lang = this.voice.lang;
    } else {
      u.lang = "es-MX";
    }
    u.rate = this.opts.rate;
    u.pitch = this.opts.pitch;
    const done = () => {
      if (gen !== this.generation) return;
      if (this.current) this.spokenSoFar.push(this.current);
      this.current = null;
      this.next();
    };
    u.onend = done;
    u.onerror = done;
    if (wasIdle) this.onStart?.();
    try {
      window.speechSynthesis.speak(u);
    } catch {
      // Si la síntesis falla, sigue con la siguiente frase (el texto ya está en pantalla).
      setTimeout(done, 0);
    }
  }
}

// Divide texto en streaming en frases completas para empezar a hablar antes.
export class SentenceChunker {
  private buf = "";

  push(text: string): string[] {
    this.buf += text;
    const out: string[] = [];
    const re = /[^.!?…]*[.!?…]+["'”)]?\s+/g;
    let consumed = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(this.buf))) {
      out.push(m[0].trim());
      consumed = re.lastIndex;
    }
    this.buf = this.buf.slice(consumed);
    // Frases muy largas sin puntuación: corta en una coma para no esperar.
    if (this.buf.length > 140) {
      const comma = this.buf.lastIndexOf(", ");
      if (comma > 40) {
        out.push(this.buf.slice(0, comma + 1).trim());
        this.buf = this.buf.slice(comma + 2);
      }
    }
    return out.filter(Boolean);
  }

  flush(): string[] {
    const rest = this.buf.trim();
    this.buf = "";
    return rest ? [rest] : [];
  }
}
