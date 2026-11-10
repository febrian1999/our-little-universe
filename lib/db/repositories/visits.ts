import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rooms, users, visits, type visitAction } from "@/lib/db/schema";
import { summarizeVisits, type VisitStatRow } from "@/lib/visit-stats";

export type VisitAction = (typeof visitAction.enumValues)[number];

export type VisitInput = {
  userId?: string | null;
  action: VisitAction;
  path?: string | null;
  chapterId?: string | null;
  roomId?: string | null;
  visible?: boolean;
  sessionHash?: string | null;
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
      sessionHash: input.sessionHash ?? null,
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

export type VisitFilter = {
  action?: VisitAction | null;
  from?: string | null;
  to?: string | null;
  includeHidden?: boolean;
  offset?: number;
  limit?: number;
};

/** Tanggal `YYYY-MM-DD` diartikan sebagai hari kalender `Asia/Jakarta`. */
function dayStart(day: string) {
  return sql`${day}::date::timestamp at time zone 'Asia/Jakarta'`;
}

export async function listVisits(filter: VisitFilter = {}) {
  const limit = filter.limit ?? 50;
  const where = [filter.includeHidden ? undefined : eq(visits.visible, true)];
  if (filter.action) where.push(eq(visits.action, filter.action));
  if (filter.from) where.push(gte(visits.createdAt, dayStart(filter.from)));
  if (filter.to) where.push(lt(visits.createdAt, dayStart(filter.to)));

  const rows = await getDb()
    .select({
      id: visits.id,
      action: visits.action,
      path: visits.path,
      visible: visits.visible,
      createdAt: visits.createdAt,
      userName: users.displayName,
      roomTitle: rooms.title,
    })
    .from(visits)
    .leftJoin(users, eq(users.id, visits.userId))
    .leftJoin(rooms, eq(rooms.id, visits.roomId))
    .where(and(...where.filter((clause) => clause !== undefined)))
    .orderBy(desc(visits.createdAt), desc(visits.id))
    .limit(limit + 1)
    .offset(filter.offset ?? 0);

  return { rows: rows.slice(0, limit), hasNext: rows.length > limit };
}

/** Data mentah jendela statistik; agregasi di `summarizeVisits`. */
export async function visitStats(days = 14, now = new Date()) {
  const rows = await getDb()
    .select({
      createdAt: visits.createdAt,
      action: visits.action,
      sessionHash: visits.sessionHash,
    })
    .from(visits)
    .where(
      and(
        eq(visits.visible, true),
        gte(visits.createdAt, sql`${now}::timestamptz - make_interval(days => ${days})`),
      ),
    );

  return summarizeVisits(rows as VisitStatRow[], days, now);
}
