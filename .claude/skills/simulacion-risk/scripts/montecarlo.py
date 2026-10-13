"""Réplica en Python (numpy) de lo que hace @RISK, para obtener las respuestas
numéricas de un ejercicio antes de que el usuario corra la simulación en Excel.

Uso típico (desde el script del ejercicio):

    import sys; sys.path.insert(0, "<ruta-del-skill>/scripts")
    from montecarlo import *
    rng = np.random.default_rng(2026)
    ...
    print(formatear(resumen(muestras, "Años jugados")))

Todas las funciones siguen las convenciones de Excel / @RISK:
- npv(tasa, flujos) descuenta el PRIMER flujo un periodo (igual que NPV de Excel).
- resumen() devuelve las mismas estadísticas que la ventana "Statistics" de @RISK
  (curtosis NO en exceso: una normal da 3).
"""
from __future__ import annotations

import math
from typing import Callable, Iterable, Sequence

import numpy as np

PERCENTILES_RISK = [0.01, 0.025, 0.05, 0.1, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45,
                    0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.9, 0.95, 0.975, 0.99]


# ---------------------------------------------------------------- distribuciones
def discreta(rng, valores: Sequence, probs: Sequence[float], size=None):
    """Equivalente a RiskDiscrete(valores, probs)."""
    p = np.asarray(probs, dtype=float)
    return rng.choice(np.asarray(valores), size=size, p=p / p.sum())


def discreta_acumulada(u, valores: Sequence, probs: Sequence[float]):
    """Equivalente al IF anidado con RAND() y la columna de probabilidad acumulada
    (estilo Ej. 7 / Ej. 11): devuelve el primer valor cuya acumulada supera u."""
    acum = np.cumsum(probs)
    idx = np.searchsorted(acum, u, side="right")
    return np.asarray(valores)[np.minimum(idx, len(valores) - 1)]


def triang(rng, minimo, mas_probable, maximo, size=None):
    """RiskTriang(min, más probable, max)."""
    return rng.triangular(minimo, mas_probable, maximo, size)


# ---------------------------------------------------------------- finanzas
def npv(tasa: float, flujos) -> np.ndarray:
    """NPV de Excel. `flujos` puede ser lista de escalares o de arrays (una
    columna por periodo, cada array con una muestra por iteración)."""
    total = 0.0
    for t, f in enumerate(flujos, start=1):
        total = total + np.asarray(f, dtype=float) / (1 + tasa) ** t
    return total


# ---------------------------------------------------------------- cadenas de Markov
def markov(rng, P, estado_inicial: int, periodos: int, iteraciones: int):
    """Simula una cadena de Markov como la tabla Año | Nivel inicial | Nivel final.

    P: matriz de transición (filas = estado actual, columnas = estado siguiente),
       estados codificados 1..n como en los Excel (Código 1, 2, 3, ...).
    Devuelve una matriz (iteraciones x periodos+1) con el estado al INICIO de
    cada periodo; la última columna es el nivel final del último periodo.
    """
    P = np.asarray(P, dtype=float)
    n = P.shape[0]
    acum = np.cumsum(P, axis=1)
    est = np.empty((iteraciones, periodos + 1), dtype=int)
    est[:, 0] = estado_inicial
    for t in range(periodos):
        u = rng.random(iteraciones)
        filas = acum[est[:, t] - 1]
        est[:, t + 1] = np.minimum((u[:, None] >= filas).sum(axis=1), n - 1) + 1
    return est


# ---------------------------------------------------------------- RiskSimtable
def simtable(valores: Iterable, modelo: Callable, iteraciones: int,
             estadistico=np.mean, semilla: int | None = 12345):
    """Corre una 'simulación' por cada valor (como RiskSimtable + N simulaciones)
    y devuelve lista de (valor, estadístico_de_la_salida).

    `modelo(valor, iteraciones, rng)` debe devolver el array de la salida.
    Con `semilla` (por defecto) cada valor recibe un rng con LA MISMA semilla:
    números aleatorios comunes, igual que @RISK con "misma semilla en cada
    simulación". Así la tabla compara los valores con la misma muestra de
    demanda/ruido y es mucho menos ruidosa. semilla=None -> muestras independientes.
    """
    res = []
    for v in valores:
        rng = np.random.default_rng(semilla)
        res.append((v, float(estadistico(modelo(v, iteraciones, rng)))))
    return res


def mejor(resultados, maximizar=True):
    """Fila ganadora de una tabla de simtable (valor, media)."""
    return (max if maximizar else min)(resultados, key=lambda r: r[1])


# ---------------------------------------------------------------- estadísticas
def _moda(x: np.ndarray):
    # Para salidas continuas es el centro del bin más alto del histograma; la
    # Mode de @RISK se calcula distinto y puede diferir bastante: no la enfatices.
    vals, cnt = np.unique(x, return_counts=True)
    if len(vals) <= max(50, len(x) // 2):           # salida discreta (valores repetidos)
        return float(vals[np.argmax(cnt)])
    hist, bordes = np.histogram(x, bins="auto")      # salida continua
    i = int(np.argmax(hist))
    return float((bordes[i] + bordes[i + 1]) / 2)


def resumen(x, nombre: str = "Salida", left_p=0.05, right_p=0.95) -> dict:
    """Estadísticas idénticas en forma a la tabla Statistics de @RISK."""
    x = np.asarray(x, dtype=float)
    n = len(x)
    media = float(x.mean())
    sd = float(x.std(ddof=1)) if n > 1 else 0.0
    m2 = float(((x - media) ** 2).mean())
    sesgo = float(((x - media) ** 3).mean() / m2 ** 1.5) if m2 > 0 else 0.0
    curt = float(((x - media) ** 4).mean() / m2 ** 2) if m2 > 0 else 0.0
    lx, rx = (float(np.quantile(x, q)) for q in (left_p, right_p))
    return {
        "Nombre": nombre,
        "Minimum": float(x.min()), "Maximum": float(x.max()),
        "Mean": media, "90% CI": 1.6449 * sd / math.sqrt(n),
        "Mode": _moda(x), "Median": float(np.median(x)),
        "Std Dev": sd, "Skewness": sesgo, "Kurtosis": curt,
        "Values": n, "Errors": 0, "Filtered": 0,
        "Left X": lx, "Left P": left_p, "Right X": rx, "Right P": right_p,
        "Dif. X": rx - lx, "Dif. P": right_p - left_p,
        "Percentiles": {q: float(np.quantile(x, q)) for q in PERCENTILES_RISK},
    }


def formatear(r: dict, dinero=False) -> str:
    f = (lambda v: f"${v:,.2f}") if dinero else (lambda v: f"{v:,.4f}")
    claves = ["Minimum", "Maximum", "Mean", "90% CI", "Mode", "Median",
              "Std Dev", "Skewness", "Kurtosis", "Values", "Left X", "Right X"]
    lineas = [f"== {r['Nombre']} =="]
    for k in claves:
        v = r[k]
        if k in ("Skewness", "Kurtosis"):
            lineas.append(f"{k:>9}: {v:.4f}")
        elif k == "Values":
            lineas.append(f"{k:>9}: {v}")
        elif k == "90% CI":
            lineas.append(f"{k:>9}: ± {f(v)}")
        else:
            lineas.append(f"{k:>9}: {f(v)}")
    return "\n".join(lineas)


def frecuencias(x) -> dict:
    """Distribución de una salida discreta (p. ej. nivel final de Markov)."""
    vals, cnt = np.unique(np.asarray(x), return_counts=True)
    return {v.item(): c / len(x) for v, c in zip(vals, cnt)}
