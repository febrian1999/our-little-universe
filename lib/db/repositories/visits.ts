import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { visits, type visitAction } from "@/lib/db/schema";

export type VisitAction = (typeof visitAction.enumValues)[number];

export type VisitInput = {
  userId?: string | null;
  action: VisitAction;
  path?: string | null;
  chapterId?: string | null;
  roomId?: string | null;
  visible?: boolean;
};

export async function insertVisit(input: VisitInput) {
  await getDb()
    .insert(visits)
    .values({
      userId: input.userId ?? null,
      action: input.action,
      path: input.path ?? null,
      chapterId: input.chapterId ?? null,
      roomId: input.roomId ?? null,
      visible: input.visible ?? true,
    });
}

/** PRD §10.3: `room_view` duplikat < 60 detik untuk user+room sama diabaikan. */
export async function hasRecentRoomView(
  userId: string,
  roomId: string,
  seconds = 60,
) {
  const [row] = await getDb()
    .select({ id: visits.id })
    .from(visits)
    .where(
      and(
        eq(visits.userId, userId),
        eq(visits.roomId, roomId),
        eq(visits.action, "room_view"),
        gte(visits.createdAt, sql`now() - make_interval(secs => ${seconds})`),
      ),
    )
    .limit(1);
  return Boolean(row);
}
