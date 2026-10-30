import type { MetadataRoute } from "next";

/**
 * Situs ini privat dan tidak boleh diindeks (PRD §18.4, §18.11).
 * `X-Robots-Tag` di lib/security/headers.ts menjaga respons non-HTML.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
