import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/utils";

const map: Record<string, string> = {
  operational: "status-operational",
  degraded: "status-degraded",
  down: "status-down",
  unknown: "status-unknown",
  ok: "status-operational",
  fail: "status-down",
};

export function StatusDot({
  status,
  label,
  className,
}: {
  status: string;
  label?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("status-dot", map[status] || "status-unknown")} />
      {label !== false && (
        <span className="text-sm">{STATUS_LABELS[status] || status}</span>
      )}
    </span>
  );
}
