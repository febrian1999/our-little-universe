/**
 * Validasi tujuan redirect setelah login (PRD §18.5).
 * Hanya path internal; origin tidak pernah ikut dari input user.
 */
export function safeNextPath(next: unknown): string | null {
  if (typeof next !== "string") return null;
  const value = next.trim();
  if (value.length === 0 || value.length > 512) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("\\")) return null;

  let url: URL;
  try {
    url = new URL(value, "http://internal.local");
  } catch {
    return null;
  }
  if (url.origin !== "http://internal.local") return null;

  return `${url.pathname}${url.search}`;
}
