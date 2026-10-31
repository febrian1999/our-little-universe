import { describe, expect, it } from "vitest";
import { normalizeVisitPath } from "./visits";

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
