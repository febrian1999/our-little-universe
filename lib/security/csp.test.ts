import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "./csp";

describe("contentSecurityPolicy", () => {
  const prod = contentSecurityPolicy(false);

  it("mengunci sumber default, objek, base, dan form", () => {
    expect(prod).toContain("default-src 'self'");
    expect(prod).toContain("object-src 'none'");
    expect(prod).toContain("base-uri 'self'");
    expect(prod).toContain("form-action 'self'");
    expect(prod).toContain("frame-ancestors 'none'");
  });

  it("tidak memakai eval di produksi", () => {
    expect(prod).not.toContain("unsafe-eval");
    expect(contentSecurityPolicy(true)).toContain("'unsafe-eval'");
  });

  it("mengizinkan media dan embed yang dipakai aplikasi", () => {
    expect(prod).toContain("https://res.cloudinary.com");
    expect(prod).toContain("https://*.r2.dev");
    expect(prod).toContain("https://open.spotify.com");
    expect(prod).toContain("https://www.youtube.com");
  });

  it("mengizinkan endpoint Firebase Auth", () => {
    expect(prod).toContain("https://identitytoolkit.googleapis.com");
    expect(prod).toContain("https://securetoken.googleapis.com");
  });
});
