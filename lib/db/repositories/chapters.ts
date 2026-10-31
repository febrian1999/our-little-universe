import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { chapters } from "@/lib/db/schema";

export type ChapterInput = {
  slug: string;
  title: string;
  subtitle: string | null;
  startsAt: Date | null;
};

export async function getChapterBySlug(slug: string) {
  const [row] = await getDb()
    .select()
    .from(chapters)
    .where(and(eq(chapters.slug, slug), isNull(chapters.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function getChapterById(id: string) {
  const [row] = await getDb()
    .select()
    .from(chapters)
    .where(and(eq(chapters.id, id), isNull(chapters.deletedAt)))
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

export async function createChapter(input: ChapterInput, actorId: string) {
  const [row] = await getDb()
    .insert(chapters)
    .values({ ...input, createdBy: actorId, updatedBy: actorId })
    .returning();
  return row;
}

export async function updateChapter(
  id: string,
  patch: Partial<ChapterInput>,
  actorId: string,
) {
  const [row] = await getDb()
    .update(chapters)
    .set({ ...patch, updatedAt: new Date(), updatedBy: actorId })
    .where(eq(chapters.id, id))
    .returning();
  return row ?? null;
}

export async function softDeleteChapter(id: string, actorId: string) {
  const now = new Date();
  const [row] = await getDb()
    .update(chapters)
    .set({ deletedAt: now, deletedBy: actorId, updatedAt: now, updatedBy: actorId })
    .where(and(eq(chapters.id, id), isNull(chapters.deletedAt)))
    .returning();
  return row ?? null;
}
