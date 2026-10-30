import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getUserById } from "@/lib/db/repositories/users";
import { hasMinRole, type UserRole } from "./roles";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export type { UserRole };
export { hasMinRole };

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

/**
 * Kontrak auth (PRD §3.1). Implementasi boleh diganti tanpa mengubah route.
 * User yang login tapi `is_allowed = false` diperlakukan sebagai tamu asing.
 */
export async function getSession(): Promise<SessionUser | null> {
  // Cache Components: token punya `Date.now()`, jadi harus setelah request.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  const user = await getUserById(payload.sub);
  if (!user || !user.isAllowed) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.displayName,
    role: user.role,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(min: UserRole): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasMinRole(user.role, min)) redirect("/");
  return user;
}
