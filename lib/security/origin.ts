/**
 * CSRF untuk route handler yang mengubah state (PRD §18.3).
 * Server Actions memakai pemeriksaan bawaan Next; route handler tidak.
 *
 * Pembanding adalah header `Host`, bukan `request.url`: di belakang proxy
 * `request.url` bisa memakai host internal sehingga permintaan sah ditolak.
 */
export class ForbiddenError extends Error {
  constructor(message = "Origin tidak cocok") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function assertSameOrigin(request: Request): void {
  if (!isSameOrigin(request)) throw new ForbiddenError();
}
