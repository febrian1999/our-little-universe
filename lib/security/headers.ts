import { contentSecurityPolicy } from "./csp";

type Header = { key: string; value: string };

/**
 * Satu-satunya sumber header keamanan (PRD §18.4).
 * Dipakai `next.config.ts` dan diuji di `headers.test.ts`.
 */
export const securityHeaders: Header[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy(process.env.NODE_ENV === "development"),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Popup OAuth Firebase butuh opener tetap hidup; `same-origin` memutusnya
  // sehingga signInWithPopup tidak pernah selesai (D-049).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];
