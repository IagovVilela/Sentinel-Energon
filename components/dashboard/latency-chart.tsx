"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function LatencyChart({
  data,
}: {
  data: Array<{ t: string; ms: number; check: string }>;
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted py-8 text-center">
        Sem dados de latência nas últimas 24h.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.t).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid stroke="#1E2340" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} />
          <YAxis stroke="#94A3B8" fontSize={11} unit="ms" />
          <Tooltip
            contentStyle={{
              background: "#12152B",
              border: "1px solid #1E2340",
              borderRadius: 8,
            }}
          />
          <Line
            type="monotone"
            dataKey="ms"
            stroke="#22D3EE"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
