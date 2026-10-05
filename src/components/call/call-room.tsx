"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui";
import type { PrepBrief, VoiceHint } from "@/lib/types";
import { BrowserVoice, pickVoice, spanishVoices, waitForVoices } from "@/lib/voice/browser-tts";
import { PipelineConversationEngine } from "@/lib/voice/pipeline-engine";
import type { CallState, LiveTurn } from "@/lib/voice/types";
import { LiveTranscript } from "./transcript";
import { useMicLevel } from "./use-mic-level";
import { Waveform } from "./waveform";

interface Props {
  simulationId: string;
  customerName: string;
  customerLabel: string;
  difficultyName: string;
  prepBrief: PrepBrief | null;
  voiceHint: VoiceHint;
  resuming: boolean;
}

const STATE_LABEL: Record<CallState, string> = {
  idle: "Listo para llamar",
  connecting: "Conectando…",
  ringing: "Llamando…",
  listening: "Escuchando…",
  seller_speaking: "Estás hablando…",
  thinking: "Cliente pensando…",
  customer_speaking: "Cliente hablando…",
  ended: "Llamada terminada",
  error: "Error",
};

const VOICE_KEY = "mf.voiceURI";

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function CallRoom(props: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"prep" | "call" | "ending">("prep");
  const [state, setState] = useState<CallState>("idle");
  const [turns, setTurns] = useState<LiveTurn[]>([]);
  const [interim, setInterim] = useState("");
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [draft, setDraft] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [support, setSupport] = useState<{ stt: boolean; tts: boolean } | null>(null);
  const [micTest, setMicTest] = useState(false);
  const engineRef = useRef<PipelineConversationEngine | null>(null);
  const endingRef = useRef(false);

  const mic = useMicLevel(micTest || phase === "call");

  useEffect(() => {
    waitForVoices().then(() => {
      const w = window as unknown as Record<string, unknown>;
      setSupport({ stt: Boolean(w.SpeechRecognition || w.webkitSpeechRecognition), tts: "speechSynthesis" in window });
      const list = spanishVoices();
      setVoices(list);
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(`${VOICE_KEY}.${props.voiceHint.gender}`);
      } catch {}
      const v = pickVoice(props.voiceHint.gender, saved);
      setVoiceURI(v?.voiceURI ?? "");
    });
  }, [props.voiceHint.gender]);

  // Cronómetro
  useEffect(() => {
    if (phase !== "call") return;
    const t = setInterval(() => setElapsed(engineRef.current?.elapsedMs ?? 0), 250);
    return () => clearInterval(t);
  }, [phase]);

  // Aviso al salir con la llamada activa
  useEffect(() => {
    if (phase !== "call") return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [phase]);

  const endCall = useCallback(
    async (reason?: string) => {
      if (endingRef.current) return;
      endingRef.current = true;
      const engine = engineRef.current;
      const durationSeconds = Math.round((engine?.elapsedMs ?? 0) / 1000);
      const { interruption } = engine?.stop() ?? { interruption: null };
      setPhase("ending");
      if (reason) setNotice(reason);
      try {
        await fetch(`/api/simulations/${props.simulationId}/end`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ durationSeconds, interruption }),
        });
      } finally {
        router.replace(`/simulaciones/${props.simulationId}`);
      }
    },
    [props.simulationId, router],
  );

  async function startCall() {
    setError(null);
    setMicTest(false);
    setPhase("call");
    try {
      if (voiceURI) localStorage.setItem(`${VOICE_KEY}.${props.voiceHint.gender}`, voiceURI);
    } catch {}
    const engine = new PipelineConversationEngine({
      simulationId: props.simulationId,
      voice: { ...props.voiceHint, voiceURI },
      ring: !props.resuming,
      events: {
        onState: setState,
        onTranscript: setTurns,
        onInterim: setInterim,
        onError: (msg, fatal) => {
          setError(msg);
          if (fatal) setPhase("prep");
        },
        onRemoteEnd: (reason) => {
          const msg = reason === "hangup" ? `${props.customerName.split(" ")[0]} colgó la llamada.` : "Se alcanzó el tiempo máximo de la llamada.";
          setTimeout(() => endCall(msg), 1200);
          setNotice(msg);
        },
      },
    });
    engineRef.current = engine;
    if (!engine.sttSupported) setShowKeyboard(true);
    await engine.start();
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    engineRef.current?.setMuted(next);
  }

  function sendDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    engineRef.current?.sendText(draft);
    setDraft("");
  }

  function testVoice() {
    const v = new BrowserVoice();
    v.configure({ ...props.voiceHint, voiceURI });
    v.enqueue("Hola, ¿bueno? Sí, soy yo. ¿Quién habla?");
  }

  const waveMode =
    state === "customer_speaking" ? "customer" : state === "seller_speaking" ? "seller" : state === "thinking" ? "thinking" : state === "listening" ? "seller" : "idle";
  const initials = props.customerName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  // ------------------------------------------------------------------ PREP
  if (phase === "prep") {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-center justify-between">
            <Logo className="text-white" />
            <button onClick={() => router.push("/")} className="text-sm text-white/50 hover:text-white">
              Salir
            </button>
          </div>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="eyebrow text-white/40">Paso A · Preparación</div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">{props.customerLabel}</h1>
              <p className="mt-2 text-white/50">Dificultad: {props.difficultyName}</p>

              {props.prepBrief ? (
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="eyebrow text-white/40">Lo que sabes antes de marcar</div>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Info label="Nombre" value={props.prepBrief.name} />
                    <Info label="De dónde llegó" value={props.prepBrief.source} />
                    {props.prepBrief.customerType && <Info label="Tipo de cliente" value={props.prepBrief.customerType} />}
                    {props.prepBrief.city && <Info label="Ciudad" value={props.prepBrief.city} />}
                    {props.prepBrief.productMentioned && <Info label="Producto que mencionó" value={props.prepBrief.productMentioned} />}
                  </dl>
                  {props.prepBrief.message && (
                    <div className="mt-5">
                      <div className="text-xs text-white/40">Mensaje que mandó</div>
                      <div className="mt-2 inline-block rounded-2xl rounded-bl-sm bg-white/10 px-4 py-2.5 text-sm">“{props.prepBrief.message}”</div>
                    </div>
                  )}
                  <div className="mt-5 border-t border-white/10 pt-4 text-sm text-white/60">
                    <span className="text-white/40">Objetivo de la llamada: </span>
                    {props.prepBrief.callObjective}
                  </div>
                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
                  <div className="eyebrow text-white/40">Llamada en frío</div>
                  <p className="mt-3">Sólo sabes su nombre. Todo lo demás lo tienes que descubrir.</p>
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-white/10 p-5 text-sm text-white/60">
                <div className="font-medium text-white">Recuerda la regla principal</div>
                Primero preguntar, después recomendar y finalmente cerrar. Mínimo 5 a 7 preguntas antes de hablar de producto.
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="eyebrow text-white/40">Antes de empezar</div>
                <ul className="mt-4 space-y-3 text-sm">
                  <Check ok={support?.stt} label="Reconocimiento de voz" fail="No disponible: usa Chrome o Edge (podrás escribir)" />
                  <Check ok={support?.tts} label="Voz del cliente" fail="No disponible en este navegador" />
                  <Check ok={mic.ready ? true : mic.error ? false : undefined} label="Micrófono" fail={mic.error ?? ""} />
                </ul>
                <div className="mt-4 flex items-center gap-3">
                  <button onClick={() => setMicTest((m) => !m)} className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:border-white">
                    {micTest ? "Detener prueba" : "Probar micrófono"}
                  </button>
                  {micTest && (
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-sky-300 transition-[width] duration-75" style={{ width: `${Math.round(mic.level * 100)}%` }} />
                    </div>
                  )}
                </div>
                <div className="mt-5">
                  <label className="text-xs text-white/40">Voz del cliente</label>
                  <div className="mt-1.5 flex gap-2">
                    <select
                      value={voiceURI}
                      onChange={(e) => setVoiceURI(e.target.value)}
                      className="h-9 flex-1 rounded-xl border border-white/15 bg-black px-2 text-sm"
                    >
                      {voices.length === 0 && <option value="">Voz predeterminada</option>}
                      {voices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                    <button onClick={testVoice} className="rounded-xl border border-white/20 px-3 text-xs hover:border-white">
                      Probar
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-white/40">Tip: en Microsoft Edge las voces “Natural” de México (Dalia, Jorge) suenan mucho más reales.</p>
                </div>
                <p className="mt-4 text-xs text-white/40">Usa audífonos para que el micrófono no capte la voz del cliente.</p>
              </div>
              {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
              <button
                onClick={startCall}
                className="group relative flex h-20 w-full items-center justify-center gap-3 rounded-full bg-emerald-500 text-lg font-semibold text-black transition hover:bg-emerald-400"
              >
                <PhoneIcon /> {props.resuming ? "Reanudar llamada" : "Iniciar llamada"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ CALL
  return (
    <div className="flex min-h-screen flex-col bg-[#0b0b0b] text-white lg:h-screen lg:flex-row">
      <section className="flex flex-1 flex-col items-center justify-between px-6 py-8">
        <div className="text-center">
          <div className="eyebrow text-white/40">Cliente</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{props.customerLabel}</div>
          <div className="mt-1 text-sm text-white/50">Dificultad: {props.difficultyName}</div>
          <div className="mt-4 font-mono text-4xl tabular-nums tracking-tight">{fmt(elapsed)}</div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative flex h-40 w-40 items-center justify-center">
            {(state === "customer_speaking" || state === "ringing") && (
              <span className="pulse-ring absolute inset-0 rounded-full border-2 border-sky-300/60" />
            )}
            <div
              className={clsx(
                "flex h-32 w-32 items-center justify-center rounded-full text-4xl font-semibold transition-colors",
                state === "customer_speaking" ? "bg-sky-300 text-black" : "bg-white/10 text-white",
              )}
            >
              {initials}
            </div>
          </div>
          <div className="mt-6 h-16">
            <Waveform mode={muted ? "idle" : waveMode} level={waveMode === "seller" ? mic.level : 0} />
          </div>
          <div
            className={clsx(
              "mt-3 rounded-full px-4 py-1.5 text-sm",
              state === "customer_speaking" && "bg-sky-300/15 text-sky-200",
              state === "thinking" && "bg-white/10 text-white/70",
              (state === "listening" || state === "seller_speaking") && "bg-emerald-400/15 text-emerald-200",
              (state === "connecting" || state === "ringing" || state === "ended") && "bg-white/10 text-white/70",
            )}
            aria-live="polite"
          >
            {muted ? "Micrófono silenciado" : STATE_LABEL[state]}
          </div>
          {notice && <div className="mt-4 text-sm text-amber-200">{notice}</div>}
          {error && phase === "call" && (
            <button onClick={() => setError(null)} className="mt-4 max-w-md rounded-xl bg-red-500/10 px-4 py-2 text-left text-sm text-red-200">
              {error} <span className="opacity-60">(cerrar)</span>
            </button>
          )}
        </div>

        <div className="w-full max-w-md">
          {showKeyboard && (
            <form onSubmit={sendDraft} className="mb-5 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escribe lo que dirías…"
                className="h-11 flex-1 rounded-full border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-white/50"
                disabled={phase !== "call"}
              />
              <button className="h-11 rounded-full bg-white px-4 text-sm font-medium text-black" disabled={phase !== "call"}>
                Enviar
              </button>
            </form>
          )}
          <div className="flex items-center justify-center gap-5">
            <RoundButton label={muted ? "Activar" : "Silenciar"} onClick={toggleMute} active={muted} disabled={phase !== "call"}>
              <MicIcon off={muted} />
            </RoundButton>
            <button
              onClick={() => endCall()}
              disabled={phase !== "call"}
              className="flex h-16 items-center gap-2 rounded-full bg-red-500 px-7 font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              <PhoneIcon down /> {phase === "ending" ? "Terminando…" : "Terminar llamada"}
            </button>
            <RoundButton label="Teclado" onClick={() => setShowKeyboard((s) => !s)} active={showKeyboard} disabled={phase !== "call"}>
              <KeyboardIcon />
            </RoundButton>
          </div>
        </div>
      </section>

      <aside className="flex max-h-[45vh] flex-col border-t border-white/10 lg:max-h-none lg:w-[420px] lg:border-l lg:border-t-0">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="eyebrow text-white/40">Transcripción</div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <LiveTranscript turns={turns} interim={interim} customerName={props.customerName.split(" ")[0]} />
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-white/40">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function Check({ ok, label, fail }: { ok: boolean | undefined; label: string; fail: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className={clsx("mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]", ok === undefined ? "bg-white/15" : ok ? "bg-emerald-400 text-black" : "bg-red-400 text-black")}>
        {ok === undefined ? "" : ok ? "✓" : "✕"}
      </span>
      <span>
        {label}
        {ok === false && fail && <span className="block text-xs text-white/40">{fail}</span>}
      </span>
    </li>
  );
}

function RoundButton({ children, label, onClick, active, disabled }: { children: React.ReactNode; label: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex flex-col items-center gap-1.5 text-xs text-white/60 disabled:opacity-40">
      <span className={clsx("flex h-14 w-14 items-center justify-center rounded-full transition", active ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20")}>
        {children}
      </span>
      {label}
    </button>
  );
}

function PhoneIcon({ down }: { down?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden style={down ? { transform: "rotate(135deg)" } : undefined}>
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
    </svg>
  );
}

function MicIcon({ off }: { off?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
    </svg>
  );
}
