import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { accessRequests } from "@/lib/db/schema";

export type AccessRequestStatus = (typeof accessRequests.status.enumValues)[number];

/** Permintaan akses milik satu email yang masih menunggu keputusan. */
export async function getPendingRequestByEmail(email: string) {
  const [row] = await getDb()
    .select()
    .from(accessRequests)
    .where(
      and(
        eq(accessRequests.email, email.toLowerCase()),
        eq(accessRequests.status, "pending"),
        isNull(accessRequests.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Kirim permintaan akses. Email yang sudah punya `pending` ditolak index unik
 * parsial; `null` = sudah ada permintaan menunggu.
 */
export async function createAccessRequest(
  input: { email: string; name: string; message: string | null },
  actorId: string | null,
) {
  const rows = await getDb()
    .insert(accessRequests)
    .values({
      email: input.email.toLowerCase(),
      name: input.name,
      message: input.message,
      updatedBy: actorId,
    })
    .onConflictDoNothing()
    .returning();
  return rows[0] ?? null;
}

export async function listAccessRequests(status?: AccessRequestStatus) {
  return getDb()
    .select()
    .from(accessRequests)
    .where(
      and(
        isNull(accessRequests.deletedAt),
        status ? eq(accessRequests.status, status) : undefined,
      ),
    )
    .orderBy(desc(accessRequests.createdAt))
    .limit(100);
}

export async function getAccessRequestById(id: string) {
  const [row] = await getDb()
    .select()
    .from(accessRequests)
    .where(and(eq(accessRequests.id, id), isNull(accessRequests.deletedAt)))
    .limit(1);
  return row ?? null;
}

/** Keputusan owner: `approved` atau `rejected` (PRD §4). Tidak ada hard delete. */
export async function decideAccessRequest(
  id: string,
  decision: "approved" | "rejected",
  actorId: string,
  reason: string | null,
) {
  const [row] = await getDb()
    .update(accessRequests)
    .set({
      status: decision,
      reason,
      decidedBy: actorId,
      decidedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: actorId,
    })
    .where(and(eq(accessRequests.id, id), isNull(accessRequests.deletedAt)))
    .returning();
  return row ?? null;
}

export async function countPendingRequests() {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(accessRequests)
    .where(
      and(isNull(accessRequests.deletedAt), eq(accessRequests.status, "pending")),
    );
  return row?.count ?? 0;
}
