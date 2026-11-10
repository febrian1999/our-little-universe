import { and, desc, eq, isNull, sql } from "drizzle-orm";
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

export async function listUsers() {
  return getDb()
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      isAllowed: users.isAllowed,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt))
    .limit(200);
}

export async function countOwners() {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(and(isNull(users.deletedAt), eq(users.role, "owner")));
  return row?.count ?? 0;
}

/** Ubah role. Menurunkan owner terakhir ditolak di lapisan action (PRD §4). */
export async function updateUserRole(
  id: string,
  role: "owner" | "editor",
  actorId: string,
) {
  const [row] = await getDb()
    .update(users)
    .set({ role, updatedAt: new Date(), updatedBy: actorId })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning();
  return row ?? null;
}

/** Cabut akses = soft delete + `is_allowed = false` (tidak ada hard delete). */
export async function revokeUser(id: string, actorId: string) {
  const now = new Date();
  const [row] = await getDb()
    .update(users)
    .set({
      isAllowed: false,
      deletedAt: now,
      deletedBy: actorId,
      updatedAt: now,
      updatedBy: actorId,
    })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning();
  return row ?? null;
}

/**
 * Buka akses untuk email yang disetujui owner (PRD §4). Baris lama yang masih
 * ada dipakai ulang; kalau tidak ada, baris baru dibuat dengan role `editor`.
 * `firebase_uid` diisi saat login pertama lewat `provisionUser`.
 */
export async function provisionGuestByEmail(
  email: string,
  name: string,
  actorId: string,
) {
  const db = getDb();
  const normalized = email.toLowerCase();
  const existing = await getUserByEmail(normalized);
  const displayName = name || normalized.split("@")[0];

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        isAllowed: true,
        displayName: existing.displayName || displayName,
        updatedAt: new Date(),
        updatedBy: actorId,
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      email: normalized,
      displayName,
      role: "editor",
      isAllowed: true,
      updatedBy: actorId,
    })
    .returning();
  return created;
}
