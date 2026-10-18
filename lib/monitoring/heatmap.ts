export type HeatmapCell = {
  dayKey: string;
  dayLabel: string;
  hour: number;
  ok: number;
  fail: number;
  latencySum: number;
  latencyN: number;
  uptimePct: number | null;
  avgLatencyMs: number | null;
};

export type HeatmapResultPoint = {
  status: string;
  latencyMs: number | null;
  checkedAt: Date | string;
};

/** Agrupa CheckResults em células dia × hora (timezone local do servidor / America/Sao_Paulo via offset do Date). */
export function buildUptimeHeatmap(
  results: HeatmapResultPoint[],
  days = 14,
): { days: string[]; hours: number[]; cells: Map<string, HeatmapCell> } {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayKeys: string[] = [];
  const cells = new Map<string, HeatmapCell>();

  const now = new Date();
  for (let d = days - 1; d >= 0; d--) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - d);
    const dayKey = dayKeyFromDate(day);
    dayKeys.push(dayKey);
    for (const hour of hours) {
      const key = `${dayKey}|${hour}`;
      cells.set(key, {
        dayKey,
        dayLabel: formatDayLabel(day),
        hour,
        ok: 0,
        fail: 0,
        latencySum: 0,
        latencyN: 0,
        uptimePct: null,
        avgLatencyMs: null,
      });
    }
  }

  const windowStart = new Date(now);
  windowStart.setHours(0, 0, 0, 0);
  windowStart.setDate(windowStart.getDate() - (days - 1));

  for (const r of results) {
    const at = typeof r.checkedAt === "string" ? new Date(r.checkedAt) : r.checkedAt;
    if (at < windowStart) continue;
    const dayKey = dayKeyFromDate(at);
    const hour = at.getHours();
    const key = `${dayKey}|${hour}`;
    const cell = cells.get(key);
    if (!cell) continue;
    if (r.status === "ok") cell.ok += 1;
    else cell.fail += 1;
    if (r.latencyMs != null) {
      cell.latencySum += r.latencyMs;
      cell.latencyN += 1;
    }
  }

  for (const cell of cells.values()) {
    const total = cell.ok + cell.fail;
    cell.uptimePct = total ? Math.round((cell.ok / total) * 1000) / 10 : null;
    cell.avgLatencyMs = cell.latencyN
      ? Math.round(cell.latencySum / cell.latencyN)
      : null;
  }

  return { days: dayKeys, hours, cells };
}

function dayKeyFromDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export function cellTone(cell: HeatmapCell | undefined): "empty" | "ok" | "warn" | "down" {
  if (!cell || cell.uptimePct == null) return "empty";
  if (cell.uptimePct >= 99) return "ok";
  if (cell.uptimePct >= 90) return "warn";
  return "down";
}
