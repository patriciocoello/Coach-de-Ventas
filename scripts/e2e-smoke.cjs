// Prueba de humo de punta a punta (Playwright). Requiere: base de datos vacía
// (sin usuarios), AI_PROVIDER=mock y la app corriendo en BASE_URL.
//   npx playwright install chromium   # una vez
//   node scripts/e2e-smoke.cjs
const { chromium } = require("playwright");
const SHOTS = (process.env.SHOTS_DIR || require("os").tmpdir()) + "/";
const BASE = process.env.BASE_URL || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  });
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, locale: "es-MX" });
  // Voz falsa: speechSynthesis termina cada frase al instante; sin STT -> modo teclado.
  await ctx.addInitScript(() => {
    delete window.webkitSpeechRecognition;
    delete window.SpeechRecognition;
    const voices = [{ name: "Fake Dalia", lang: "es-MX", voiceURI: "fake-dalia", localService: true, default: true }];
    const fake = {
      speaking: false, paused: false, pending: false,
      getVoices: () => voices,
      addEventListener: () => {}, removeEventListener: () => {},
      speak(u) { window.__spoken = (window.__spoken || []).concat(u.text); setTimeout(() => u.onend && u.onend(), 30); },
      cancel() {}, pause() {}, resume() {},
    };
    Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));

  // 1. Primer admin
  await page.goto(BASE + "/login");
  await page.screenshot({ path: SHOTS + "01-login.png" });
  await page.fill('input[name="full_name"]', "Patricio Coello");
  await page.fill('input[name="email"]', "admin@mentefria.test");
  await page.fill('input[name="password"]', "supersecreta123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin", { timeout: 30000 });
  await page.screenshot({ path: SHOTS + "02-admin.png", fullPage: true });

  // 2. Nueva simulación
  await page.goto(BASE + "/simulaciones/nueva");
  await page.click("text=Centro wellness");
  await page.click("text=Difícil");
  await page.screenshot({ path: SHOTS + "03-nueva.png", fullPage: true });
  await page.click("text=Preparar llamada");
  await page.waitForURL("**/llamada/**", { timeout: 30000 });
  await page.screenshot({ path: SHOTS + "04-prep.png", fullPage: true });

  // 3. Llamada
  await page.waitForTimeout(1500);
  if (errors.length) { console.log("PREP ERRORS:", errors.join("\n")); }
  await page.click("text=Iniciar llamada");
  await page.waitForSelector("text=Transcripción", { timeout: 15000 });
  await page.waitForTimeout(6000); // tono + saludo
  const lines = [
    "Hola, soy Ana de Mente Fría. Antes de explicarte los productos me gustaría entender qué buscas, ¿te parece?",
    "¿Lo buscas para ti o para un negocio?",
    "¿En dónde te gustaría instalarlo? ¿interior o exterior?",
    "¿Ya tienes un presupuesto destinado para el proyecto?",
    "Además de ti, ¿hay alguien más involucrado en la decisión?",
    "¿Para cuándo te gustaría tenerlo instalado?",
  ];
  for (const l of lines) {
    await page.fill('input[placeholder="Escribe lo que dirías…"]', l);
    await page.click("button:has-text('Enviar')");
    await page.waitForTimeout(2500);
  }
  await page.screenshot({ path: SHOTS + "05-llamada.png" });
  const transcript = await page.locator("aside").innerText();
  console.log("TRANSCRIPT:\n" + transcript.slice(0, 1500));
  await page.click("text=Terminar llamada");
  await page.waitForURL("**/simulaciones/**", { timeout: 20000 });
  await page.waitForSelector("text=Calificación", { timeout: 60000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOTS + "06-resultados.png", fullPage: true });

  // 4. WhatsApp
  await page.fill("textarea", "Hola Carlos, gracias por tu tiempo. Te mando la cotización de la MF ONE. Quedamos el jueves a las 11 con tu socio para dejarlo confirmado.");
  await page.click("text=Evaluar mensaje");
  await page.waitForSelector("text=Versión mejorada", { timeout: 30000 });

  // 5. Otras pantallas
  for (const [path, name] of [["/", "07-dashboard"], ["/historial", "08-historial"], ["/equipo", "09-equipo"], ["/admin/productos", "10-productos"], ["/admin/conocimiento", "11-conocimiento"], ["/admin/escenarios", "12-escenarios"], ["/admin/score", "13-score"], ["/admin/perfiles", "14-perfiles"], ["/admin/usuarios", "15-usuarios"]]) {
    await page.goto(BASE + path);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: SHOTS + name + ".png", fullPage: true });
  }
  // Editar producto
  await page.goto(BASE + "/admin/productos");
  await page.click("text=MF ONE");
  await page.waitForSelector("text=Guardar producto");
  await page.screenshot({ path: SHOTS + "16-producto.png", fullPage: true });

  console.log("SPOKEN:", JSON.stringify(await page.evaluate(() => window.__spoken || [])).slice(0, 300));
  console.log("ERRORS:", errors.length ? errors.join("\n") : "none");
  await browser.close();
})().catch((e) => {
  console.error("FAILED", e);
  process.exit(1);
});
