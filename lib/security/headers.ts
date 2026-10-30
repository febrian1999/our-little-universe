type Header = { key: string; value: string };

/**
 * Satu-satunya sumber header keamanan (PRD §18.4).
 * Dipakai `next.config.ts` dan diuji di `headers.test.ts`.
 * CSP baru ditambahkan di M6 (Report-Only) dan M8 (enforce + nonce).
 */
export const securityHeaders: Header[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];
