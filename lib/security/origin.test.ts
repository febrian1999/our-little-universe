import { describe, expect, it } from "vitest";
import { ForbiddenError, assertSameOrigin, isSameOrigin } from "./origin";

function request(url: string, origin?: string) {
  const headers = new Headers({ host: new URL(url).host });
  if (origin) headers.set("origin", origin);
  return new Request(url, { method: "POST", headers });
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

  it("memakai x-forwarded-host saat berada di belakang proxy", () => {
    const forwarded = new Request("http://internal.local/api", {
      method: "POST",
      headers: {
        host: "internal.local",
        "x-forwarded-host": "olu.example",
        origin: "https://olu.example",
      },
    });
    expect(isSameOrigin(forwarded)).toBe(true);
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
