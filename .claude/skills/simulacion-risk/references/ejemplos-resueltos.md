# Ejercicios resueltos por el usuario con @RISK (referencia de estilo)

Estos son los ejercicios 21-28 tal como el usuario los resolvió en Excel + @RISK.
Son la "verdad" de cómo se espera que se vea una respuesta. Las fórmulas se
muestran como aparecen en su Excel en español (separador `;`, decimal `.`).

Contenido:
1. Ej. 21/22 – Demostración @RISK con Ej. 2, 7 y 11 (Bernoulli, discreta, RiskSimtable)
2. Ej. 23 – Flujos aleatorios encadenados, VPN y opción de abandono
3. Ej. 24 – Capacidad óptima de planta (RiskSimtable + VPN, dos escenarios de demanda)
4. Ej. 25 – Cadena de Markov (popularidad Tesla), moda del nivel final
5. Ej. 26 – Cadena de Markov con estado absorbente (jugador de beisbol), estadísticas completas
6. Ej. 27 – Licitación con 3 competidores triangulares (RiskSimtable sobre mi oferta)
7. Ej. 28 – Licitación con competidores uniformes (RiskUniform), 5 variantes a, b, c1, c2, d
8. Observaciones / errores detectados en los originales

---

## 1. Ej. 21 (y Ej. 22, que es copia) – "@Risk – Demostración con Ej. 2, 7 y 11"

Los tres sub-ejercicios viven en la misma hoja, uno debajo de otro, cada uno con su
título ("Ejercicio 2", "Ejercicio 7", "Ejercicio 11"). Encima de cada encabezado de
columna se escribe, en texto, la fórmula que lleva esa columna (p. ej. `RAND()`,
`IF(B11<0.5;5;7)`), para que se lea la lógica.

### Ejercicio 2 – Duración total de 4 tareas
- Cada tarea dura 5 ó 7 días (50/50) y se acepta o rechaza (50/50); si se rechaza
  se rehace con 3 días extra.
- Tabla (filas = tareas 1..4): `Tarea | RAND() | Duración =IF(C11<0.5,5,7) | RAND() |
  Acepto/Rechazo =IF(E11<0.5,"Acepto","Rechazo") | Duración total =IF(F11="rechazo",D11+3,D11)`
- Salida: `G15 = RiskOutput()+SUM(G11:G14)` con `=FORMULATEXT(G15)` debajo.
- Resultado pegado al lado: `Mean 30.107` (teórico 30).
- Nota: aquí usó `RAND()` normal; @RISK también lo re-muestrea en cada iteración.

### Ejercicio 7 – Vendedor de periódicos (cuántos comprar)
- Tabla de demanda: `Demanda/día | Probabilidad | Prob. Acumulada` (35..40 con
  0.025, 0.125, 0.2, 0.35, 0.17, 0.13; acumulada `=C21+D20`).
- Variable de decisión: `F20 = RiskSimtable(K28:K38)` con la lista de compras 30..40
  (`K29 = K28+1`). 11 simulaciones.
- Una sola fila de experimento: `Aleatorio =RAND() | Demanda real =IF(C29<$D$20;$B$20;IF(C29<$D$21;$B$21;...))
  | Compra =$F$20 | Vendidos =MIN(D29:E29) | Sobrantes =E29-F29 | Faltantes =D29-F29 |
  Utilidad =RiskOutput()+(F29*3)-(2.5*G29)-(H29*3.5)`
- Tabla de resultados "Posibles compras | Utilidad promedio" con la media de cada
  simulación: 30→62.6, …, 37→106.4, **38→109.6**, 39→109.4, 40→108.0.
- Respuesta: comprar 38 (la mayor utilidad promedio). 38 y 39 están prácticamente empatados.

### Ejercicio 11 – % del capital a invertir cada semana
- Tabla de resultados de cada apuesta: `Resultado | Probabilidad | Acumulada | Múltiplo`
  (Triplica 0.25 ×3, Duplica 0.15 ×2, Igual 0.05 ×1, Pierde 0.55 ×0).
- Parámetros: `Capital inicial 100000`, `% a invertir = RiskSimtable(J643:J682)`
  (1%..40%, paso 0.01 → 40 simulaciones), 200 iteraciones.
- Tabla semanal (100 semanas): `Semanas | Capital inicial (=G anterior) | Inversión
  =C540*$H$534 | Aleatorio RAND() | Suceso =D540*IF(E540<$D$533;$E$533;IF(...)) |
  Capital final =C540-D540+F540`
- Salida en la última semana: `G639 = RiskOutput()+C639-D639+F639`.
- Tabla "% de inversión | Prom Capital final" con la media por simulación.

Ajustes guardados: 200 iteraciones, 40 simulaciones.

---

## 2. Ej. 23 – Proyecto con flujos aleatorios, VPN y opción de abandono (300 experimentos)

**Enunciado (resumen):** flujo año 1 ~ Normal(1000, 200); año t>1 ~ Normal(media =
flujo año t-1, desv = 0.2·media). Tasa 10%. a) VPN del proyecto. b) Al final de los años
1-4 puedes abandonar y recibir recompensa (3000, 2600, 1900, 900); te retiras si el VPN
de lo que resta es menor que la recompensa. ¿Valor esperado de la opción?

**Datos:** tabla `Tiempo de abandono | Recompensa` (Fin del año 1..4).

**a)** Fila `Experimento | Flujo año 1..5 | Valor Presente Neto`:
- `C14 =RiskNormal(1000;200)`, `D14 =RiskNormal(C14;0.2*C14)` (y así E, F, G)
- `H14 =RiskOutput()+NPV(0.1;C14;D14;E14;F14;G14)`
- FORMULATEXT de cada fórmula en la fila 12. Resultado: **Mean $3,773.67**.

**b)** Para cada año de retiro k = 1..4, dos columnas:
- `¿Me conviene?` → `=IF(NPV(0.1;0;D14;E14;F14;G14)<NPV(0.1;I5);"SI";"NO")`
  (VPN de los flujos que se pierden vs. recompensa)
- `¿Cuánto ganaría? Año k` → RiskOutput con flujos hasta k + recompensa descontada:
  `=RiskOutput()+NPV(0.1;C14)+NPV(0.1;I5)`, `=RiskOutput()+NPV(0.1;C14;D14)+NPV(0.1;0;I6)`,
  `=RiskOutput()+NPV(0.1;C14;D14;E14)+I7/(1+0.1)^3`, …
- Medias: año 1 $3,636.34 · año 2 $3,886.09 · **año 3 $3,920.10** · año 4 $3,800.81
- Conclusión (texto): *"Le conviene retirarse en el 3, si se le pasa le conviene retirarse en el 4"*.

Ajustes: 300 iteraciones, 1 simulación. (Algunas fórmulas quedaron como fórmulas de
matriz por accidente; no es necesario.)

---

## 3. Ej. 24 – Capacidad de planta que maximiza el VPN (300 experimentos)

**Enunciado (resumen):** demanda 2026 = 500,000; demanda t+1 = demanda t + Normal(300, 10).
Planta se construye en 2027 (costo fijo 5,000,000 + 10·x en 2027). Precio $100. Costo
variable unitario 60 − 0.1·(x − 1,000,000)/10,000. Costo de operación $10 por unidad de
capacidad cada año. Ventas en exceso de la capacidad se pierden. Tasa 16%, periodo
2027-2035. a) Capacidad que maximiza el VPN. b) Igual pero demanda t+1 = 1.13·demanda t +
Triang(50, 80, 100).

**Modelo (una fila por experimento, columnas por año):**
- `L3 = RiskSimtable(E20:E50)` → capacidad x (celda de decisión arriba, con FORMULATEXT encima).
- 2026: `C16 = 500000`. 2027: `D16 =ROUNDUP(C16+RiskNormal(300;10);0)`, `E16 =5000000+10*$L$3` (costo fijo).
- Cada año 2028-2035, bloque de 5 columnas:
  `Demanda =ROUNDUP(anterior+RiskNormal(300;10);0)` · `Unidades vendidas =IF(F16>$L$3;$L$3;F16)` ·
  `Costo variable (u) =60-0.1*($L$3-1000000)/10000` · `Costo de operación =10*$L$3` ·
  `Utilidad =(G16*100)-(G16*H16)-I16`
- Fila 13: FORMULATEXT de cada columna. Fila 14: años. Fila 15: encabezados.
- Salida: `C18 =RiskOutput("NPV")+NPV(0.16;-E16;J16;O16;T16;Y16;AD16;AI16;AN16;AS16)`
- Tabla `Posibles Capacidades de Planta | Promedio VPN`: 500,000 a 503,000 paso 100 (31 simulaciones).

**Resultado a):** máximo en **502,100 → VPN promedio $38,305,593**.
Conclusión (cuadro de texto): *"A) La Capacidad de planta ideal es de 502,100, con esta el valor presente neto es el más grande"*.

**b)** Misma estructura copiada más abajo (filas 52-89) con
`Demanda =ROUNDUP(1.13*C55+RiskTriang(50;80;100);0)`, salida `RiskOutput("NPVB")`, y
tabla de capacidades 500,000 a 1,550,000 paso 35,000. El usuario cambia el rango de
`RiskSimtable` de `L3` para que apunte a la segunda tabla al correr el inciso b.
Resultado en la tabla: máximo en 1,340,000 ($82,753,814), aunque el texto dice 1,480,000
(ver observaciones).

Ajustes: 300 iteraciones, 31 simulaciones (= número de capacidades).

---

## 4. Ej. 25 – Cadena de Markov: popularidad del Tesla (500 experimentos)

**Enunciado:** niveles 1, 2, 3 con matriz de transición. a) Simula 15 años empezando
en nivel 1. b) Con 500 experimentos, ¿nivel más probable al año 15?

**Modelo:**
- Matriz `Nivel inicial | pasar a nv1 | nv2 | nv3`, y una tabla por nivel de origen
  (`Nivel k: Probabilidad de pasar a:` con columnas valor/probabilidad).
- Tabla `Año | Nivel inicial | Nivel final` (15 filas): `C17 = 1`, `C18 =D17`,
  `D17 =IF(C17=1;RiskDiscrete($G$11:$G$13;$H$11:$H$13);IF(C17=2;RiskDiscrete($J$11:$J$13;$K$11:$K$13);RiskDiscrete($M$11:$M$13;$N$11:$N$13)))`
- Salida: el nivel final del año 15 `D31 =RiskOutput()+IF(...)`.
- Resultado pegado: `Mode 3`.
- Conclusión como fórmula que concatena texto y celdas:
  `="a) En la simulación de 15 años, empezando en nivel 1, el Tesla termina en el nivel "&D31&". b) Con 500 experimentos, el nivel más probable al año 15 es el nivel "&H29&" (moda). Esto se debe a que el nivel 3 es muy estable: una vez ahí, hay 80% de probabilidad de quedarse."`

Ajustes: 500 iteraciones.

---

## 5. Ej. 26 – Cadena de Markov con estado absorbente: jugador de beisbol (1000 experimentos)

**Enunciado:** estrellas, abridores, suplentes (+ retirado). Salario: estrella $1M,
abridor $400k, suplente $100k. Entra como suplente. a) ¿Cuánto tiempo pasa en el equipo?
b) Salario anual promedio. c) Estadísticas del dinero total ganado. 1000 experimentos.

**Modelo:**
- Matriz con `Código | Nivel original | Estrella | Abridor | Suplente | Retirado | Total (=SUM)`.
  La columna Total verifica que cada fila sume 1.
- Cuatro tablas `Nivel original: X` con `Código | Pasa a (=$C$11…) | Probabilidad (=$C$12…)`.
- Tabla `Año | Nivel Inicial | Nivel Final | Salario` con 35 filas (horizonte largo para
  que casi todos se retiren): `C27 = 3`, `C28 =D27`,
  `D27 =IF(C27=1;RiskDiscrete($B$20:$B$23;$D$20:$D$23);IF(C27=2;RiskDiscrete($F$20:$F$23;$H$20:$H$23);IF(C27=3;RiskDiscrete($J$20:$J$23;$L$20:$L$23);RiskDiscrete($N$20:$N$23;$P$20:$P$23))))`,
  `E27 =IF(C27=1;1000000;IF(C27=2;400000;IF(C27=3;100000;0)))`
- Salidas (con FORMULATEXT debajo):
  - `a) Años jugados = RiskOutput()+COUNTIF(C27:C61;"<4")`
  - `b) Promedio por año jugado = SUM(E27:E61)/C63`
  - `c) Ganado = RiskOutput()+SUM(E27:E61)`
- Resultados: tabla Statistics completa de @RISK pegada (Minimum $100,000, Maximum
  $20,800,000, **Mean $1,563,300**, 90% CI ±$129,025, Mode $100,000, Median $300,000,
  Std Dev $2,478,246, Skewness 2.5569, Kurtosis 11.3573, Values 1000, Left X $100,000 (5%),
  Right X $6,900,000 (95%), y percentiles 1%…99%) + imagen del histograma de "Años jugados"
  (Mean 4.953, Mode 1, Median 3, 90% entre 1 y 16 años).

Ajustes: 1000 iteraciones.

---

## 6. Ej. 27 – Licitación, 3 competidores (1000 experimentos, 16 simulaciones)

**Enunciado:** el proyecto te cuesta $50,000; 3 competidores ofrecen un precio aleatorio
con mínimo $55,000, más probable $80,000 y máximo $150,000. ¿En cuánto ofrecer para
maximizar la ganancia esperada?

**Hoja (una sola fila de experimento, formato sencillo, sin colores ni negritas):**
- Fila 10: `=FORMULATEXT(...)` de cada columna. Fila 11 encabezados:
  `Experimentos | Costo | Mi oferta | Oferta competidor 1 | … 2 | … 3 | Mi ganancia`
- Fila 12: `1 | 50000 | =RiskSimtable(C15:C30) | =RiskTriang(55000;80000;150000) (x3) |
  =RiskOutput()+IF(MIN(D12:G12)=D12;D12-C12;0)`
- Tabla abajo: `Posibles Ofertas | Ganacia promedio`, `C15 = 55000`, `C16 =C15+3000` … hasta 100,000.
- Resultado: máximo en **73,000 → $14,950** (70,000 da $14,940: empate). La fila ganadora
  en amarillo y la palabra **"IDEAL"** al lado. Formato contable en $.

## 7. Ej. 28 – Licitación con competidores uniformes (500 experimentos, 15 simulaciones)

**Enunciado:** tu costo $100,000; 4 competidores con oferta uniforme entre 1 y 3 veces tu
costo (independientes). a) Oferta que maximiza la ganancia esperada. b) Si se duplican
los competidores. c) Misma media pero menos variabilidad: c1) U(150k, 250k), c2) U(180k, 220k).
d) Cada competidor tiene 40% de probabilidad de no licitar.

**Hoja:** cinco bloques uno debajo de otro, cada uno con su etiqueta (`a)`, `b)`, `C1)`,
`C2)`, `D)`) y la misma estructura que Ej. 27:
- `Experimento | Mi costo | Mi oferta | Oferta competidor 1..n | Mi Ganancia`
- `Mi oferta =RiskSimtable(C19:C33)` (cada bloque apunta a su propia tabla),
  ofertas `=110000`, `=C19+10000` … 250,000.
- a) competidores `=RiskUniform(100000;300000)`, salida `=RiskOutput()+IF(MIN(D16:H16)=D16;D16-C16;0)`
- b) 8 competidores, salida `=RiskOutput("Mi GananciaB")+IF(MIN(D37:L37)=D37;D37-C37;0)`
- c1) `=RiskUniform(150000;250000)`, c2) `=RiskUniform(180000;220000)`, salidas con nombre
  `RiskOutput("Mi GananciaC1")`, `RiskOutput("Mi GananciaC2")`
- d) `=IF(RAND()<0.4;RiskUniform(100000;300000);"no Licita")` y
  `=RiskOutput("no Licita / Mi Ganancia D")+IF(MIN(D100;E100;F100;G100;H100)=D100;D100-C100;0)`
  (MIN ignora el texto "no Licita"; si nadie licita, gano yo).
- Resultados (fila IDEAL en amarillo): a) **140,000 → $16,320**; b) **120,000 → $8,400**;
  c1) **150,000 → $50,000**; c2) **180,000 → $80,000**; d) **200,000 → $42,200**.
- Conclusiones (cuadros de texto, informales, una línea, sin acentos a veces):
  - b) *"Entre mas competidores Debo bajar mi oferta, y ganaré menos"*
  - c) *"Si la distribución esta mas cerrada puedo ofertar mas y ganar mas"*
  - d) *"Menos participantes puedes ofertar mas alto y ganar mas"*

---

## 8. Observaciones / errores detectados (para no repetirlos)

- **Ej. 24 b:** la conclusión dice 1,480,000 pero la tabla del propio archivo da el
  máximo en 1,340,000 ($82,753,814 vs $82,753,631 en 1,480,000). La réplica en Python
  también da 1,340,000. Hay una meseta muy plana entre ~1.34M y ~1.48M: conviene decir
  el máximo de la tabla y comentar que hay capacidades casi equivalentes.
- **Ej. 25:** la fila del nivel 2 suma 0.9 (0.3, 0.5, 0.1). `RiskDiscrete` normaliza las
  probabilidades sin avisar, así que el resultado cambia en silencio. Agregar siempre una
  columna `Total =SUM(...)` como en el Ej. 26 y avisar al usuario si alguna fila ≠ 1.
- **Ej. 23 b:** la regla "¿Me conviene?" compara a veces valores descontados a t=0
  (`NPV(...)<NPV(0.1;I5)`) y otras veces VPN a t=0 contra la recompensa sin descontar
  (`NPV(0.1;0;0;0;F14;G14)<I7`). Comparar siempre en el mismo momento del tiempo.
- **Ej. 7:** 38 vs 39 periódicos están casi empatados; con 200 iteraciones el ganador
  puede cambiar entre corridas. Mencionarlo cuando la diferencia sea menor al 90% CI.
- **Ej. 28 d:** el enunciado dice 40% de probabilidad de **no** licitar, pero la fórmula
  `IF(RAND()<0.4;RiskUniform(...);"no Licita")` hace que cada uno **licite** sólo el 40%.
  Lo correcto es `IF(RAND()<0.6;RiskUniform(...);"no Licita")` (o `RAND()>=0.4`). Con eso
  el óptimo baja a ~170,000 (≈$27,400) en vez de 200,000. Avisar si se repite la duda.
- **Ej. 27:** el usuario lo recuerda como "RiskUniform", pero usa `RiskTriang`
  (mín, más probable, máx). La uniforme está en Ej. 28.
- **Ej. 28 c1/c2:** el óptimo queda en el mínimo de los competidores (150k / 180k) porque
  ahí se gana siempre: conviene decir "le gano a todos siempre".
- En Ej. 23 y 25 hay fórmulas de matriz `{=...}` accidentales; escribir fórmulas normales.
