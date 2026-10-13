---
name: simulacion-risk
description: Resuelve ejercicios de simulación Monte Carlo con @RISK (Palisade) en Excel con el mismo estilo que los ejercicios 21-26 que el usuario ya resolvió (cadenas de Markov, VPN con flujos aleatorios, opción de abandono, RiskSimtable para elegir capacidad/cantidad/% óptimo, distribuciones discretas, normal, triangular). Genera el .xlsx con las fórmulas @RISK listas para correr (RiskNormal, RiskDiscrete, RiskTriang, RiskSimtable, RiskOutput, FORMULATEXT), calcula las respuestas con una réplica en Python y responde cada inciso a), b), c) con sus estadísticas y conclusión. Úsalo siempre que el usuario comparta o pegue un ejercicio de simulación, "experimentos", "iteraciones", probabilidades de transición, valor presente neto aleatorio, o mencione @RISK, Risk, Palisade, Monte Carlo o "Ej. NN" de la clase de simulación, aunque no pida explícitamente un Excel.
---

# Simulación con @RISK al estilo del usuario

El usuario resuelve ejercicios de un curso de simulación en Excel con el complemento
@RISK. Ya resolvió los Ej. 21-26 y quiere que los nuevos se resuelvan **igual**: misma
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
- `ejemplo_ej26_markov.py` – plantilla completa (Ej. 26 resuelto de punta a punta). Cópiala.

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

### 2. Elegir el patrón (ver `references/patrones.md`)
P1 Bernoulli/IF · P2 discreta con acumulada · P3 RiskSimtable para elegir el mejor
valor · P4 flujos encadenados + VPN · P5 decisión/abandono por periodo · P6 Markov
(con/sin absorbente) · P7 capital acumulado. Lo central: **la hoja es un solo
experimento; @RISK la repite N veces**. Filas = periodos dentro del experimento.

### 3. Réplica en Python → respuestas
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

### 4. Construir el Excel con `LibroRisk`
Parte de `scripts/ejemplo_ej26_markov.py`. Convenciones del usuario que el Excel debe
respetar (por qué: así lo entrega en clase y así lo reconoce su profesor):
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

### 5. Responder en el chat
Usa este formato (en español, tono directo como el del usuario):

```
## Ej. NN – <tema>
**Modelo:** <1-3 líneas: qué es una fila, qué es aleatorio, N experimentos, simulaciones>

**Fórmulas clave** (como se ven en Excel con FORMULATEXT):
- Nivel final: `=IF(C27=1;RiskDiscrete($B$20:$B$23;$D$20:$D$23);...)`
- Salida: `=RiskOutput()+COUNTIF(C27:C61;"<4")`

**a)** <respuesta con número> (Mean ≈ …; si aplica Mode/Median/Std Dev)
**b)** …
**c)** <tabla de estadísticas si las piden>

**Conclusión:** <1-2 frases como las de sus Excel>

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
- Elegir un óptimo distinto al máximo de la propia tabla (Ej. 24 b: el texto decía
  1,480,000 y la tabla daba 1,340,000). Toma siempre el máximo de la tabla y menciona empates.
- Comparar valores en momentos distintos del tiempo en decisiones de abandono (Ej. 23 b).
- Probabilidades que no suman 1 (Ej. 25, fila 2 = 0.9): RiskDiscrete normaliza en silencio.
- Fórmulas de matriz `{=...}` accidentales: no las uses.
- Hacer una fila por experimento: el número de experimentos va en Iterations, no en filas.
