import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { chapters } from "@/lib/db/schema";

export async function getChapterBySlug(slug: string) {
  const [row] = await getDb()
    .select()
    .from(chapters)
    .where(and(eq(chapters.slug, slug), isNull(chapters.deletedAt)))
    .limit(1);
  return row ?? null;
}

/** Chapter pertama untuk gate landing (schema.md §6 no. 10). */
export async function getPrimaryChapter() {
  const [row] = await getDb()
    .select()
    .from(chapters)
    .where(isNull(chapters.deletedAt))
    .orderBy(asc(chapters.sortOrder), asc(chapters.createdAt))
    .limit(1);
  return row ?? null;
}

export async function listChapters() {
  return getDb()
    .select()
    .from(chapters)
    .where(isNull(chapters.deletedAt))
    .orderBy(asc(chapters.sortOrder), asc(chapters.createdAt));
}

export async function isGateOpen(slug: string) {
  const [row] = await getDb()
    .select({ gateOpen: chapters.gateOpen })
    .from(chapters)
    .where(and(eq(chapters.slug, slug), isNull(chapters.deletedAt)))
    .limit(1);
  return row?.gateOpen ?? false;
}
