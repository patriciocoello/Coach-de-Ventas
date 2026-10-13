# Patrones de modelado con @RISK (recetas)

Cada patrón trae: cuándo aplica, cómo se arma la hoja (estilo del usuario), la
fórmula @RISK y el equivalente en Python con `montecarlo.py`. Un ejercicio nuevo
suele combinar 2-3 patrones (p. ej. Ej. 24 = flujos encadenados + RiskSimtable).

Índice: P1 Bernoulli/IF · P2 Discreta empírica · P3 RiskSimtable (decisión óptima) ·
P4 Flujos encadenados y VPN · P5 Decisión/abandono por periodo · P6 Markov ·
P7 Proceso acumulativo (capital) · Funciones @RISK · Ajustes de simulación

---

## La idea central
La hoja modela **un solo experimento**. @RISK la recalcula N veces (iteraciones =
"experimentos" del enunciado) y guarda cada celda marcada con `RiskOutput()`.
- Filas de la tabla = periodos (años, semanas, tareas) **dentro de un experimento**.
- No hagas 500 filas para 500 experimentos: eso lo hace @RISK. (Excepción histórica:
  Ej. 7 dejó espacio para muchas filas, pero sólo usó una.)
- Si el enunciado pide "simula 15 años", la tabla tiene 15 filas; si pide además
  "con 500 experimentos", son 500 iteraciones.
- Si hay que **elegir** un valor (cantidad, capacidad, %), es `RiskSimtable` y
  `#simulaciones = #valores`.

---

## P1. Eventos con probabilidad fija (Bernoulli / sí-no)
*Ej. 2.* Una columna `RAND()` y otra `IF(aleatorio<p; valor1; valor2)`.
```
C11 =RAND()                         D11 =IF(C11<0.5,5,7)
E11 =RAND()                         F11 =IF(E11<0.5,"Acepto","Rechazo")
G11 =IF(F11="rechazo",D11+3,D11)    G15 =RiskOutput()+SUM(G11:G14)
```
Alternativa @RISK pura: `=RiskDiscrete({5,7},{0.5,0.5})`, `=RiskBinomial(1,0.5)`.
Python: `d = np.where(rng.random((n,4))<0.5, 5, 7)`.

## P2. Distribución discreta empírica (tabla de probabilidades)
*Ej. 7, Ej. 11.* Tabla `Valor | Probabilidad | Prob. Acumulada` (acumulada: primera
`=C20`, siguientes `=C21+D20`). Luego:
```
=IF(C29<$D$20,$B$20,IF(C29<$D$21,$B$21,IF(C29<$D$22,$B$22, ... ,$B$25)))   (con C29 =RAND())
```
o directamente `=RiskDiscrete($B$20:$B$25,$C$20:$C$25)`. Usa el IF anidado con RAND
cuando el ejercicio es de la parte "manual" del curso (tabla de acumuladas), y
RiskDiscrete cuando es Markov o la tabla es grande. Python: `discreta(rng, vals, probs, n)`
o `discreta_acumulada(u, vals, probs)`.

## P3. Elegir el mejor valor de una decisión → RiskSimtable
*Ej. 7 (compras 30..40), Ej. 11 (% 1..40), Ej. 24 (capacidad).*
1. Tabla `Posibles X | Promedio Y` con los candidatos (primer valor fijo, los demás
   `=anterior+paso`).
2. Celda de decisión `=RiskSimtable(E20:E50)` (arriba, con FORMULATEXT encima).
3. Todas las fórmulas usan esa celda con referencia absoluta (`$L$3`).
4. Ajustes: `Simulaciones = número de candidatos`, iteraciones = experimentos.
5. Después de correr, en la columna "Promedio" va la media de la salida en cada
   simulación (en @RISK: resumen de resultados por simulación, o `=RiskMean(salida,k)`).
6. Respuesta: el X con el mayor (o menor) promedio, resaltado. Si los mejores están
   dentro del 90% CI uno del otro, dilo ("prácticamente empatados").
- Rango de candidatos: el que diga el enunciado; si no dice, empieza grueso (pocos
  valores en un rango amplio), localiza el máximo con Python, y luego refina alrededor
  (Ej. 24 a usó paso 100 cerca de la demanda; b usó paso 35,000 en un rango amplio).
Python: `simtable(valores, modelo, iteraciones)` + `mejor(...)`. Para decidir, corre
también con muchas iteraciones (p. ej. 20,000) para ver el óptimo "real".

## P4. Flujos de efectivo encadenados y VPN
*Ej. 23, Ej. 24.* Columnas por periodo; cada periodo depende del anterior.
```
C14 =RiskNormal(1000,200)           D14 =RiskNormal(C14,0.2*C14)   (media = flujo anterior)
D16 =ROUNDUP(C16+RiskNormal(300,10),0)        demanda t+1 = demanda t + ruido
D55 =ROUNDUP(1.13*C55+RiskTriang(50,80,100),0)
Unidades vendidas =IF(demanda>$cap,$cap,demanda)       (o MIN)
Utilidad = ventas*precio - ventas*costo_var - costo_operación
VPN =RiskOutput("NPV")+NPV(0.16,-inversión,util_1,...,util_n)
```
- `NPV` de Excel descuenta el **primer** argumento un periodo: si la inversión ocurre
  "al final del año 1" va como primer flujo (negativo), como en Ej. 24. Si ocurre en
  t=0 va fuera: `=-inversión+NPV(tasa, flujos)`.
- Redondea demandas/unidades con `ROUNDUP(...,0)` cuando sean piezas (estilo Ej. 24).
- Verifica restricciones que pida el enunciado (p. ej. "verificar que el costo nunca
  sea negativo": `=MAX(0, 60-0.1*($L$3-1000000)/10000)` o comenta para qué x se vuelve negativo).
Python: `npv(tasa, [f1, f2, ...])` con arrays por iteración.

## P5. Decisión por periodo / opción de abandono
*Ej. 23 b.* Para cada momento de decisión k:
- Columna `¿Me conviene?` → `=IF(VPN_de_lo_que_resta < valor_presente_de_la_recompensa,"SI","NO")`
  comparando ambos **en el mismo momento** (los dos descontados a t=0).
- Columna `¿Cuánto ganaría? Año k` → `=RiskOutput()+NPV(tasa, flujos 1..k)+recompensa_k/(1+tasa)^k`.
- Respuesta estilo usuario: el año con mayor media ("Le conviene retirarse en el 3…").
- Además (recomendado) calcula el valor esperado de la **política** completa: en cada
  iteración, el jugador se retira en el primer k donde `¿Me conviene?` = "SI"; si nunca,
  se queda con el VPN completo. Valor de la opción = E[VPN con opción] − E[VPN sin opción].
  Preséntalo como complemento, sin quitar la tabla por año que el usuario espera.

## P6. Cadenas de Markov
*Ej. 25 (sin absorbente), Ej. 26 (con estado "Retirado").*
1. Matriz de transición con columna `Total =SUM(...)` (debe dar 1 en cada fila; si no,
   avisa: RiskDiscrete normaliza sin avisar).
2. Una tabla por estado de origen: `Código | Pasa a | Probabilidad` (referencias a la matriz).
3. Tabla `Año | Nivel inicial | Nivel final [| Salario/Costo…]`:
   `Nivel inicial` de la fila 1 = estado inicial; luego `=Nivel final anterior`.
   `Nivel final =IF(C=1,RiskDiscrete(tabla1),IF(C=2,RiskDiscrete(tabla2),...))`
4. Salidas típicas:
   - nivel al final del horizonte → `RiskOutput()+…` y reportar **Mode** (Ej. 25) y frecuencias.
   - tiempo hasta absorción → `=RiskOutput()+COUNTIF(C27:C61,"<4")` (Ej. 26).
     Usa un horizonte largo (35+ filas) para que casi todos lleguen al absorbente;
     comprueba con Python que P(no absorbido al final) sea despreciable.
   - dinero acumulado → `=RiskOutput()+SUM(salarios)`; promedio por periodo `=SUM/años`.
   - el pago de cada año se basa en el **nivel inicial** de ese año (Ej. 26).
Python: `markov(rng, P, inicial, periodos, iteraciones)`; `frecuencias(est[:,-1])`.
Comprobación analítica opcional (absorbente): N = (I − Q)⁻¹, años esperados = suma de la fila.

## P7. Proceso acumulativo (capital semana a semana)
*Ej. 11.* Filas = semanas: `Capital inicial (=capital final anterior) | Inversión
=C*%$ | Aleatorio | Suceso =Inversión*múltiplo(IF anidado) | Capital final =C-D+F`.
Salida en la última fila. Si hay que elegir el %, combínalo con P3.

---

## Funciones @RISK más usadas (sintaxis en inglés; Excel en español muestra `;`)
| Distribución | Fórmula |
|---|---|
| Normal(media, desv) | `RiskNormal(m, s)` |
| Triangular(min, más probable, max) | `RiskTriang(a, c, b)` ← ojo al orden |
| Uniforme continua | `RiskUniform(min, max)` |
| Uniforme entera | `RiskIntUniform(min, max)` |
| Discreta | `RiskDiscrete(valores, probs)` |
| Binomial | `RiskBinomial(n, p)` |
| Poisson | `RiskPoisson(lambda)` |
| Exponencial (media) | `RiskExpon(media)` |
| Lognormal(media, desv) | `RiskLognorm(m, s)` |
| Valor de decisión | `RiskSimtable(rango)` |
| Marcar salida | `RiskOutput()` o `RiskOutput("nombre")` sumado a la fórmula |
| Estadísticos (después de simular) | `RiskMean(c)`, `RiskMean(c, sim)`, `RiskStdDev(c)`, `RiskMode(c)`, `RiskMin`, `RiskMax`, `RiskPercentile(c, p)` |

Equivalentes numpy: `rng.normal`, `rng.triangular(a, c, b)`, `rng.uniform`,
`rng.integers(a, b+1)`, `discreta`, `rng.binomial`, `rng.poisson`, `rng.exponential(media)`.

## Ajustes de simulación (lo que el usuario fija en la barra de @RISK)
- Iterations = número de experimentos del enunciado (200, 300, 500, 1000…).
- Simulations = 1, o el número de valores de RiskSimtable.
- Muestreo Latin Hypercube (por defecto), semilla aleatoria.
`LibroRisk(..., iteraciones=N, simulaciones=k)` guarda esto en el archivo.
