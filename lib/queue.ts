import { Queue } from "bullmq";
import IORedis from "ioredis";

let connection: IORedis | null = null;
let checkQueue: Queue | null = null;

export function getRedis() {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

export function getCheckQueue() {
  if (!checkQueue) {
    checkQueue = new Queue("health-checks", { connection: getRedis() });
  }
  return checkQueue;
}

export async function enqueueCheckNow(healthCheckId: string) {
  const queue = getCheckQueue();
  await queue.add(
    "run-check",
    { healthCheckId },
    { removeOnComplete: 100, removeOnFail: 50 },
  );
}

export async function scheduleRecurringChecks() {
  const queue = getCheckQueue();

  // BullMQ v5+/v6: upsertJobScheduler for recurring work
  await queue.upsertJobScheduler(
    "schedule-due-checks",
    { every: 30_000 },
    {
      name: "schedule-due",
      data: {},
      opts: { removeOnComplete: true },
    },
  );

  await queue.upsertJobScheduler(
    "expiry-alerts-hourly",
    { every: 60 * 60 * 1000 },
    {
      name: "expiry-alerts",
      data: {},
      opts: { removeOnComplete: true },
    },
  );

  await queue.upsertJobScheduler(
    "check-result-retention",
    { every: 24 * 60 * 60 * 1000 },
    {
      name: "retention",
      data: {},
      opts: { removeOnComplete: true },
    },
  );
}
