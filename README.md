# Coach de Ventas · Mente Fría

Aplicación de **sales training por voz**. El vendedor llama por voz a un cliente simulado por IA, que tiene una ficha secreta. Al terminar, un **coach IA independiente** evalúa la llamada contra el manual de ventas de Mente Fría (pasos A–L) y genera un score sobre 100 con feedback específico. Las simulaciones quedan en el historial y en el dashboard se ve la evolución.

- **Frontend / backend:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- **Base de datos y auth:** Supabase (PostgreSQL + Auth + Storage), con RLS
- **IA:** Google Gemini (plan gratuito), detrás de una abstracción de proveedores
- **Voz:** Web Speech API del navegador (reconocimiento y síntesis gratuitos), detrás de una abstracción lista para voz en tiempo real

---

## Puesta en marcha (≈ 20 minutos)

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (el plan gratuito alcanza).
2. Ve a **SQL Editor**, pega el contenido de `supabase/migrations/20261005000000_init.sql` y ejecútalo. También puedes correr `npx supabase link` y `npx supabase db push`.
3. En **Authentication → Sign In / Providers → Email**, desactiva **"Allow new users to sign up"**. Los usuarios los crea el admin desde la app.
4. En **Project Settings → API** copia la *Project URL*, la *anon / publishable key* y la *service_role / secret key*.

### 2. Gemini (gratis)

Crea una API key en [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

> En el plan gratuito, Google puede usar los datos de las peticiones para mejorar sus productos, y hay límites por minuto y por día. Para un equipo pequeño alcanza. Si se queda corto, activa la facturación en Google AI Studio o cambia de proveedor (ver "Proveedores de IA").

### 3. Variables de entorno

Copia `.env.example` a `.env.local` (local) o cárgalas en Vercel (**Settings → Environment Variables**):

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (**sólo servidor**) |
| `AI_PROVIDER` | `gemini` (o `mock` para una demo sin IA) |
| `GEMINI_API_KEY` | API key de Gemini (**sólo servidor**) |
| `GEMINI_CHAT_MODEL` / `GEMINI_EVAL_MODEL` | Opcionales. También se eligen en Admin |

Ninguna API key llega al navegador: todas las llamadas a la IA pasan por rutas del servidor.

### 4. Despliegue en Vercel

1. Importa el repositorio en [vercel.com/new](https://vercel.com/new) y agrega las variables.
2. Despliega.
3. En Supabase → **Authentication → URL Configuration**, pon tu dominio de Vercel como *Site URL*.

> El plan Hobby de Vercel es para uso personal y no comercial. Para una herramienta interna de la empresa conviene Vercel Pro, o desplegar en Netlify, Render o Railway (`npm run build && npm start`).

### 5. Primer uso

1. Abre la app. Como todavía no hay usuarios, `/login` te pide crear la **cuenta de administrador**.
2. Al crearla se carga automáticamente el contenido inicial de Mente Fría: el catálogo de septiembre 2026, el manual A–L, las políticas, las objeciones, 22 escenarios, 5 dificultades y los criterios de score.
3. En **Admin → Resumen**, pulsa **"Probar conexión y listar modelos"** para confirmar que Gemini responde y elegir los modelos.
4. En **Admin → Usuarios**, da de alta a tus vendedores (correo, contraseña y rol).

### Desarrollo local

```bash
npm install
npx supabase start          # Supabase local (requiere Docker); aplica la migración
cp .env.example .env.local  # usa las keys que imprime `supabase start`
npm run dev
```

Con `AI_PROVIDER=mock` puedes recorrer todo el flujo sin API key (las respuestas son de demostración). La prueba de humo de punta a punta está en `scripts/e2e-smoke.cjs`.

---

## Cómo se usa

1. **Nueva simulación:** se elige el tipo de cliente (o "Escenario aleatorio"), la dificultad y si la llamada es *con ficha de preparación* (paso A: nombre, canal y mensaje previo) o *en frío*.
2. El servidor genera la **ficha secreta** del prospecto: necesidad, presupuesto, decisor, objeción oculta, producto ideal, personalidad 0–100, etc. El vendedor nunca la ve durante la llamada; ni siquiera puede leerla directamente desde la API de Supabase gracias a RLS.
3. **Llamada:** suena el teléfono, el cliente contesta y el vendedor habla. Hay indicadores de *escuchando / cliente pensando / cliente hablando*, cronómetro, mute, transcripción en vivo y un teclado de respaldo.
4. **Terminar llamada:** el coach analiza la conversación completa y muestra el score, el feedback con citas, las preguntas que faltaron, la información descubierta contra el perfil secreto, las oportunidades perdidas, la pregunta de oro, la probabilidad de compra antes y después, la conversación mejorada, los pasos del manual y las reglas rotas.
5. **Paso L (opcional):** el vendedor escribe su WhatsApp de seguimiento y el coach lo califica aparte.
6. **Dashboard:** promedio, evolución, promedios por categoría, lo que más se olvida preguntar, errores frecuentes y patrones ("No preguntaste presupuesto en 6 de tus últimas 10 simulaciones").
7. **Equipo** (gerente/admin): ranking y detalle de cada vendedor.

### Recomendaciones de voz

- Usa **Chrome o Edge en computadora** y **audífonos** (para que el micrófono no capte la voz del cliente).
- En **Microsoft Edge**, las voces "Natural" en español de México (Dalia, Jorge) suenan casi humanas y son gratis. La voz se elige en la pantalla previa a la llamada.
- El vendedor puede interrumpir al cliente (barge-in). Algunos clientes impacientes también interrumpen al vendedor si habla demasiado.

---

## Arquitectura

```
src/
├─ app/                         UI (App Router) y rutas API
│  ├─ (app)/                    páginas con navegación: dashboard, simulaciones, historial, equipo, admin
│  ├─ llamada/[id]/             pantalla de llamada (pantalla completa)
│  └─ api/simulations/…         crear · start · turn (streaming NDJSON) · end · retry · status · followup
├─ components/                  UI: call/, results/, dashboard/, charts/, admin/, ui/
└─ lib/
   ├─ ai/                       AIProvider + proveedores (gemini, mock) + fábrica
   ├─ simulation/               motor de simulación
   │  ├─ personality.ts         parámetros 0–100 por dificultad → reglas de comportamiento
   │  ├─ profile-generator.ts   ficha secreta del cliente (IA + datos fijados por código)
   │  ├─ customer-agent.ts      prompt del agente CLIENTE + parser de streaming
   │  ├─ prep-brief.ts          ficha de preparación (sólo info "pública")
   │  └─ service.ts             orquestador: crear, iniciar, turnos, terminar, evaluar
   ├─ evaluation/               motor de evaluación (agente COACH independiente)
   │  ├─ coach.ts               EvaluationProvider + prompt del coach
   │  ├─ schema.ts              salida estructurada (zod)
   │  ├─ scoring.ts             pesos, penalizaciones, total, etiqueta
   │  └─ patterns.ts            tendencias entre simulaciones
   ├─ voice/                    voz del navegador
   │  ├─ types.ts               ConversationEngine · TranscriptionProvider · VoiceProvider
   │  ├─ browser-stt.ts         reconocimiento (Web Speech API)
   │  ├─ browser-tts.ts         síntesis por frases
   │  ├─ pipeline-engine.ts     STT → LLM (streaming) → TTS, barge-in, silencios, cuelgue
   │  └─ realtime.ts            punto de extensión speech-to-speech
   ├─ knowledge/                productos + documentos → contexto para los prompts
   ├─ data/                     repositorios (Supabase)
   └─ seed/                     contenido inicial de Mente Fría
supabase/migrations/            esquema, RLS, triggers y buckets de Storage
```

### Datos

| Tabla | Contenido |
|---|---|
| `profiles` | usuarios y rol (`seller`, `manager`, `admin`). El primer usuario es admin |
| `products` | catálogo administrable (precio, stock, características, specs, FAQs, objeciones, fotos…) |
| `knowledge_documents` | manual, políticas, objeciones, FAQs, instalación, logística, competidores… |
| `scenarios`, `difficulty_levels` | tipos de cliente y comportamiento por dificultad |
| `preset_profiles` | clientes fijos reutilizables |
| `scoring_config` | categorías y pesos, reglas con penalización, campos de descubrimiento |
| `simulations` | datos visibles de cada llamada y su evaluación |
| `simulation_secrets` | ficha secreta, estado oculto del cliente y descubrimiento en vivo |
| `simulation_turns` | transcripción: `speaker`, `text`, `t_offset_ms`, `meta` |

### Descubrimiento: secreto vs. descubierto

- Cada respuesta del cliente incluye, oculto en un bloque `<<META>>`, qué campos reveló, su intención de compra actualizada y si cuelga. Esto se guarda en `simulation_secrets.discovery_live` y en `simulation_turns.meta`.
- El coach confirma al final qué descubrió el vendedor, cita el turno como evidencia y lo compara contra el valor real de la ficha.

### Proveedores de IA

`src/lib/ai/types.ts` define `AIProvider` (`streamText`, `generateText`, `generateJSON`, `listModels`). Para agregar **Anthropic** u **OpenAI**:

1. Crea `src/lib/ai/providers/<proveedor>.ts` implementando `AIProvider`.
2. Agrega el `case` en `src/lib/ai/index.ts`.
3. Define `AI_PROVIDER=<proveedor>` y su API key.

El coach (`EvaluationProvider`) y el cliente usan prompts separados y pueden ir en modelos distintos: Admin → Resumen permite elegir un modelo rápido para el cliente y uno más potente para el coach.

### Voz en tiempo real (siguiente paso)

La pantalla de llamada sólo conoce la interfaz `ConversationEngine`. Para usar speech-to-speech (OpenAI Realtime, Gemini Live), implementa un engine en `src/lib/voice/realtime.ts`. Los pasos están documentados en ese archivo: token efímero desde el servidor, mismo prompt del cliente y registro de la transcripción en `simulation_turns`. La evaluación, el historial y el dashboard no cambian.

---

## Admin

- **Productos:** crear y editar todo (precio, stock, entrega, condiciones y concesiones autorizadas, características, especificaciones, fotos, FAQs, objeciones). Un producto inactivo no se usa en las simulaciones.
- **Manual y documentos:** subir PDF, TXT, MD o CSV (se extrae el texto para revisarlo) o escribir en Markdown. Cada documento indica si lo usa el coach y si lo puede "saber" el cliente. Los documentos son la fuente de verdad.
- **Escenarios y dificultad:** tipos de cliente, guía secreta para el generador y rangos de personalidad e instrucciones por dificultad.
- **Criterios de score:** pesos (deben sumar 100), reglas con penalización y campos de descubrimiento.
- **Perfiles predeterminados:** guarda un cliente desde los resultados de una simulación para que todo el equipo practique con el mismo caso.
- **Usuarios:** alta, rol, contraseña y desactivación.
