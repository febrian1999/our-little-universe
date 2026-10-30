import { getDb } from "@/lib/db";
import { visits, type visitAction } from "@/lib/db/schema";

export type VisitAction = (typeof visitAction.enumValues)[number];

/** PRD §18.8: path tanpa query/hash, kode undangan diredaksi. */
export function normalizeVisitPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const bare = path.split(/[?#]/)[0] || "/";
  if (/^\/invite\//.test(bare)) return "/invite/[redacted]";
  return bare.slice(0, 512);
}

export async function recordVisit(input: {
  userId?: string | null;
  action: VisitAction;
  path?: string | null;
  chapterId?: string | null;
  roomId?: string | null;
}) {
  await getDb()
    .insert(visits)
    .values({
      userId: input.userId ?? null,
      action: input.action,
      path: normalizeVisitPath(input.path),
      chapterId: input.chapterId ?? null,
      roomId: input.roomId ?? null,
    });
}
