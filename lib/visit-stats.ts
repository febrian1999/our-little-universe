import type { VisitAction } from "@/lib/db/repositories/visits";

/** Tanggal `Asia/Jakarta` sebagai `YYYY-MM-DD` (PRD §10.4). */
export function jakartaDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export type VisitStatRow = {
  createdAt: Date;
  action: VisitAction;
  sessionHash: string | null;
};

export type DailyStat = { day: string; views: number; uniques: number };

/**
 * Agregasi on-the-fly tanpa tabel counter (PRD §10.4). Deret selalu penuh:
 * hari tanpa kunjungan tetap muncul dengan angka nol.
 */
export function summarizeVisits(
  rows: VisitStatRow[],
  days: number,
  now = new Date(),
): { series: DailyStat[]; totals: Record<string, number> } {
  const keys: string[] = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    keys.push(jakartaDay(new Date(now.getTime() - index * 86_400_000)));
  }

  const bucket = new Map<string, { views: number; sessions: Set<string> }>();
  for (const key of keys) bucket.set(key, { views: 0, sessions: new Set() });

  const totals: Record<string, number> = {};
  for (const row of rows) {
    totals[row.action] = (totals[row.action] ?? 0) + 1;
    const entry = bucket.get(jakartaDay(row.createdAt));
    if (!entry) continue;
    if (row.action === "room_view") entry.views += 1;
    if (row.sessionHash) entry.sessions.add(row.sessionHash);
  }

  return {
    series: keys.map((day) => ({
      day,
      views: bucket.get(day)?.views ?? 0,
      uniques: bucket.get(day)?.sessions.size ?? 0,
    })),
    totals,
  };
}
