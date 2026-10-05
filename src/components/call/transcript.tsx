"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";
import type { LiveTurn } from "@/lib/voice/types";

function ts(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function LiveTranscript({ turns, interim, customerName }: { turns: LiveTurn[]; interim: string; customerName: string }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, interim]);

  return (
    <div className="space-y-4">
      {turns.length === 0 && !interim && <p className="text-sm text-white/40">La transcripción aparecerá aquí.</p>}
      {turns.map((t) => (
        <div key={t.key} className={clsx("flex flex-col", t.speaker === "seller" ? "items-end" : "items-start")}>
          <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-white/40">
            {t.speaker === "seller" ? "Tú" : customerName} · {ts(t.tOffsetMs)}
          </div>
          <div
            className={clsx(
              "max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              t.speaker === "seller" ? "rounded-br-sm bg-white text-black" : "rounded-bl-sm bg-white/10 text-white",
              t.pending && "opacity-70",
            )}
          >
            {t.text}
            {t.interrupted && <span className="ml-1 text-xs opacity-60">— (interrumpido)</span>}
          </div>
        </div>
      ))}
      {interim && (
        <div className="flex flex-col items-end">
          <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-white/40">Tú · hablando</div>
          <div className="max-w-[90%] rounded-2xl rounded-br-sm border border-dashed border-white/40 px-4 py-2.5 text-sm italic text-white/80">
            {interim}
          </div>
        </div>
      )}
      <div ref={end} />
    </div>
  );
}
