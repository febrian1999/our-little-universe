import { describe, expect, it } from "vitest";
import { safeNextPath } from "./paths";

describe("safeNextPath", () => {
  it("menerima path internal beserta query", () => {
    expect(safeNextPath("/our-little-universe")).toBe("/our-little-universe");
    expect(safeNextPath("/our-little-universe?page=2")).toBe(
      "/our-little-universe?page=2",
    );
  });

  it("menolak URL absolut dan protocol-relative", () => {
    expect(safeNextPath("https://evil.com")).toBeNull();
    expect(safeNextPath("//evil.com")).toBeNull();
    expect(safeNextPath("/\\evil.com")).toBeNull();
    expect(safeNextPath("javascript:alert(1)")).toBeNull();
  });

  it("menolak nilai kosong, salah tipe, dan kepanjangan", () => {
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath("")).toBeNull();
    expect(safeNextPath(`/${"a".repeat(600)}`)).toBeNull();
    expect(safeNextPath(42)).toBeNull();
  });
});
