---
name: simulacion-risk
description: Resuelve ejercicios de simulación Monte Carlo con @RISK (Palisade) en Excel con el mismo estilo sencillo que los ejercicios 17-28 que el usuario ya resolvió, con @RISK o con Análisis de datos > Generación de números aleatorios (control de calidad y planes de muestreo, penales/binomial, cadenas de Markov, VPN con flujos aleatorios, opción de abandono, capacidad de planta, licitaciones, RiskSimtable para elegir capacidad/oferta/cantidad/% óptimo, distribuciones uniforme, discreta, normal, triangular, Poisson). Genera el .xlsx con las fórmulas @RISK listas para correr (RiskUniform, RiskNormal, RiskDiscrete, RiskTriang, RiskSimtable, RiskOutput, FORMULATEXT), calcula las respuestas con una réplica en Python y responde cada inciso a), b), c) con sus estadísticas y conclusión. Úsalo siempre que el usuario comparta o pegue un ejercicio de simulación, "experimentos", "iteraciones", probabilidades de transición, valor presente neto aleatorio, licitaciones u ofertas de competidores, o mencione @RISK, Risk, Palisade, Monte Carlo o "Ej. NN" de la clase de simulación, aunque no pida explícitamente un Excel.
---

# Simulación con @RISK al estilo del usuario

El usuario resuelve ejercicios de un curso de simulación en Excel con el complemento
@RISK. Ya resolvió los Ej. 17-19 (con Análisis de datos de Excel) y 21-28 (con @RISK) y quiere que los nuevos se resuelvan **igual**: misma
estructura de hoja, mismas fórmulas, mismos tipos de salida y conclusiones cortas por
inciso. Tu trabajo es entregar dos cosas:

1. **Un Excel** `EjercicioNN.xlsx` que el usuario abre con @RISK y simula tal cual.
2. **La respuesta** de cada inciso en el chat, con números estimados mediante una
   réplica en Python (Monte Carlo con numpy), aclarando que @RISK dará valores
   cercanos pero no idénticos (otra muestra aleatoria).

Lee `references/ejemplos-resueltos.md` para ver exactamente cómo resolvió cada
ejercicio, y `references/patrones.md` para las recetas por tipo de problema.
Scripts en `scripts/` (dentro del directorio de este skill):
- `leer_ejercicio.py` – extrae enunciado (cuadros de texto), imágenes y fórmulas de un .xlsx.
- `montecarlo.py` – réplica de @RISK en numpy (distribuciones, NPV de Excel, Markov,
  RiskSimtable, tabla de estadísticas de @RISK).
- `risk_excel.py` – clase `LibroRisk` que escribe el Excel en el estilo del usuario.
- `ejemplo_ej26_markov.py` – plantilla completa (Ej. 26, Markov). Cópiala.
- `ejemplo_licitacion.py` – plantilla de licitación (Ej. 27/28) en el formato exacto del usuario.
- `ejemplo_toolpak_muestreo.py` – plantilla SIN @RISK (Análisis de datos, Ej. 17-19), control de calidad.

## Flujo de trabajo

### 1. Entender el ejercicio
- Si viene en .xlsx: `python -I scripts/leer_ejercicio.py archivo.xlsx carpeta_imgs`. El
  enunciado está en un **cuadro de texto**, no en celdas, y las tablas (matrices de
  transición) a veces son **imágenes**: ábrelas con Read para leer los números.
- Si viene en imagen/PDF/texto, transcribe los datos a una tabla antes de modelar.
- Anota: incisos (a, b, c…), número de experimentos (= iteraciones), horizonte
  (años/semanas), qué hay que reportar (media, moda, "estadísticas", "¿conviene?", "óptimo").
- Revisa los datos: filas de matrices de transición que no suman 1, rangos raros,
  órdenes de parámetros (Triangular = mín, más probable, máx). Si algo es ambiguo y
  cambia la respuesta, dilo y elige la interpretación más razonable explicándola.

### 1b. ¿@RISK o Análisis de datos?
- Ej. 21 en adelante, o si mencionan @RISK → **@RISK** (la hoja = un experimento; N = Iterations).
- Ej. 20 o menor, o si dicen "análisis de datos" / "generación de números aleatorios" →
  **Análisis de datos de Excel, sin @RISK** (patrón P0: una fila por experimento, valores
  aleatorios fijos, `COUNTIF`/`AVERAGE` al final; ejemplos Ej. 17, 18, 19). Plantilla
  `scripts/ejemplo_toolpak_muestreo.py`.
- Si no está claro, usa @RISK y menciona en una línea cómo sería con Análisis de datos.

### 2. Usar la función @RISK de cada distribución que nombre el enunciado
El usuario espera ver la función de @RISK, no una fórmula equivalente con RAND:
| El enunciado dice… | Usa | No uses |
|---|---|---|
| "uniforme entre a y b" | `RiskUniform(a,b)` | `a+(b-a)*RAND()`, `RANDBETWEEN` |
| "uniforme entera" / "número entero entre a y b" / piezas, días, clientes | `RiskIntUniform(a,b)` (o `ROUND(RiskUniform(a,b),0)` si dice "redondea") | `RANDBETWEEN(a,b)` |
| "normal con media m y desv s" | `RiskNormal(m,s)` | `NORM.INV(RAND(),m,s)` |
| "triangular min, más probable, max" | `RiskTriang(min,mp,max)` | fórmula inversa a mano |
| "exponencial con media m" | `RiskExpon(m)` | `-m*LN(RAND())` |
| "Poisson con media λ" | `RiskPoisson(λ)` | tablas acumuladas a mano |
| tabla de valores y probabilidades | `RiskDiscrete(valores,probs)` o el IF anidado con RAND() y acumulada (estilo Ej. 7) | — |
`RAND()` sólo para eventos sí/no (Ej. 2) o cuando el ejercicio pide explícitamente la
tabla de probabilidad acumulada. Antes de entregar, repasa el enunciado: cada
distribución nombrada debe aparecer con su función Risk en el Excel y en las fórmulas
que muestras en el chat. En Python: `rng.uniform(a,b)`, `rng.integers(a,b+1)`,
`rng.normal`, `rng.triangular(min,mp,max)`, `rng.exponential(m)`, `rng.poisson(λ)`.

### 3. Elegir el patrón (ver `references/patrones.md`)
P1 Bernoulli/IF · P2 discreta con acumulada · P3 RiskSimtable para elegir el mejor
valor · P4 flujos encadenados + VPN · P5 decisión/abandono por periodo · P6 Markov
(con/sin absorbente) · P7 capital acumulado. Lo central: **la hoja es un solo
experimento; @RISK la repite N veces**. Filas = periodos dentro del experimento.

### 4. Réplica en Python → respuestas
Escribe un script (en tu directorio temporal) que importe `montecarlo.py` y modele
exactamente lo mismo que tendrá el Excel:
- Usa el número de experimentos del enunciado para los números que reportas (así se
  parecen a lo que verá en @RISK).
- Para decisiones (P3, P5) corre además con muchas iteraciones (≥ 20,000). Reporta y
  resalta el óptimo de N grande; si la tabla de N experimentos marca un vecino, dilo
  como empate (diferencia menor al 90% CI). `simtable()` usa números aleatorios comunes
  como @RISK; tu `modelo` recibe `(valor, iteraciones, rng)`.
- Si a) elige un valor y b) pide estadísticas con él, b) es un bloque aparte con el
  valor fijo (patrón P3b).
- `resumen(x, "nombre")` da la tabla Statistics de @RISK (Min, Max, Mean, 90% CI,
  Mode, Median, Std Dev, Skewness, Kurtosis, Left/Right X al 5%/95%, percentiles).
  La Mode de salidas continuas es aproximada (centro de un bin); no la enfatices.
- Valida contra lo esperable (p. ej. media teórica, Markov analítico) cuando sea fácil.

### 5. Construir el Excel con `LibroRisk`
Parte de la plantilla más parecida (`ejemplo_licitacion.py` o `ejemplo_ej26_markov.py`).

**Formato SENCILLO, nada "profesional".** El usuario lo pidió explícitamente: sus Excel
no tienen colores, ni negritas, ni bordes, ni títulos decorados. Lo único resaltado es
la fila ganadora de la tabla de Simtable en amarillo con la palabra `IDEAL` al lado, y
el dinero va en formato contable `$` (constante `DINERO`). `LibroRisk` ya escribe así;
no agregues estilos. Tampoco agregues tablas extra que nadie pidió (la tabla Statistics
completa sólo cuando el enunciado pide "estadísticas"). Conclusiones de una línea, en el
tono del usuario ("Entre mas competidores debo bajar mi oferta, y ganaré menos").

Convenciones del usuario que el Excel debe respetar (por qué: así lo entrega en clase y
así lo reconoce su profesor):
- **Enunciado** arriba (A1:P8, celdas combinadas), con el número "Ej. NN". Empieza el
  modelo en la fila 10 o más abajo (la celda de RiskSimtable puede ir en la fila 10-11).
- **Tablas de datos** con encabezados claros en español (`Código`, `Probabilidad`,
  `Prob. Acumulada`, `Posibles …`, `Promedio …`), y columna `Total =SUM()` en matrices.
- **Etiqueta de inciso** ("A)", "B)") a la izquierda de cada bloque; incisos uno debajo de
  otro en la misma hoja (Ej. 24 copia el modelo completo para el inciso b).
- **FORMULATEXT encima** de cada fórmula clave (`lb.f(celda, formula, mostrar_formula=True)`,
  o una fila entera con `lb.fila_formulatext(fila_texto, fila_datos, ["D","E",...])`)
  para que se lea qué hace cada columna. En Ej. 26 lo puso debajo de las salidas.
- Tabla de simulación con encabezados: `Experimento`/`Año`/`Semanas`, variables, resultado.
- Salidas con `RiskOutput()` (o `RiskOutput("NPV")`) **sumado** a la fórmula:
  `=RiskOutput()+NPV(0.1,C14:G14)`.
- Celda de decisión `=RiskSimtable(rango)` arriba de la hoja + tabla `Posibles X | Promedio Y`
  (`lb.tabla_simtable(..., salida=celda_output)` añade la columna viva `RiskMean(salida,k)`
  y resalta la fila óptima; acepta varias columnas de resultados en un dict).
- Resultados pegados junto a la salida: `Mean` + valor (estilo Ej. 23/24) o la tabla
  Statistics completa cuando piden "estadísticas" (estilo Ej. 26) con
  `lb.estadisticas(celda, resumen, salida=celda_output)`.
- **Conclusión** en texto por inciso (`lb.conclusion`), corta y directa:
  "A) La capacidad de planta ideal es de 502,100, con esta el valor presente neto es el
  más grande", "Le conviene retirarse en el 3, si se le pasa le conviene retirarse en el 4".
  También puede ser fórmula que concatena celdas (estilo Ej. 25).
- Iteraciones y simulaciones se guardan con `LibroRisk(..., iteraciones=N, simulaciones=k)`.

Escribe las fórmulas en inglés con comas (`=IF(C27=1,RiskDiscrete(...),...)`); `LibroRisk`
agrega `_xll.` a las funciones Risk y `_xlfn.` a FORMULATEXT, que es como Excel las
guarda. Guarda el archivo en el directorio de trabajo del usuario (o donde pida) y
compártelo. Si hay LibreOffice, puedes recalcular para revisar que las fórmulas no-Risk
den valores coherentes (las Risk saldrán `#NAME?` sin @RISK, es normal).

### 6. Responder en el chat
Usa este formato (en español, corto y directo como el usuario, sin adornos):

```
## Ej. NN – <tema>
**Modelo:** <1-3 líneas: qué es una fila, qué es aleatorio, N experimentos, simulaciones>

**Fórmulas clave** (como se ven en Excel con FORMULATEXT):
- Nivel final: `=IF(C27=1;RiskDiscrete($B$20:$B$23;$D$20:$D$23);...)`
- Salida: `=RiskOutput()+COUNTIF(C27:C61;"<4")`

**a)** <respuesta con número> (Mean ≈ …; si aplica Mode/Median/Std Dev)
**b)** …
**c)** <tabla de estadísticas si las piden>

**Conclusión:** <1 frase corta e informal como las de sus Excel>

**Para correrlo en @RISK:** abre EjercicioNN.xlsx con @RISK, verifica Iterations = N y
Simulations = k, Start Simulation; las columnas "@RISK" se llenan solas y los valores
estimados en Python quedan al lado para comparar.
```
- En el chat muestra las fórmulas con `;` (su Excel está en español) y decimales con punto.
- Di explícitamente que los números son de la réplica en Python con la misma lógica,
  y que @RISK dará valores cercanos (la diferencia típica es del orden del 90% CI).
- Si encontraste un problema en los datos (fila que no suma 1, enunciado ambiguo), dilo
  arriba de la respuesta.

## Errores a evitar (vistos en los originales)
- Sustituir una distribución nombrada por RAND()/RANDBETWEEN/NORM.INV: usa siempre la
  función Risk correspondiente (tabla del paso 2). Pasó con "uniforme" → debe ser RiskUniform.
- Elegir un óptimo distinto al máximo de la propia tabla (Ej. 24 b: el texto decía
  1,480,000 y la tabla daba 1,340,000). Toma siempre el máximo de la tabla y menciona empates.
- Comparar valores en momentos distintos del tiempo en decisiones de abandono (Ej. 23 b).
- Probabilidades que no suman 1 (Ej. 25, fila 2 = 0.9): RiskDiscrete normaliza en silencio.
- Fórmulas de matriz `{=...}` accidentales: no las uses.
- Hacer una fila por experimento: el número de experimentos va en Iterations, no en filas.
