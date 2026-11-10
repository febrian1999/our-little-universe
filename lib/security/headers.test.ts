import { describe, expect, it } from "vitest";
import { securityHeaders } from "./headers";

// PRD §18.4 — header wajib sejak M1.
const required = [
  "X-Content-Type-Options",
  "Referrer-Policy",
  "X-Frame-Options",
  "Strict-Transport-Security",
  "Cross-Origin-Opener-Policy",
  "Permissions-Policy",
  "X-Robots-Tag",
];

describe("securityHeaders", () => {
  it("memuat semua header wajib", () => {
    expect(securityHeaders.map((h) => h.key)).toEqual(
      expect.arrayContaining(required),
    );
  });

  it("tidak punya key duplikat", () => {
    const keys = securityHeaders.map((h) => h.key.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("menolak index dan frame", () => {
    const value = (key: string) =>
      securityHeaders.find((h) => h.key === key)?.value ?? "";
    expect(value("X-Robots-Tag")).toContain("noindex");
    expect(value("X-Frame-Options")).toBe("DENY");
    expect(value("X-Content-Type-Options")).toBe("nosniff");
  });

  it("mengizinkan popup OAuth tanpa membuka frame", () => {
    const value = (key: string) =>
      securityHeaders.find((h) => h.key === key)?.value ?? "";
    expect(value("Cross-Origin-Opener-Policy")).toBe("same-origin-allow-popups");
  });

  it("mematikan kamera, mikrofon, dan lokasi", () => {
    const policy =
      securityHeaders.find((h) => h.key === "Permissions-Policy")?.value ?? "";
    for (const feature of ["camera=()", "microphone=()", "geolocation=()"]) {
      expect(policy).toContain(feature);
    }
  });
});
