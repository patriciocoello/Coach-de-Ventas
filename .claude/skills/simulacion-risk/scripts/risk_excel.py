"""Construye un .xlsx con el mismo estilo que los ejercicios resueltos con @RISK
(Ej. 21-26): enunciado arriba, tablas de datos, fila FORMULATEXT encima de cada
fórmula clave, tabla de simulación, salidas RiskOutput, resultados y conclusión.

Ejemplo mínimo:

    import sys; sys.path.insert(0, "<ruta-del-skill>/scripts")
    from risk_excel import LibroRisk
    lb = LibroRisk("Ej. 27 ...enunciado completo...", iteraciones=1000)
    ws = lb.ws
    lb.f("C14", "=RiskNormal(1000,200)", mostrar_formula=True)
    lb.f("H14", '=RiskOutput("VPN")+NPV(0.1,C14:G14)', mostrar_formula=True)
    lb.estadisticas("J14", resumen_dict)     # tabla Statistics de @RISK
    lb.conclusion("B30", "a) El VPN promedio es ...")
    lb.guardar("Ejercicio27.xlsx")

Estilos exportados: AMARILLO (resaltar la fila IDEAL), DINERO (formato contable $), y
AZUL/VERDE/ROJO/BORDE/NEGRITA/GRIS que ahora son neutros (estilo sencillo). Úsalos en
vez de copiar estilos entre celdas: `ws[x].font = ws[y].font` falla en openpyxl).

Reglas técnicas que resuelve por ti:
- Escribe las funciones de @RISK con el prefijo _xll. (así las guarda Excel cuando
  @RISK está cargado; sin el prefijo aparecen como #NAME?).
- FORMULATEXT se guarda como _xlfn.FORMULATEXT.
- Las fórmulas se escriben en inglés con comas; Excel en español las mostrará con ';'.
- Fija iteraciones / simulaciones en los nombres ocultos que lee @RISK.
"""
from __future__ import annotations

import re
from typing import Sequence

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.utils.cell import coordinate_from_string, column_index_from_string
from openpyxl.workbook.defined_name import DefinedName

# Estilo SENCILLO, como los Excel del usuario: sin colores, sin negritas, sin bordes.
# Lo único con color es la fila ganadora de la tabla de Simtable (amarillo FFFF00)
# con la palabra "IDEAL" al lado. No lo hagas "profesional": así lo entrega él.
SIN_RELLENO = PatternFill()
AZUL = VERDE = ROJO = SIN_RELLENO
AMARILLO = PatternFill("solid", fgColor="FFFF00")
BORDE = Border()
NEGRITA = Font()
GRIS = Font()
FINO = Side()
# Formato contable en dólares que usa el usuario para dinero
DINERO = '_-[$$-409]* #,##0.00_ ;_-[$$-409]* \\-#,##0.00\\ ;_-[$$-409]* "-"??_ ;_-@_ '

_RISK_FN = re.compile(r"(?<![\w.])(Risk[A-Z]\w*)\(")
_XLFN = re.compile(r"(?<![\w.])(FORMULATEXT|IFS|SWITCH|CONCAT|TEXTJOIN|MAXIFS|MINIFS)\(")


def a_excel(formula: str) -> str:
    """Convierte una fórmula 'humana' a la forma en que Excel la guarda."""
    if not formula.startswith("="):
        formula = "=" + formula
    formula = _RISK_FN.sub(r"_xll.\1(", formula)
    formula = _XLFN.sub(r"_xlfn.\1(", formula)
    return formula


def desplazar(celda: str, filas=0, cols=0) -> str:
    col, fila = coordinate_from_string(celda)
    return f"{get_column_letter(column_index_from_string(col) + cols)}{fila + filas}"


class LibroRisk:
    def __init__(self, enunciado: str, iteraciones: int = 1000, simulaciones: int = 1,
                 hoja: str = "Sheet1", rango_enunciado: str = "A1:P8"):
        self.wb = Workbook()
        self.ws = self.wb.active
        self.ws.title = hoja
        self.ws.sheet_view.showGridLines = True
        self.configurar_simulacion(iteraciones, simulaciones)
        if enunciado:
            self.enunciado(enunciado, rango_enunciado)

    # ------------------------------------------------------------ ajustes @RISK
    def configurar_simulacion(self, iteraciones: int, simulaciones: int = 1):
        """Iteraciones = número de experimentos del enunciado.
        Simulaciones = número de valores de RiskSimtable (1 si no hay)."""
        ajustes = {
            "RiskHasSettings": "8",
            "RiskNumIterations": str(int(iteraciones)),
            "RiskNumSimulations": str(int(simulaciones)),
            "RiskSamplingType": "3",
            "RiskUseFixedSeed": "FALSE",
            "RiskFixedSeed": "1",
            "RiskUseDifferentSeedForEachSim": "FALSE",
            "RiskStandardRecalc": "2",
            "RiskCollectDistributionSamples": "2",
        }
        for nombre, valor in ajustes.items():
            if nombre in self.wb.defined_names:
                del self.wb.defined_names[nombre]
            self.wb.defined_names[nombre] = DefinedName(nombre, attr_text=valor, hidden=True)
        self.iteraciones, self.simulaciones = iteraciones, simulaciones

    # ------------------------------------------------------------ escritura
    def enunciado(self, texto: str, rango: str = "A1:P8"):
        """Equivale al cuadro de texto con el enunciado en la parte superior."""
        self.ws.merge_cells(rango)
        c = self.ws[rango.split(":")[0]]
        c.value = texto
        c.alignment = Alignment(wrap_text=True, vertical="top")

    def _celda(self, celda: str):
        for rango in self.ws.merged_cells.ranges:
            if celda in rango and celda != rango.start_cell.coordinate:
                raise ValueError(f"{celda} está dentro del rango combinado {rango} (enunciado/conclusión). "
                                 "Empieza el modelo debajo (fila 10+) o usa LibroRisk(..., rango_enunciado=...).")
        return self.ws[celda]

    def v(self, celda: str, valor, negrita=False, relleno=None, formato=None):
        c = self._celda(celda)
        c.value = valor
        if negrita:
            c.font = NEGRITA
        if relleno:
            c.fill = relleno
        if formato:
            c.number_format = formato
        return c

    def f(self, celda: str, formula: str, mostrar_formula=False, formato=None,
          celda_texto: str | None = None):
        """Escribe una fórmula. Con mostrar_formula=True pone =FORMULATEXT(celda)
        una fila arriba (o en celda_texto), como en todos los ejercicios."""
        c = self._celda(celda)
        c.value = a_excel(formula)
        if formato:
            c.number_format = formato
        if mostrar_formula or celda_texto:
            destino = celda_texto or desplazar(celda, filas=-1)
            t = self._celda(destino)
            t.value = f"=_xlfn.FORMULATEXT({celda})"
            t.font = GRIS
        return c

    def tabla(self, esquina: str, encabezados: Sequence[str], filas: Sequence[Sequence] = (),
              titulo: str | None = None, formato=None):
        """Tabla de datos con encabezados en negrita y bordes. Los valores que
        empiezan con '=' se escriben como fórmula."""
        fila0 = esquina
        if titulo:
            self.v(esquina, titulo, negrita=True)
            fila0 = desplazar(esquina, filas=1)
        for j, h in enumerate(encabezados):
            c = self.v(desplazar(fila0, cols=j), h, negrita=True, relleno=VERDE)
            c.border = BORDE
            c.alignment = Alignment(wrap_text=True, horizontal="center")
        for i, fila in enumerate(filas, start=1):
            for j, val in enumerate(fila):
                ref = desplazar(fila0, filas=i, cols=j)
                if isinstance(val, str) and val.startswith("="):
                    self.f(ref, val, formato=formato)
                else:
                    self.v(ref, val, formato=formato)
                self.ws[ref].border = BORDE
        return desplazar(fila0, filas=1)  # primera celda de datos

    def serie(self, celda_inicio: str, n: int, plantilla: str, formato=None):
        """Rellena n filas hacia abajo con una fórmula plantilla donde {r} es la
        fila actual y {p} la anterior. Ej: plantilla='=D{p}' para 'Nivel inicial'."""
        col, fila = coordinate_from_string(celda_inicio)
        for k in range(n):
            r = fila + k
            self.f(f"{col}{r}", plantilla.format(r=r, p=r - 1), formato=formato)

    def media(self, celda: str, valor, etiqueta="Mean", formato=DINERO):
        """Como los ejercicios: etiqueta 'Mean' y el valor pegado a la derecha."""
        self.v(celda, etiqueta, negrita=True)
        self.v(desplazar(celda, cols=1), valor, formato=formato)

    def estadisticas(self, celda: str, r: dict, formato='#,##0.00', con_percentiles=True,
                     salida: str | None = None,
                     nota="Columna 2: estimado con réplica en Python. Columna 3 (si existe): se llena sola con @RISK al correr la simulación."):
        """Pega la tabla 'Statistics' de @RISK (como Ej. 26, I43:J82).
        Si se da `salida` (celda con RiskOutput), agrega una 3a columna con
        RiskMean/RiskStdDev/... de esa celda, que @RISK actualiza al simular."""
        risk_fn = {"Minimum": "RiskMin({s})", "Maximum": "RiskMax({s})", "Mean": "RiskMean({s})",
                   "Mode": "RiskMode({s})", "Median": "RiskPercentile({s},0.5)",
                   "Std Dev": "RiskStdDev({s})", "Skewness": "RiskSkewness({s})",
                   "Kurtosis": "RiskKurtosis({s})", "Left X": "RiskPercentile({s},0.05)",
                   "Right X": "RiskPercentile({s},0.95)"}
        orden = ["Minimum", "Maximum", "Mean", "90% CI", "Mode", "Median", "Std Dev",
                 "Skewness", "Kurtosis", "Values", "Errors", "Filtered", "Left X",
                 "Left P", "Right X", "Right P", "Dif. X", "Dif. P"]
        self.v(celda, "Statistics", negrita=True)
        self.v(desplazar(celda, cols=1), r.get("Nombre", ""))
        fila = 1
        for k in orden:
            et = "  90% CI" if k == "90% CI" else k
            self.v(desplazar(celda, filas=fila), et)
            val = r[k]
            fmt = formato
            if k in ("Skewness", "Kurtosis"):
                fmt = "0.0000"
            elif k in ("Values", "Errors", "Filtered"):
                fmt = "0"
            elif k in ("Left P", "Right P", "Dif. P"):
                fmt = "0.0%"
            self.v(desplazar(celda, filas=fila, cols=1), val, formato=fmt)
            if salida and k in risk_fn:
                self.f(desplazar(celda, filas=fila, cols=2), "=" + risk_fn[k].format(s=salida), formato=fmt)
            fila += 1
        if salida:
            self.v(desplazar(celda, cols=2), "@RISK", negrita=True)
        if con_percentiles:
            for q, val in r["Percentiles"].items():
                self.v(desplazar(celda, filas=fila), q, formato="0.0%")
                self.v(desplazar(celda, filas=fila, cols=1), val, formato=formato)
                if salida:
                    self.f(desplazar(celda, filas=fila, cols=2), f"=RiskPercentile({salida},{q})", formato=formato)
                fila += 1
        if nota:
            self.v(desplazar(celda, filas=fila), nota).font = GRIS
        return desplazar(celda, filas=fila + 1)

    def tabla_simtable(self, esquina: str, valores: Sequence, encabezado_x: str,
                       encabezado_y: str, resultados=None, paso: float | None = None,
                       formato_y=DINERO, salida: str | None = None,
                       resaltar_mejor: str | None = "max"):
        """Tabla 'Posibles X | Promedio Y' que alimenta RiskSimtable (Ej. 7, 11, 24).
        - `paso`: la columna X se escribe como =celda_anterior+paso.
        - `resultados`: lista de medias, o dict {encabezado: lista} para varias
          columnas (p. ej. {"Promedio (500 exp.)": [...], "Promedio (20,000 exp.)": [...]}).
          La primera columna es la que decide la fila resaltada.
        - `salida` (celda RiskOutput): agrega columna '(@RISK)' con =RiskMean(salida,k),
          la media de la simulación k, que se llena sola al simular.
        - `resaltar_mejor`: "max", "min" o None.
        Devuelve el rango de X (para =RiskSimtable(rango))."""
        if resultados is not None and not isinstance(resultados, dict):
            resultados = {encabezado_y: list(resultados)}
        cols = list(resultados.items()) if resultados else []
        self.v(esquina, encabezado_x, negrita=True, relleno=VERDE)
        for j, (enc, _) in enumerate(cols):
            self.v(desplazar(esquina, cols=1 + j), enc, negrita=True, relleno=VERDE)
        col_risk = 1 + len(cols)
        if salida:
            self.v(desplazar(esquina, cols=col_risk), f"{encabezado_y} (@RISK)", negrita=True, relleno=VERDE)
        primera = desplazar(esquina, filas=1)
        for i, x in enumerate(valores):
            ref = desplazar(primera, filas=i)
            if paso is not None and i > 0:
                self.f(ref, f"={desplazar(ref, filas=-1)}+{paso}")
            else:
                self.v(ref, x)
            for j, (_, vals) in enumerate(cols):
                self.v(desplazar(ref, cols=1 + j), vals[i], formato=formato_y)
            if salida:
                self.f(desplazar(ref, cols=col_risk), f"=RiskMean({salida},{i + 1})", formato=formato_y)
        if cols and resaltar_mejor:
            vals = cols[0][1]
            k = (max if resaltar_mejor == "max" else min)(range(len(vals)), key=lambda i: vals[i])
            for j in range(1 + len(cols)):
                self.resaltar(desplazar(primera, filas=k, cols=j))
            self.v(desplazar(primera, filas=k, cols=1 + len(cols) + (1 if salida else 0)), "IDEAL")
        ultima = desplazar(primera, filas=len(valores) - 1)
        return f"{primera}:{ultima}"

    def fila_formulatext(self, fila_texto: int, fila_datos: int, columnas: Sequence[str]):
        """Pone =FORMULATEXT(col{fila_datos}) en col{fila_texto} para cada columna,
        p. ej. la fila 13 de Ej. 24 (FORMULATEXT -> años -> encabezados -> datos)."""
        for col in columnas:
            t = self.ws[f"{col}{fila_texto}"]
            t.value = f"=_xlfn.FORMULATEXT({col}{fila_datos})"
            t.font = GRIS

    def resaltar(self, celda: str, relleno=AMARILLO):
        self.ws[celda].fill = relleno

    def conclusion(self, celda: str, texto: str, ancho_cols=8, alto_filas=4):
        """Conclusión en texto (equivale al cuadro de texto 'A) La capacidad...').
        Si texto empieza con '=' se escribe como fórmula concatenada (estilo Ej. 25)."""
        fin = desplazar(celda, filas=alto_filas - 1, cols=ancho_cols - 1)
        self.ws.merge_cells(f"{celda}:{fin}")
        c = self.ws[celda]
        c.value = a_excel(texto) if texto.startswith("=") else texto
        c.alignment = Alignment(wrap_text=True, vertical="top")

    def anchos(self, ancho=14, especiales: dict | None = None):
        for i in range(1, self.ws.max_column + 1):
            self.ws.column_dimensions[get_column_letter(i)].width = ancho
        for col, w in (especiales or {}).items():
            self.ws.column_dimensions[col].width = w

    def imagen(self, celda: str, ruta_png: str):
        from openpyxl.drawing.image import Image
        self.ws.add_image(Image(ruta_png), celda)

    def guardar(self, ruta: str):
        self.wb.save(ruta)
        return ruta
