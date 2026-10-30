import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots", () => {
  it("menutup seluruh situs untuk crawler", () => {
    const rules = robots().rules;
    const list = Array.isArray(rules) ? rules : [rules];
    expect(list).toEqual([{ userAgent: "*", disallow: "/" }]);
  });
});
