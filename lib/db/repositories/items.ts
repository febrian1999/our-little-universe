import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { items } from "@/lib/db/schema";

export const ITEMS_PER_PAGE = 24;

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
