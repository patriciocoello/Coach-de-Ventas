"use client";

import type { ConversationEngine, ConversationEvents } from "./types";

// Punto de extensión para voz en tiempo real (speech-to-speech).
//
// Para conectar OpenAI Realtime, Gemini Live u otro proveedor:
//  1. Crea una ruta en el servidor (p. ej. /api/simulations/[id]/realtime-session)
//     que arme el mismo system prompt del cliente (buildCustomerSystemPrompt) y
//     pida al proveedor un token efímero. La API key nunca sale del servidor.
//  2. Implementa ConversationEngine aquí: conecta por WebRTC/WebSocket con el
//     token, envía el audio del micrófono y reproduce el audio del cliente.
//  3. Reporta cada transcripción al servidor (los proveedores realtime entregan
//     la transcripción de ambos lados) para que se guarde en simulation_turns
//     y la evaluación funcione igual.
//  4. Devuelve este engine desde createConversationEngine() cuando
//     NEXT_PUBLIC_VOICE_MODE=realtime.
//
// La pantalla de llamada no necesita cambios: sólo habla con ConversationEngine.

export function createRealtimeEngine(_opts: { simulationId: string; events: ConversationEvents }): ConversationEngine {
  void _opts;
  throw new Error("El modo de voz en tiempo real todavía no está configurado. Usa NEXT_PUBLIC_VOICE_MODE=pipeline.");
}
