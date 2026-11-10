import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { playlistMoods } from "@/lib/db/schema";

export type MoodInput = {
  key: string;
  label: string;
  emoji: string;
  sortOrder: number;
};

export async function listMoods() {
  return getDb()
    .select()
    .from(playlistMoods)
    .where(isNull(playlistMoods.deletedAt))
    .orderBy(asc(playlistMoods.sortOrder), asc(playlistMoods.createdAt));
}

export async function getMoodByKey(key: string) {
  const [row] = await getDb()
    .select()
    .from(playlistMoods)
    .where(and(eq(playlistMoods.key, key), isNull(playlistMoods.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function createMood(input: MoodInput, actorId: string) {
  const [row] = await getDb()
    .insert(playlistMoods)
    .values({ ...input, updatedBy: actorId })
    .onConflictDoNothing()
    .returning();
  return row ?? null;
}

export async function updateMood(
  id: string,
  patch: Partial<MoodInput>,
  actorId: string,
) {
  const [row] = await getDb()
    .update(playlistMoods)
    .set({ ...patch, updatedAt: new Date(), updatedBy: actorId })
    .where(eq(playlistMoods.id, id))
    .returning();
  return row ?? null;
}

export async function softDeleteMood(id: string, actorId: string) {
  const now = new Date();
  const [row] = await getDb()
    .update(playlistMoods)
    .set({ deletedAt: now, deletedBy: actorId, updatedAt: now, updatedBy: actorId })
    .where(and(eq(playlistMoods.id, id), isNull(playlistMoods.deletedAt)))
    .returning();
  return row ?? null;
}
