import { describe, expect, it } from "vitest";
import { ForbiddenError, assertSameOrigin, isSameOrigin } from "./origin";

function request(url: string, origin?: string) {
  return new Request(url, {
    method: "POST",
    headers: origin ? { origin } : undefined,
  });
}

describe("isSameOrigin", () => {
  it("menerima origin yang sama", () => {
    expect(
      isSameOrigin(request("https://olu.example/api", "https://olu.example")),
    ).toBe(true);
  });

  it("menolak origin lain dan origin kosong", () => {
    expect(
      isSameOrigin(request("https://olu.example/api", "https://evil.com")),
    ).toBe(false);
    expect(isSameOrigin(request("https://olu.example/api"))).toBe(false);
  });

  it("menolak header origin yang tidak bisa diparse", () => {
    expect(isSameOrigin(request("https://olu.example/api", "bukan url"))).toBe(
      false,
    );
  });
});

describe("assertSameOrigin", () => {
  it("melempar ForbiddenError saat origin berbeda", () => {
    expect(() =>
      assertSameOrigin(request("https://olu.example/api", "https://evil.com")),
    ).toThrow(ForbiddenError);
  });

  it("diam saat origin sama", () => {
    expect(() =>
      assertSameOrigin(request("https://olu.example/api", "https://olu.example")),
    ).not.toThrow();
  });
});
