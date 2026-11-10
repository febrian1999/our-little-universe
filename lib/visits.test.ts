import { describe, expect, it } from "vitest";
import { normalizeVisitPath, sessionHashFor } from "./visits";

describe("normalizeVisitPath", () => {
  it("membuang query dan hash", () => {
    expect(normalizeVisitPath("/our-little-universe?x=1#a")).toBe(
      "/our-little-universe",
    );
  });

  it("meredaksi kode undangan", () => {
    expect(normalizeVisitPath("/invite/DEMO2026")).toBe("/invite/[redacted]");
    expect(normalizeVisitPath("/invite/DEMO2026?next=/a")).toBe(
      "/invite/[redacted]",
    );
  });

  it("mengembalikan null untuk nilai kosong", () => {
    expect(normalizeVisitPath(null)).toBeNull();
    expect(normalizeVisitPath(undefined)).toBeNull();
    expect(normalizeVisitPath("")).toBeNull();
  });
});

describe("sessionHashFor", () => {
  it("stabil dalam satu hari dan berubah esok hari", () => {
    const pagi = new Date("2026-10-31T08:00:00+07:00");
    const malam = new Date("2026-10-31T23:00:00+07:00");
    const besok = new Date("2026-11-01T08:00:00+07:00");

    const hash = sessionHashFor("user-1", pagi);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(sessionHashFor("user-1", malam)).toBe(hash);
    expect(sessionHashFor("user-2", pagi)).not.toBe(hash);
    expect(sessionHashFor("user-1", besok)).not.toBe(hash);
  });
});
