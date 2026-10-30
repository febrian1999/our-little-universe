/**
 * CSRF untuk route handler yang mengubah state (PRD §18.3).
 * Server Actions memakai pemeriksaan bawaan Next; route handler tidak.
 */
export class ForbiddenError extends Error {
  constructor(message = "Origin tidak cocok") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function assertSameOrigin(request: Request): void {
  if (!isSameOrigin(request)) throw new ForbiddenError();
}
