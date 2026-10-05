"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActionResult } from "@/app/(app)/admin/actions";

// Ejecuta una server action con estado de carga, mensaje y refresh.
export function useAction() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
  async function exec<T>(fn: () => Promise<ActionResult<T>>, okText = "Guardado.") {
    setPending(true);
    setMessage(null);
    const res = await fn();
    setPending(false);
    if (res.ok) {
      setMessage({ tone: "good", text: okText });
      router.refresh();
    } else {
      setMessage({ tone: "bad", text: res.error });
    }
    return res;
  }
  return { pending, message, setMessage, exec };
}
