import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rooms } from "@/lib/db/schema";

export type RoomInput = {
  key: string;
  title: string;
  icon: string;
  description: string | null;
  kind: "feed" | "playlist";
  sortOrder: number;
};

export async function listRooms(chapterId: string) {
  return getDb()
    .select()
    .from(rooms)
    .where(and(eq(rooms.chapterId, chapterId), isNull(rooms.deletedAt)))
    .orderBy(asc(rooms.sortOrder), asc(rooms.createdAt));
}

export async function getRoom(chapterId: string, key: string) {
  const [row] = await getDb()
    .select()
    .from(rooms)
    .where(
      and(
        eq(rooms.chapterId, chapterId),
        eq(rooms.key, key),
        isNull(rooms.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getRoomById(id: string) {
  const [row] = await getDb()
    .select()
    .from(rooms)
    .where(and(eq(rooms.id, id), isNull(rooms.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function createRoom(
  chapterId: string,
  input: RoomInput,
  actorId: string,
) {
  const [row] = await getDb()
    .insert(rooms)
    .values({ ...input, chapterId, updatedBy: actorId })
    .returning();
  return row;
}

export async function updateRoom(
  id: string,
  patch: Partial<RoomInput>,
  actorId: string,
) {
  const [row] = await getDb()
    .update(rooms)
    .set({ ...patch, updatedAt: new Date(), updatedBy: actorId })
    .where(eq(rooms.id, id))
    .returning();
  return row ?? null;
}

export async function softDeleteRoom(id: string, actorId: string) {
  const now = new Date();
  const [row] = await getDb()
    .update(rooms)
    .set({ deletedAt: now, deletedBy: actorId, updatedAt: now, updatedBy: actorId })
    .where(and(eq(rooms.id, id), isNull(rooms.deletedAt)))
    .returning();
  return row ?? null;
}
