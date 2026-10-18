import { describe, expect, it } from "vitest";

/**
 * Pure state-machine for incident open/close used by the monitor.
 * Mirrors lib/monitoring/runner.ts anti-noise rules.
 */
function nextIncidentState(opts: {
  consecutiveFailsBefore: number;
  failureThreshold: number;
  checkOk: boolean;
  openIncident: boolean;
}): { consecutiveFails: number; openIncident: boolean; opened: boolean; closed: boolean } {
  let consecutiveFails = opts.consecutiveFailsBefore;
  if (opts.checkOk) consecutiveFails = 0;
  else consecutiveFails += 1;

  const wasDown = opts.consecutiveFailsBefore >= opts.failureThreshold;
  const isDown = consecutiveFails >= opts.failureThreshold;

  let openIncident = opts.openIncident;
  let opened = false;
  let closed = false;

  if (isDown && !wasDown) {
    openIncident = true;
    opened = true;
  }
  if (!isDown && wasDown && opts.openIncident) {
    openIncident = false;
    closed = true;
  }

  return { consecutiveFails, openIncident, opened, closed };
}

describe("incident state transitions", () => {
  it("does not open incident on first failure (threshold 2)", () => {
    const r = nextIncidentState({
      consecutiveFailsBefore: 0,
      failureThreshold: 2,
      checkOk: false,
      openIncident: false,
    });
    expect(r.opened).toBe(false);
    expect(r.consecutiveFails).toBe(1);
  });

  it("opens incident after N consecutive failures", () => {
    const r = nextIncidentState({
      consecutiveFailsBefore: 1,
      failureThreshold: 2,
      checkOk: false,
      openIncident: false,
    });
    expect(r.opened).toBe(true);
    expect(r.openIncident).toBe(true);
    expect(r.consecutiveFails).toBe(2);
  });

  it("closes incident on recovery", () => {
    const r = nextIncidentState({
      consecutiveFailsBefore: 2,
      failureThreshold: 2,
      checkOk: true,
      openIncident: true,
    });
    expect(r.closed).toBe(true);
    expect(r.openIncident).toBe(false);
    expect(r.consecutiveFails).toBe(0);
  });
});
