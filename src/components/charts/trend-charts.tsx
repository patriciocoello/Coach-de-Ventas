"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Paleta de gráficas: un solo tono (azul) para series únicas; la identidad la
// da el título de cada gráfica, no el color.
const SERIES = "#2a78d6";
const GRID = "#e6e5e1";
const AXIS = "#8a8984";

export interface TrendPoint {
  label: string; // fecha corta
  value: number;
  title?: string; // detalle para el tooltip
}

function ChartTooltip({ active, payload, unit }: { active?: boolean; payload?: { payload: TrendPoint }[]; unit: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold tabular-nums text-foreground">
        {p.value}
        {unit}
      </div>
      <div className="text-muted">{p.title ?? p.label}</div>
    </div>
  );
}

export function TrendChart({ data, height = 220, unit = "", max = 100 }: { data: TrendPoint[]; height?: number; unit?: string; max?: number }) {
  if (data.length < 2) {
    return <div className="flex items-center justify-center text-sm text-subtle" style={{ height }}>Necesitas al menos 2 simulaciones para ver la tendencia.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={20} />
        <YAxis domain={[0, max]} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
        <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: AXIS, strokeDasharray: "3 3" }} />
        <Line type="monotone" dataKey="value" stroke={SERIES} strokeWidth={2} dot={{ r: 4, fill: SERIES, stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
