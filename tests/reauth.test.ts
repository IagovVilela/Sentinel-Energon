import { describe, expect, it } from "vitest";

const REAUTH_MINUTES = 5;

function isReauthFresh(reauthAt: Date | null, now = new Date()): boolean {
  if (!reauthAt) return false;
  const deadline = new Date(reauthAt);
  deadline.setMinutes(deadline.getMinutes() + REAUTH_MINUTES);
  return deadline > now;
}

describe("credential reveal reauth window", () => {
  it("rejects when never reauthed", () => {
    expect(isReauthFresh(null)).toBe(false);
  });

  it("accepts within 5 minutes", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const reauthAt = new Date("2026-01-01T11:57:00Z");
    expect(isReauthFresh(reauthAt, now)).toBe(true);
  });

  it("rejects after 5 minutes", () => {
    const now = new Date("2026-01-01T12:06:00Z");
    const reauthAt = new Date("2026-01-01T12:00:00Z");
    expect(isReauthFresh(reauthAt, now)).toBe(false);
  });
});
