"""PLANTILLA: ejercicio estilo "Análisis de datos > Generación de números aleatorios"
(Ej. 17, 18, 19), SIN @RISK. Aquí cada FILA es un experimento (500 filas = 500
experimentos) y los números aleatorios son VALORES fijos que genera la herramienta
de Excel, no fórmulas. Las demás columnas sí son fórmulas (IF, sumas) y al final
van AVERAGE / COUNTIF.

    python ejemplo_toolpak_muestreo.py <carpeta_salida>

Reproduce el plan A del Ej. 18 (muestra 5, rechazo si hay 1 o más defectuosos).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from montecarlo import np, discreta  # noqa: E402
from risk_excel import LibroRisk, DINERO  # noqa: E402

salida_dir = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
N = 500
n_muestra, p, rechazo_si = 5, 0.15, 1
defectos_lote, probs_lote = [5, 16, 25, 46, 54], [0.2] * 5
rng = np.random.default_rng(18)

# valores que en Excel saldrían de Análisis de datos (Binomial y Discreta)
muestra = rng.binomial(n_muestra, p, N)
lote = discreta(rng, defectos_lote, probs_lote, N)

lb = LibroRisk("Ej. 18 Se quiere determinar cuál plan de muestreo es más económico ... (enunciado)",
               iteraciones=1, rango_enunciado="B2:L15")   # sin @RISK: iteraciones no importa
ws = lb.ws
# tabla de datos del enunciado
lb.v("N5", "No. de defectuosos"); lb.v("O5", "Probabilidad")
for i, (v, pr) in enumerate(zip(defectos_lote, probs_lote)):
    lb.v(f"N{6 + i}", v); lb.v(f"O{6 + i}", pr)

f0 = 19
# fila 17: cómo se generó / qué fórmula lleva cada columna (texto, como el usuario)
lb.v("B17", "A)")
lb.v("C17", f"data-dataan.rand.Gen.~B({n_muestra},{p})")
lb.v("D17", f'IF(C{f0}>={rechazo_si};"Rehazo";"Acepto")')
lb.v("E17", "data-dataan.rand.Gen.~D($N$6:$O$10)")
lb.v("F17", f'IF(D{f0}="Acepto";E{f0}*100;0)')
lb.v("G17", f"120+{n_muestra}*(20)")
lb.v("H17", f"F{f0}+G{f0}")
for j, h in enumerate(["Experimento", "Piezas defectuosas en muestra", "Decisión",
                       "Piezas defectuosas en lote", "Costo de remplazar adentro del proceso",
                       "Costo de inspección", "Costo Total"]):
    lb.v(f"{'BCDEFGH'[j]}18", h)
for i in range(N):
    r = f0 + i
    lb.v(f"B{r}", i + 1)
    lb.v(f"C{r}", int(muestra[i]))                       # valor fijo (ToolPak)
    lb.f(f"D{r}", f'=IF(C{r}>={rechazo_si},"Rehazo","Acepto")')
    lb.v(f"E{r}", int(lote[i]))                          # valor fijo (ToolPak)
    lb.f(f"F{r}", f'=IF(D{r}="Acepto",E{r}*100,0)', formato=DINERO)
    lb.f(f"G{r}", f"=120+{n_muestra}*(20)", formato=DINERO)
    lb.f(f"H{r}", f"=F{r}+G{r}", formato=DINERO)
fin = f0 + N - 1
lb.v(f"F{fin + 2}", f"AVERAGE(H{f0}:H{fin})")
lb.v(f"G{fin + 2}", "Promedio")
lb.f(f"H{fin + 2}", f"=AVERAGE(H{f0}:H{fin})", formato=DINERO)

costo = np.where(muestra >= rechazo_si, 0, lote * 100) + 120 + 20 * n_muestra
print(f"Costo promedio plan A ({N} exp.): ${costo.mean():,.2f}")
lb.conclusion("J17", f"A) Costo promedio por lote ${costo.mean():,.0f}", ancho_cols=5, alto_filas=2)
lb.anchos(14, {"B": 12})
print("Excel:", lb.guardar(str(salida_dir / "Ejercicio18_plantilla.xlsx")))
