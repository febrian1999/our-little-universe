import type { userRole } from "@/lib/db/schema";

export type UserRole = (typeof userRole.enumValues)[number];

export const ROLE_RANK: Record<UserRole, number> = {
  guest: 1,
  editor: 2,
  owner: 3,
};

/** Hierarki owner > editor > guest (PRD §4). */
export function hasMinRole(role: UserRole, min: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
