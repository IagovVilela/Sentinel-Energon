import { Worker } from "bullmq";
import { getRedis, scheduleRecurringChecks } from "../lib/queue";
import { runDueChecks, runHealthCheck } from "../lib/monitoring/runner";
import {
  processExpiryAlerts,
  runRetention,
} from "../lib/monitoring/notify";

async function main() {
  console.log("[worker] Energon Sentinel monitor starting…");

  await scheduleRecurringChecks();

  const worker = new Worker(
    "health-checks",
    async (job) => {
      switch (job.name) {
        case "run-check": {
          const id = job.data.healthCheckId as string;
          return runHealthCheck(id);
        }
        case "schedule-due":
          return { ran: await runDueChecks() };
        case "expiry-alerts":
          await processExpiryAlerts();
          return { ok: true };
        case "retention":
          await runRetention();
          return { ok: true };
        default:
          console.warn("[worker] unknown job", job.name);
          return null;
      }
    },
    { connection: getRedis(), concurrency: 5 },
  );

  worker.on("failed", (job, err) => {
    console.error("[worker] job failed", job?.name, err.message);
  });

  worker.on("completed", (job) => {
    if (job.name !== "schedule-due") {
      console.log("[worker] completed", job.name);
    }
  });

  console.log("[worker] listening on queue health-checks");
}

main().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});
