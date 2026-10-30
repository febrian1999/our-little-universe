import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { playlists } from "@/lib/db/schema";

export async function listPlaylists(roomId: string) {
  return getDb()
    .select()
    .from(playlists)
    .where(and(eq(playlists.roomId, roomId), isNull(playlists.deletedAt)))
    .orderBy(asc(playlists.sortOrder), asc(playlists.createdAt));
}
