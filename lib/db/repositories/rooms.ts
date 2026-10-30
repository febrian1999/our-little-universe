import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rooms } from "@/lib/db/schema";

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
