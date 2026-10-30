import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invites } from "@/lib/db/schema";

/** Undangan aktif, belum kedaluwarsa, dan masih punya sisa pakai. */
export async function getInvite(code: string) {
  const [row] = await getDb()
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.code, code),
        isNull(invites.deletedAt),
        eq(invites.active, true),
      ),
    )
    .limit(1);
  if (!row) return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;
  if (row.uses >= row.maxUses) return null;
  return row;
}
