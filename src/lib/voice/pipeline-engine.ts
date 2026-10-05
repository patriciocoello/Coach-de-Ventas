"use client";

import { BrowserTranscription } from "./browser-stt";
import { BrowserVoice, SentenceChunker, waitForVoices } from "./browser-tts";
import type {
  CallState,
  ConversationEngine,
  ConversationEvents,
  LiveTurn,
  TranscriptionProvider,
  VoiceOptions,
  VoiceProvider,
} from "./types";

// Motor de conversación "pipeline": STT del navegador → servidor (LLM en
// streaming, NDJSON) → TTS por frases. Soporta:
//  - fin de turno por silencio (endpointing)
//  - barge-in: si el vendedor habla, el cliente se calla
//  - el cliente interrumpe si el vendedor hace un monólogo
//  - silencios largos del vendedor
//  - el cliente cuelga

export interface PipelineOptions {
  simulationId: string;
  voice: VoiceOptions;
  events: ConversationEvents;
  transcription?: TranscriptionProvider;
  voiceProvider?: VoiceProvider;
  endpointMs?: number;
  silenceMs?: number;
  maxDurationMs?: number;
  ring?: boolean;
}

type StreamEvent =
  | { type: "seller"; seq: number }
  | { type: "text"; text: string }
  | { type: "done"; seq: number; text: string; hangup: boolean }
  | { type: "error"; message: string };

const words = (s: string) => s.split(/\s+/).filter(Boolean);
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zñ0-9\s]/g, " ");

export class PipelineConversationEngine implements ConversationEngine {
  private stt: TranscriptionProvider;
  private tts: VoiceProvider;
  private state: CallState = "idle";
  private turns: LiveTurn[] = [];
  private startedAt = 0;
  private pendingFinal = "";
  private interim = "";
  private sellerStartedAt: number | null = null;
  private endpointTimer: ReturnType<typeof setTimeout> | null = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private limitTimer: ReturnType<typeof setTimeout> | null = null;
  private muted = false;
  private inFlight = false;
  private sellerSpokeWhileThinking = false;
  private reply: { key: string; seq: number | null; text: string; started: boolean } | null = null;
  private pendingInterruption: { seq: number; spokenText: string } | null = null;
  /** Respuesta interrumpida antes de conocer su seq (aún en streaming). */
  private interruptedReply: { key: string; spokenText: string } | null = null;
  private interruptAfterWords: number | null = null;
  private silenceCount = 0;
  private hangupPending = false;
  private stopped = false;
  private audio: AudioContext | null = null;
  private keyCounter = 0;

  constructor(private opts: PipelineOptions) {
    this.stt = opts.transcription ?? new BrowserTranscription("es-MX");
    this.tts = opts.voiceProvider ?? new BrowserVoice();
  }

  get elapsedMs() {
    return this.startedAt ? Date.now() - this.startedAt : 0;
  }

  get voiceName(): string | null {
    return (this.tts as BrowserVoice).voiceName ?? null;
  }

  get sttSupported() {
    return this.stt.isSupported();
  }

  async start() {
    this.setState("connecting");
    if (!this.tts.isSupported()) {
      this.fail("Este navegador no soporta síntesis de voz. Usa Chrome o Edge en computadora.", true);
      return;
    }
    try {
      this.audio = new AudioContext();
    } catch {
      this.audio = null;
    }
    await waitForVoices();
    this.tts.configure(this.opts.voice);
    this.tts.onStart = () => {
      if (this.reply) this.reply.started = true;
      if (!this.stopped) this.setState("customer_speaking");
    };
    this.tts.onIdle = () => {
      if (!this.inFlight) this.onCustomerDone();
    };

    const res = await fetch(`/api/simulations/${this.opts.simulationId}/start`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.fail(data.error ?? "No se pudo iniciar la llamada.", true);
      return;
    }
    this.interruptAfterWords = data.config?.interruptAfterWords ?? null;

    if (this.opts.ring !== false) {
      this.setState("ringing");
      await this.playRing();
    }
    if (this.stopped) return;

    const resumedTurns = (data.turns ?? []) as { seq: number; speaker: "seller" | "customer"; text: string; t_offset_ms: number }[];
    const elapsed = Number(data.elapsedMs) || 0;
    this.startedAt = Date.now() - elapsed;
    const maxMs = this.opts.maxDurationMs ?? 30 * 60 * 1000;
    this.limitTimer = setTimeout(() => this.remoteEnd("time_limit"), Math.max(1000, maxMs - elapsed));

    if (resumedTurns.length) {
      // Se recargó la página a mitad de llamada: retoma la transcripción.
      this.turns = resumedTurns.map((t) => ({ key: this.newKey(), seq: t.seq, speaker: t.speaker, text: t.text, tOffsetMs: t.t_offset_ms }));
      this.opts.events.onTranscript(this.turns);
      this.setState("listening");
      this.armSilence();
    } else {
      const greeting = data.greeting as { seq: number; text: string };
      const key = this.newKey();
      this.reply = { key, seq: greeting.seq, text: greeting.text, started: false };
      this.pushTurn({ key, seq: greeting.seq, speaker: "customer", text: greeting.text, tOffsetMs: 0 });
      this.tts.enqueue(greeting.text);
    }

    if (this.stt.isSupported()) {
      this.stt.start({
        onInterim: (t) => this.onSpeech(t, false),
        onFinal: (t) => this.onSpeech(t, true),
        onError: (msg, fatal) => this.opts.events.onError(msg, fatal),
      });
    } else {
      this.opts.events.onError("Este navegador no soporta reconocimiento de voz. Usa Chrome o Edge, o escribe tus respuestas.", false);
    }
  }

  stop() {
    this.stopped = true;
    this.clearTimers();
    this.stt.stop();
    let interruption = this.pendingInterruption;
    if (this.reply && this.reply.seq != null && this.tts.speaking) {
      const spoken = this.tts.cancel();
      interruption = { seq: this.reply.seq, spokenText: spoken };
    } else {
      this.tts.cancel();
    }
    this.audio?.close().catch(() => {});
    this.setState("ended");
    return { interruption };
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stt.pause();
      this.interim = "";
      this.opts.events.onInterim(this.pendingFinal);
    } else {
      this.stt.resume();
    }
  }

  sendText(text: string) {
    const clean = text.trim();
    if (!clean || this.stopped) return;
    if (this.state === "customer_speaking") this.bargeIn();
    this.pendingFinal = `${this.pendingFinal} ${clean}`.trim();
    this.interim = "";
    this.sellerStartedAt ??= this.elapsedMs;
    this.commit();
  }

  // ------------------------------------------------------------------------
  private onSpeech(text: string, isFinal: boolean) {
    if (this.muted || this.stopped || !this.startedAt) return;
    const clean = text.trim();

    if (this.state === "customer_speaking" || (this.reply?.started && this.tts.speaking)) {
      // Ignora el eco del altavoz y ruidos cortos mientras habla el cliente.
      if (!clean || this.isEcho(clean) || words(clean).length < 2) return;
      this.bargeIn();
    }

    if (isFinal) {
      this.pendingFinal = `${this.pendingFinal} ${clean}`.trim();
      this.interim = "";
    } else {
      this.interim = clean;
    }
    const current = `${this.pendingFinal} ${this.interim}`.trim();
    if (!current) return;

    this.sellerStartedAt ??= this.elapsedMs;
    this.silenceCount = 0;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.inFlight) this.sellerSpokeWhileThinking = true;
    else this.setState("seller_speaking");
    this.opts.events.onInterim(current);

    if (this.endpointTimer) clearTimeout(this.endpointTimer);
    this.endpointTimer = setTimeout(() => this.commit(), this.opts.endpointMs ?? 1300);

    if (
      this.interruptAfterWords &&
      !this.inFlight &&
      words(current).length > this.interruptAfterWords
    ) {
      this.commit({ customerInterrupts: true });
    }
  }

  private isEcho(text: string) {
    const reply = this.reply?.text;
    if (!reply) return false;
    const replyWords = new Set(words(norm(reply)));
    const w = words(norm(text));
    if (!w.length) return true;
    const hits = w.filter((x) => replyWords.has(x)).length;
    return hits / w.length >= 0.6;
  }

  private bargeIn() {
    const spoken = this.tts.cancel();
    if (this.reply) {
      const { key, seq } = this.reply;
      if (seq != null) this.pendingInterruption = { seq, spokenText: spoken };
      else this.interruptedReply = { key, spokenText: spoken };
      if (spoken) this.updateTurn(key, { text: spoken, interrupted: true, pending: false });
      else this.removeTurn(key);
    }
    this.reply = null;
    this.setState("seller_speaking");
  }

  private commit(extra: { customerInterrupts?: boolean } = {}) {
    if (this.endpointTimer) clearTimeout(this.endpointTimer);
    this.endpointTimer = null;
    const text = `${this.pendingFinal} ${this.interim}`.trim();
    if (!text || this.stopped) return;
    if (this.inFlight) return; // se enviará al terminar la respuesta actual
    this.pendingFinal = "";
    this.interim = "";
    this.opts.events.onInterim("");
    const tOffsetMs = this.sellerStartedAt ?? this.elapsedMs;
    this.sellerStartedAt = null;
    const key = this.newKey();
    this.pushTurn({ key, speaker: "seller", text, tOffsetMs, pending: true });
    void this.sendTurn({ event: "turn", sellerText: text, tOffsetMs, customerInterrupts: extra.customerInterrupts }, key);
  }

  private async sendTurn(
    body: { event: "turn" | "silence"; sellerText?: string; tOffsetMs: number; customerInterrupts?: boolean },
    sellerKey?: string,
  ) {
    this.inFlight = true;
    this.sellerSpokeWhileThinking = false;
    this.setState("thinking");
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    const interruption = this.pendingInterruption;
    this.pendingInterruption = null;

    const key = this.newKey();
    this.reply = { key, seq: null, text: "", started: false };
    const chunker = new SentenceChunker();
    let shown = false;
    let failed = false;

    try {
      const res = await fetch(`/api/simulations/${this.opts.simulationId}/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, interruption }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "El cliente no pudo responder.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line) as StreamEvent;
          if (this.stopped) continue;
          if (ev.type === "seller" && sellerKey) {
            this.updateTurn(sellerKey, { seq: ev.seq, pending: false });
          } else if (ev.type === "text") {
            if (!this.reply || this.reply.key !== key) continue;
            this.reply.text += ev.text;
            if (this.sellerSpokeWhileThinking) continue; // el vendedor siguió hablando: no contestamos encima
            if (!shown) {
              this.pushTurn({ key, speaker: "customer", text: this.reply.text, tOffsetMs: this.elapsedMs, pending: true });
              shown = true;
            } else {
              this.updateTurn(key, { text: this.reply.text });
            }
            for (const s of chunker.push(ev.text)) this.tts.enqueue(s);
          } else if (ev.type === "done") {
            if (this.interruptedReply?.key === key) {
              this.pendingInterruption = { seq: ev.seq, spokenText: this.interruptedReply.spokenText };
              this.interruptedReply = null;
              this.updateTurn(key, { seq: ev.seq });
              continue;
            }
            if (this.reply?.key === key) {
              this.reply.seq = ev.seq;
              this.reply.text = ev.text;
            }
            this.hangupPending = ev.hangup;
            if (!this.sellerSpokeWhileThinking) {
              if (!shown) this.pushTurn({ key, seq: ev.seq, speaker: "customer", text: ev.text, tOffsetMs: this.elapsedMs });
              else this.updateTurn(key, { seq: ev.seq, text: ev.text, pending: false });
              for (const s of chunker.flush()) this.tts.enqueue(s);
            }
          } else if (ev.type === "error") {
            throw new Error(ev.message);
          }
        }
      }
    } catch (err) {
      failed = true;
      this.opts.events.onError(err instanceof Error ? err.message : "Error de conexión con el cliente.", false);
      if (sellerKey) this.updateTurn(sellerKey, { pending: false });
      this.removeTurn(key);
      this.reply = null;
    } finally {
      this.inFlight = false;
    }
    if (this.stopped) return;

    if (this.sellerSpokeWhileThinking) {
      // Si el cliente no alcanzó a hablar, se descarta su respuesta y se manda lo nuevo del vendedor.
      if (this.reply?.key === key) {
        if (this.reply.seq != null) this.pendingInterruption = { seq: this.reply.seq, spokenText: "" };
        this.removeTurn(key);
      }
      this.reply = null;
      this.sellerSpokeWhileThinking = false;
      this.setState("seller_speaking");
      if (this.endpointTimer) clearTimeout(this.endpointTimer);
      this.endpointTimer = setTimeout(() => this.commit(), 400);
      return;
    }
    if (failed || !this.tts.speaking) this.onCustomerDone();
  }

  private onCustomerDone() {
    if (this.stopped || this.inFlight) return;
    if (this.hangupPending) {
      this.hangupPending = false;
      this.remoteEnd("hangup");
      return;
    }
    if (this.pendingFinal || this.interim) {
      this.setState("seller_speaking");
      return;
    }
    this.setState("listening");
    this.armSilence();
  }

  private armSilence() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => {
      if (this.stopped || this.inFlight || this.state !== "listening" || this.muted) return;
      if (this.silenceCount >= 2) return;
      this.silenceCount += 1;
      void this.sendTurn({ event: "silence", tOffsetMs: this.elapsedMs });
    }, this.opts.silenceMs ?? 10000);
  }

  private remoteEnd(reason: "hangup" | "time_limit") {
    if (this.stopped) return;
    this.opts.events.onRemoteEnd(reason);
  }

  private fail(message: string, fatal: boolean) {
    this.setState(fatal ? "error" : this.state);
    this.opts.events.onError(message, fatal);
  }

  private clearTimers() {
    for (const t of [this.endpointTimer, this.silenceTimer, this.limitTimer]) if (t) clearTimeout(t);
  }

  private setState(s: CallState) {
    if (this.state === s) return;
    if (this.state === "ended" && s !== "ended") return;
    this.state = s;
    this.opts.events.onState(s);
  }

  private newKey() {
    this.keyCounter += 1;
    return `t${this.keyCounter}`;
  }

  private pushTurn(t: LiveTurn) {
    this.turns = [...this.turns, t];
    this.opts.events.onTranscript(this.turns);
  }

  private updateTurn(key: string, patch: Partial<LiveTurn>) {
    this.turns = this.turns.map((t) => (t.key === key ? { ...t, ...patch } : t));
    this.opts.events.onTranscript(this.turns);
  }

  private removeTurn(key: string) {
    this.turns = this.turns.filter((t) => t.key !== key);
    this.opts.events.onTranscript(this.turns);
  }

  // Tono de llamada (dos timbres) con Web Audio.
  private async playRing() {
    const ctx = this.audio;
    if (!ctx) return new Promise<void>((r) => setTimeout(r, 1500));
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});
    const ringOnce = (at: number) => {
      for (const f of [440, 480]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.05, at + 0.05);
        gain.gain.setValueAtTime(0.05, at + 1.1);
        gain.gain.linearRampToValueAtTime(0, at + 1.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(at);
        osc.stop(at + 1.25);
      }
    };
    const t0 = ctx.currentTime + 0.1;
    ringOnce(t0);
    ringOnce(t0 + 2.2);
    await new Promise((r) => setTimeout(r, 3600 + Math.random() * 800));
  }
}
