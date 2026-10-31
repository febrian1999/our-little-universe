/**
 * CSP satu sumber (PRD §18.4). Nonce sengaja tidak dipakai: nonce memaksa
 * semua halaman dinamis dan tidak kompatibel dengan PPR/Cache Components
 * (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 * Tanpa nonce, `'unsafe-inline'` dibutuhkan untuk bootstrap React.
 */
export function contentSecurityPolicy(isDev: boolean): string {
  const script = [
    "'self'",
    "'unsafe-inline'",
    "https://www.gstatic.com",
    "https://apis.google.com",
  ];
  if (isDev) script.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.r2.dev https://i.ytimg.com https://lh3.googleusercontent.com",
    "media-src 'self' https://*.r2.dev",
    "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://api.cloudinary.com",
    "frame-src 'self' https://open.spotify.com https://www.youtube.com https://www.youtube-nocookie.com https://*.firebaseapp.com https://accounts.google.com",
    "object-src 'none'",
    "worker-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
