"""PLANTILLA: Ej. 26 (cadena de Markov con estado absorbente) resuelto de punta a
punta con los dos módulos del skill. Cópiala y adáptala para un ejercicio nuevo.

    python ejemplo_ej26_markov.py <carpeta_salida>

Produce Ejercicio26.xlsx (con fórmulas @RISK listas para correr) e imprime las
respuestas estimadas con la réplica en Python.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from montecarlo import markov, np, resumen, formatear  # noqa: E402
from risk_excel import LibroRisk  # noqa: E402

salida_dir = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
N_EXP = 1000          # "Usa una simulación de 1000 experimentos" -> iteraciones
HORIZONTE = 35        # filas suficientes para que (casi) todos se retiren

# ----------------------------------------------------------------- 1. datos
estados = ["Estrella", "Abridor", "Suplente", "Retirado"]
P = [[0.50, 0.30, 0.15, 0.05],
     [0.20, 0.50, 0.20, 0.10],
     [0.05, 0.15, 0.50, 0.30],
     [0.00, 0.00, 0.00, 1.00]]
salario = {1: 1_000_000, 2: 400_000, 3: 100_000, 4: 0}
inicial = 3  # entra como suplente

# ----------------------------------------------------------------- 2. réplica Python
rng = np.random.default_rng(26)
est = markov(rng, P, inicial, HORIZONTE, N_EXP)[:, :HORIZONTE]   # nivel inicial de cada año
sal = np.vectorize(salario.get)(est)
anos = (est < 4).sum(axis=1)                 # = COUNTIF(C27:C61,"<4")
ganado = sal.sum(axis=1)                     # = SUM(E27:E61)
prom_anual = ganado / anos                   # = SUM(E27:E61)/C63
r_anos, r_ganado = resumen(anos, "Años jugados"), resumen(ganado, "Ganado")
print(formatear(r_anos)); print(formatear(r_ganado, dinero=True))
print("Salario anual promedio:", f"${prom_anual.mean():,.2f}")

# ----------------------------------------------------------------- 3. Excel @RISK
enunciado = ("Ej. 26 Un equipo de beisbol está formado por: estrellas, abridores y suplentes. "
             "Las probabilidades de transición de una temporada a la siguiente se indican en la tabla. "
             "Salario: Estrella $1 millón, Abridor $400k, Suplente $100k. Un jugador acaba de entrar como "
             "suplente. a) ¿Cuánto tiempo pasará dentro del equipo antes de retirarse? b) ¿Cuál será su "
             "salario anual promedio? c) Calcula las estadísticas de la cantidad total de dinero que gana. "
             f"Usa una simulación de {N_EXP} experimentos.")
lb = LibroRisk(enunciado, iteraciones=N_EXP)
ws = lb.ws

# matriz de transición con columna Total (=SUM) para verificar que cada fila sume 1
lb.v("C10", "Probabilidad de convertirse en:", negrita=True)
lb.tabla("A11", ["Código", "Nivel original"] + estados + ["Total"],
         [[i + 1, estados[i]] + P[i] + [f"=SUM(C{12 + i}:F{12 + i})"] for i in range(4)])

# una tabla por estado de origen: Código | Pasa a | Probabilidad (para RiskDiscrete)
cols = ["B", "F", "J", "N"]
for i, c in enumerate(cols):
    c2 = chr(ord(c) + 1); c3 = chr(ord(c) + 2)
    lb.v(f"{c}18", f"Nivel original: {estados[i]}", negrita=True)
    lb.tabla(f"{c}19", ["Código", "Pasa a", "Probabilidad"],
             [[j + 1, f"=${'CDEF'[j]}$11", f"=${'CDEF'[j]}${12 + i}"] for j in range(4)])

# tabla de simulación: Año | Nivel inicial | Nivel final | Salario
lb.tabla("B26", ["Año", "Nivel Inicial", "Nivel Final", "Salario"])
f0, fN = 27, 27 + HORIZONTE - 1
lb.v(f"B{f0}", 1); lb.v(f"C{f0}", inicial)
lb.serie(f"B{f0 + 1}", HORIZONTE - 1, "=B{p}+1")
lb.serie(f"C{f0 + 1}", HORIZONTE - 1, "=D{p}")
nivel_final = ("=IF(C{r}=1,RiskDiscrete($B$20:$B$23,$D$20:$D$23),"
               "IF(C{r}=2,RiskDiscrete($F$20:$F$23,$H$20:$H$23),"
               "IF(C{r}=3,RiskDiscrete($J$20:$J$23,$L$20:$L$23),"
               "RiskDiscrete($N$20:$N$23,$P$20:$P$23))))")
lb.serie(f"D{f0}", HORIZONTE, nivel_final)
lb.serie(f"E{f0}", HORIZONTE, "=IF(C{r}=1,1000000,IF(C{r}=2,400000,IF(C{r}=3,100000,0)))",
         formato='"$"#,##0')
lb.f("C25", "=FORMULATEXT(C28)"); lb.f("D25", "=FORMULATEXT(D28)")

# salidas (a, b, c) con su FORMULATEXT debajo, como en el original
g = fN + 2
lb.v(f"B{g}", "a) Años jugados =", negrita=True)
lb.f(f"C{g}", f'=RiskOutput("Años jugados")+COUNTIF(C{f0}:C{fN},"<4")', celda_texto=f"C{g + 1}")
lb.v(f"D{g}", "b) Promedio por año jugado =", negrita=True)
lb.f(f"E{g}", f"=SUM(E{f0}:E{fN})/C{g}", celda_texto=f"E{g + 1}", formato='"$"#,##0')
lb.v(f"F{g}", "c) Ganado =", negrita=True)
lb.f(f"G{g}", f'=RiskOutput("Ganado")+SUM(E{f0}:E{fN})', celda_texto=f"G{g + 1}", formato='"$"#,##0')

# resultados (estimados) + columna @RISK viva, y conclusión
lb.estadisticas("I26", r_anos, formato="0.00", salida=f"C{g}")
lb.estadisticas("M26", r_ganado, formato='"$"#,##0', salida=f"G{g}")
lb.conclusion(f"B{g + 3}",
              f"a) En promedio el jugador pasa {r_anos['Mean']:.2f} años en el equipo antes de retirarse "
              f"(lo más común es 1 año; mediana {r_anos['Median']:.0f}). "
              f"b) Su salario anual promedio es de ${prom_anual.mean():,.0f}. "
              f"c) En total gana en promedio ${r_ganado['Mean']:,.0f} (desv. est. ${r_ganado['Std Dev']:,.0f}, "
              f"mínimo ${r_ganado['Minimum']:,.0f}, máximo ${r_ganado['Maximum']:,.0f}).",
              ancho_cols=6, alto_filas=6)
lb.anchos(13, {"B": 16, "D": 16})
print("Excel:", lb.guardar(str(salida_dir / "Ejercicio26.xlsx")))
