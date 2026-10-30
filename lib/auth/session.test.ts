import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session";

const KEY = "x".repeat(32);
const now = 1_800_000_000_000;

describe("session token", () => {
  it("bolak-balik menghasilkan payload yang sama", () => {
    const token = createSessionToken("u1", { now, key: KEY });
    const payload = verifySessionToken(token, { now, key: KEY });
    expect(payload?.sub).toBe("u1");
    expect(payload?.exp).toBe(payload!.iat + 5 * 24 * 60 * 60);
  });

  it("token baru setiap kali dibuat (mencegah session fixation)", () => {
    expect(createSessionToken("u1", { now, key: KEY })).not.toBe(
      createSessionToken("u1", { now, key: KEY }),
    );
  });

  it("menolak payload yang diubah", () => {
    const token = createSessionToken("u1", { now, key: KEY });
    const [, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ sub: "admin", iat: 1, exp: 9e9, jti: "x" }),
    ).toString("base64url");
    expect(verifySessionToken(`${forged}.${sig}`, { now, key: KEY })).toBeNull();
  });

  it("menolak kunci lain", () => {
    const token = createSessionToken("u1", { now, key: KEY });
    expect(verifySessionToken(token, { now, key: "y".repeat(32) })).toBeNull();
  });

  it("menolak token kedaluwarsa", () => {
    const token = createSessionToken("u1", { now, key: KEY });
    const later = now + (5 * 24 * 60 * 60 + 1) * 1000;
    expect(verifySessionToken(token, { now: later, key: KEY })).toBeNull();
  });

  it("menolak bentuk rusak", () => {
    expect(verifySessionToken("", { now, key: KEY })).toBeNull();
    expect(verifySessionToken("tanpa-titik", { now, key: KEY })).toBeNull();
    expect(verifySessionToken(".abc", { now, key: KEY })).toBeNull();
  });

  it("menolak secret yang terlalu pendek", () => {
    expect(() => createSessionToken("u1", { now, key: "pendek" })).toThrow();
  });
});
