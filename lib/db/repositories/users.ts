import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getUserByFirebaseUid(firebaseUid: string) {
  const [row] = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.firebaseUid, firebaseUid), isNull(users.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function getUserByEmail(email: string) {
  const [row] = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function getUserById(id: string) {
  const [row] = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  return row ?? null;
}

export type AuthProfile = {
  firebaseUid: string;
  email: string;
  name: string;
  photoUrl: string | null;
};

/**
 * Menyiapkan baris user setelah ID token terverifikasi (PRD §18.5).
 * `OWNER_EMAIL` hanya dipromosikan sekali, saat login pertama.
 */
export async function provisionUser(profile: AuthProfile) {
  const db = getDb();
  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
  const isOwner = !!ownerEmail && profile.email.toLowerCase() === ownerEmail;

  const existing =
    (await getUserByFirebaseUid(profile.firebaseUid)) ??
    (await getUserByEmail(profile.email));

  if (existing) {
    const promote = isOwner && (existing.role !== "owner" || !existing.isAllowed);
    const [updated] = await db
      .update(users)
      .set({
        firebaseUid: existing.firebaseUid ?? profile.firebaseUid,
        displayName: existing.displayName || profile.name,
        photoUrl: profile.photoUrl ?? existing.photoUrl,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
        ...(promote ? { role: "owner" as const, isAllowed: true } : {}),
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      firebaseUid: profile.firebaseUid,
      email: profile.email,
      displayName: profile.name || profile.email.split("@")[0],
      photoUrl: profile.photoUrl,
      role: isOwner ? "owner" : "guest",
      isAllowed: isOwner,
      lastLoginAt: new Date(),
    })
    .returning();
  return created;
}
