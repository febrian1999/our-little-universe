import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { playlists } from "@/lib/db/schema";

export type PlaylistInput = {
  url: string;
  title: string;
  sortOrder: number;
};

export async function listPlaylists(roomId: string) {
  return getDb()
    .select()
    .from(playlists)
    .where(and(eq(playlists.roomId, roomId), isNull(playlists.deletedAt)))
    .orderBy(asc(playlists.sortOrder), asc(playlists.createdAt));
}

export async function getPlaylistById(id: string) {
  const [row] = await getDb()
    .select()
    .from(playlists)
    .where(and(eq(playlists.id, id), isNull(playlists.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function createPlaylist(
  roomId: string,
  input: PlaylistInput,
  actorId: string,
) {
  const [row] = await getDb()
    .insert(playlists)
    .values({ ...input, roomId, provider: "spotify", updatedBy: actorId })
    .returning();
  return row;
}

export async function updatePlaylist(
  id: string,
  patch: Partial<PlaylistInput>,
  actorId: string,
) {
  const [row] = await getDb()
    .update(playlists)
    .set({ ...patch, updatedAt: new Date(), updatedBy: actorId })
    .where(eq(playlists.id, id))
    .returning();
  return row ?? null;
}

export async function softDeletePlaylist(id: string, actorId: string) {
  const now = new Date();
  const [row] = await getDb()
    .update(playlists)
    .set({ deletedAt: now, deletedBy: actorId, updatedAt: now, updatedBy: actorId })
    .where(and(eq(playlists.id, id), isNull(playlists.deletedAt)))
    .returning();
  return row ?? null;
}
