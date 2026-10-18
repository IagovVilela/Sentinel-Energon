"use client";

import {
  buildUptimeHeatmap,
  cellTone,
  type HeatmapResultPoint,
} from "@/lib/monitoring/heatmap";

const TONE_CLASS = {
  empty: "bg-[#0d1024] border-card-border/40",
  ok: "bg-online/80 border-online/40",
  warn: "bg-degraded/70 border-degraded/40",
  down: "bg-down/80 border-down/40",
} as const;

export function UptimeHeatmap({
  results,
  days = 14,
}: {
  results: HeatmapResultPoint[];
  days?: number;
}) {
  const { days: dayKeys, hours, cells } = buildUptimeHeatmap(results, days);
  const labels = dayKeys.map((key) => {
    const sample = cells.get(`${key}|0`);
    return sample?.dayLabel ?? key;
  });

  return (
    <div className="space-y-3 overflow-x-auto">
      <p className="text-xs text-muted">
        Baseado em health checks (pings), não em tráfego de usuários. Cada célula
        é um horário nos últimos {days} dias.
      </p>
      <div className="min-w-[640px]">
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `72px repeat(${hours.length}, minmax(0, 1fr))`,
          }}
        >
          <div />
          {hours.map((h) => (
            <div
              key={h}
              className="text-[9px] text-muted text-center truncate"
              title={`${h}h`}
            >
              {h % 3 === 0 ? `${h}h` : ""}
            </div>
          ))}

          {dayKeys.map((dayKey, idx) => (
            <div key={dayKey} className="contents">
              <div className="text-[10px] text-muted pr-1 flex items-center truncate">
                {labels[idx]}
              </div>
              {hours.map((hour) => {
                const cell = cells.get(`${dayKey}|${hour}`);
                const tone = cellTone(cell);
                const title = cell
                  ? cell.uptimePct == null
                    ? `${cell.dayLabel} ${hour}h — sem dados`
                    : `${cell.dayLabel} ${hour}h — uptime ${cell.uptimePct}% · latência média ${cell.avgLatencyMs ?? "—"} ms · ${cell.ok} ok / ${cell.fail} falha`
                  : "Sem dados";
                return (
                  <div
                    key={`${dayKey}-${hour}`}
                    title={title}
                    className={`h-3.5 rounded-[2px] border ${TONE_CLASS[tone]}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-muted">
        <Legend swatch={TONE_CLASS.ok} label="≥ 99% uptime" />
        <Legend swatch={TONE_CLASS.warn} label="90–98%" />
        <Legend swatch={TONE_CLASS.down} label="< 90%" />
        <Legend swatch={TONE_CLASS.empty} label="Sem dados" />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-[2px] border ${swatch}`} />
      {label}
    </span>
  );
}
