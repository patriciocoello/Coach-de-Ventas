"use client";

import clsx from "clsx";

const BARS = 28;

// Onda: refleja el micrófono cuando habla el vendedor y se anima cuando habla el cliente.
export function Waveform({ mode, level }: { mode: "seller" | "customer" | "idle" | "thinking"; level: number }) {
  return (
    <div className="flex h-16 items-center justify-center gap-[3px]" aria-hidden>
      {Array.from({ length: BARS }).map((_, i) => {
        const center = 1 - Math.abs(i - BARS / 2) / (BARS / 2);
        const sellerH = 6 + level * 56 * (0.4 + center * 0.6) * (0.7 + ((i * 37) % 10) / 30);
        return (
          <span
            key={i}
            className={clsx(
              "w-[3px] rounded-full transition-[height] duration-75",
              mode === "customer" && "wave-bar bg-sky-300",
              mode === "seller" && "bg-white",
              mode === "thinking" && "bg-white/30",
              mode === "idle" && "bg-white/20",
            )}
            style={
              mode === "customer"
                ? { height: `${20 + center * 40}px`, animationDelay: `${(i % 7) * 0.09}s`, animationDuration: `${0.7 + (i % 5) * 0.12}s` }
                : mode === "seller"
                  ? { height: `${sellerH}px` }
                  : { height: mode === "thinking" ? `${6 + center * 8}px` : "4px" }
            }
          />
        );
      })}
    </div>
  );
}
