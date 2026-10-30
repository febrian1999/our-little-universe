import { describe, expect, it } from "vitest";
import { ROLE_RANK, hasMinRole } from "./roles";

describe("hasMinRole", () => {
  it("owner > editor > guest", () => {
    expect(ROLE_RANK.owner).toBeGreaterThan(ROLE_RANK.editor);
    expect(ROLE_RANK.editor).toBeGreaterThan(ROLE_RANK.guest);
  });

  it("mengizinkan role yang setara atau lebih tinggi", () => {
    expect(hasMinRole("owner", "owner")).toBe(true);
    expect(hasMinRole("owner", "guest")).toBe(true);
    expect(hasMinRole("editor", "editor")).toBe(true);
    expect(hasMinRole("guest", "guest")).toBe(true);
  });

  it("menolak role di bawah minimum", () => {
    expect(hasMinRole("guest", "editor")).toBe(false);
    expect(hasMinRole("editor", "owner")).toBe(false);
  });
});
