# Acordeón para el examen: fórmulas por ejercicio

Úsalo cuando el usuario pida "las fórmulas del Ej. N", "cómo se hizo el N" o un repaso
para el examen. Fórmulas como se ven en su Excel en español (separador `;`). Temas del
examen que marcó: Poisson (16), control de calidad (17, 18), jugador de futbol (19),
VPN (23), capacidad de planta (24), cadenas de Markov (25, 26), licitaciones (27, 28).

## Reglas generales
- **Análisis de datos (Ej. ≤ 20):** una fila = un experimento; lo aleatorio se genera con
  Datos > Análisis de datos > Generación de números aleatorios (valores fijos); al final
  `COUNTIF` / `AVERAGE` / `=conteo/N`.
- **@RISK (Ej. ≥ 21):** la hoja = un experimento; N experimentos = Iterations; elegir el
  mejor valor = `RiskSimtable` + Simulations = cantidad de valores; `RiskOutput()+` en la
  celda resultado; `NPV` descuenta desde el primer flujo.

## Ej. 16 – Poisson (sin archivo del usuario todavía)
Referencia general: Análisis de datos > Poisson con Lambda = media, o en @RISK
`=RiskPoisson(λ)`. Cuando el usuario mande su archivo, reemplaza esta sección.

## Ej. 17 – Efectividad de un plan de muestreo (Análisis de datos, 300 exp.)
| Columna | Fórmula |
|---|---|
| Piezas defectuosas | Análisis de datos Binomial p = 0.03, ensayos = 5 |
| Decisión | `=IF(C15>=2;"Rechazo";"Acepto")` |
| Lote | `=IF(RAND()>0.7;"Malo";"Bueno")` |
| Error | `=IF(AND(D15="Acepto";E15="Malo");"Error 1";IF(AND(D15="Rechazo";E15="Bueno");"Error 2";""))` |
| Conteos | `=COUNTIF(F15:F314;"Error 1")` → 90 · `=COUNTIF(F15:F314;"Error 2")` → 1 |
| Efectividad | 1 − 91/300 = 69.7% |

## Ej. 18 – Plan de muestreo más económico (Análisis de datos, 500 exp.)
| Columna | Fórmula |
|---|---|
| Defectuosos en muestra | Análisis de datos Binomial p = 0.15, ensayos = n |
| Decisión | `=IF(C19>=k;"Rehazo";"Acepto")` |
| Defectuosos en lote | Análisis de datos Discreta, rango `$F$6:$G$10` (5, 16, 25, 46, 54 · 0.2 c/u) |
| Reemplazo | `=IF(D19="Acepto";E19*100;0)` |
| Inspección | `=120+n*(20)` (100%: `=120+150*(20)`) |
| Total / Promedio | `=F19+G19` · `=AVERAGE(H19:H518)` |
Resultados: A $1,491 · B $2,645 · C $3,016 · D $3,151 · E $3,261 · F $3,120 · G (n=20, ≥1) $593.

## Ej. 19 – Penales (Análisis de datos, 200 exp.)
Goles: Binomial p = 0.45, ensayos = 5 · `=COUNTIF(C10:C209;5)` → 1 · `=C211/200` → 0.5%
(teórico 1.8%) → no conviene apostar.

## Ej. 23 – VPN y opción de abandono (@RISK, 300 iteraciones)
| Qué | Fórmula |
|---|---|
| Flujo año 1 | `=RiskNormal(1000;200)` |
| Flujo años 2-5 | `=RiskNormal(C14;0.2*C14)` |
| VPN | `=RiskOutput()+NPV(0.1;C14;D14;E14;F14;G14)` → $3,773.67 |
| ¿Me conviene? año 1 | `=IF(NPV(0.1;0;D14;E14;F14;G14)<NPV(0.1;I5);"SI";"NO")` |
| ¿Cuánto ganaría? año 1 / 2 | `=RiskOutput()+NPV(0.1;C14)+NPV(0.1;I5)` · `=RiskOutput()+NPV(0.1;C14;D14)+NPV(0.1;0;I6)` |
| año 3 / 4 | `=RiskOutput()+NPV(0.1;C14;D14;E14)+I7/(1+0.1)^3` · `=RiskOutput()+NPV(0.1;C14;D14;E14;F14)+I8/(1+0.1)^4` |
Mejor: retirarse en el año 3 ($3,920.10).

## Ej. 24 – Capacidad de planta (@RISK, 300 iteraciones, 31 simulaciones)
| Qué | Fórmula |
|---|---|
| Capacidad | `=RiskSimtable(E20:E50)` · `E21 =E20+100` |
| Demanda | `=ROUNDUP(C16+RiskNormal(300;10);0)` (b: `=ROUNDUP(1.13*C55+RiskTriang(50;80;100);0)`) |
| Costo fijo | `=5000000+10*$L$3` |
| Vendidas | `=IF(F16>$L$3;$L$3;F16)` |
| Costo variable | `=60-0.1*($L$3-1000000)/10000` |
| Operación | `=10*$L$3` |
| Utilidad | `=(G16*100)-(G16*H16)-I16` |
| VPN | `=RiskOutput("NPV")+NPV(0.16;-E16;J16;O16;T16;Y16;AD16;AI16;AN16;AS16)` |
a) 502,100 → $38,305,593 · b) 1,340,000 (máximo de la tabla).

## Ej. 25 – Markov, Tesla (@RISK, 500 iteraciones)
Nivel final `=IF(C17=1;RiskDiscrete($G$11:$G$13;$H$11:$H$13);IF(C17=2;RiskDiscrete($J$11:$J$13;$K$11:$K$13);RiskDiscrete($M$11:$M$13;$N$11:$N$13)))`,
nivel inicial `=D17`, salida año 15 con `RiskOutput()+` → Mode = 3.

## Ej. 26 – Markov, jugador de beisbol (@RISK, 1000 iteraciones)
| Qué | Fórmula |
|---|---|
| Total fila | `=SUM(C12:F12)` |
| Nivel final | `=IF(C27=1;RiskDiscrete($B$20:$B$23;$D$20:$D$23);IF(C27=2;RiskDiscrete($F$20:$F$23;$H$20:$H$23);IF(C27=3;RiskDiscrete($J$20:$J$23;$L$20:$L$23);RiskDiscrete($N$20:$N$23;$P$20:$P$23))))` |
| Salario | `=IF(C27=1;1000000;IF(C27=2;400000;IF(C27=3;100000;0)))` |
| Años jugados | `=RiskOutput()+COUNTIF(C27:C61;"<4")` → 4.95 |
| Promedio anual | `=SUM(E27:E61)/C63` |
| Ganado | `=RiskOutput()+SUM(E27:E61)` → $1,563,300 |

## Ej. 27 – Licitación, 3 competidores (@RISK, 1000 iteraciones, 16 simulaciones)
Mi oferta `=RiskSimtable(C15:C30)` (55,000 `+3000`) · competidor `=RiskTriang(55000;80000;150000)` ·
ganancia `=RiskOutput()+IF(MIN(D12:G12)=D12;D12-C12;0)` → IDEAL 73,000 ($14,950; 70,000 empata).

## Ej. 28 – Licitación, uniformes (@RISK, 500 iteraciones, 15 simulaciones)
Mi oferta `=RiskSimtable(C19:C33)` (110,000 `+10000`) · competidor `=RiskUniform(100000;300000)` ·
ganancia `=RiskOutput()+IF(MIN(D16:H16)=D16;D16-C16;0)`.
a) 140,000 · b) 8 competidores → 120,000 · c1) `RiskUniform(150000;250000)` → 150,000 ·
c2) `RiskUniform(180000;220000)` → 180,000 · d) `=IF(RAND()<0.4;RiskUniform(100000;300000);"no Licita")` → 200,000
(ojo: "40% no licita" debería ser `RAND()<0.6`, óptimo ≈ 170,000).
