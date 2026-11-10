import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { items, type itemType, type mediaProvider } from "@/lib/db/schema";

export const ITEMS_PER_PAGE = 24;

export type ItemType = (typeof itemType.enumValues)[number];
export type MediaProvider = (typeof mediaProvider.enumValues)[number];

export type ItemInput = {
  type: ItemType;
  provider: MediaProvider;
  publicId: string | null;
  url: string | null;
  thumbUrl: string | null;
  width: number | null;
  height: number | null;
  caption: string | null;
  takenAt: Date | null;
  sortOrder: number;
  songProvider: MediaProvider;
  songUrl: string | null;
  songTitle: string | null;
  songStartS: number | null;
};

export async function listItems(
  roomId: string,
  offset = 0,
  limit = ITEMS_PER_PAGE,
) {
  return getDb()
    .select()
    .from(items)
    .where(and(eq(items.roomId, roomId), isNull(items.deletedAt)))
    .orderBy(asc(items.sortOrder), asc(items.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getItemById(id: string) {  const [row] = await getDb()
    .select()
    .from(items)
    .where(and(eq(items.id, id), isNull(items.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function countActiveItems() {
  const [row] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(items)
    .where(isNull(items.deletedAt));
  return row?.n ?? 0;
}

export async function createItem(
  roomId: string,
  input: ItemInput,
  actorId: string,
) {
  const [row] = await getDb()
    .insert(items)
    .values({ ...input, roomId, createdBy: actorId, updatedBy: actorId })
    .returning();
  return row;
}

export async function updateItem(
  id: string,
  patch: Partial<ItemInput>,
  actorId: string,
) {
  const [row] = await getDb()
    .update(items)
    .set({ ...patch, updatedAt: new Date(), updatedBy: actorId })
    .where(eq(items.id, id))
    .returning();
  return row ?? null;
}

export async function softDeleteItem(id: string, actorId: string) {
  const now = new Date();
  const [row] = await getDb()
    .update(items)
    .set({ deletedAt: now, deletedBy: actorId, updatedAt: now, updatedBy: actorId })
    .where(and(eq(items.id, id), isNull(items.deletedAt)))
    .returning();
  return row ?? null;
}
