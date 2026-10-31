import {
  hasRecentRoomView,
  insertVisit,
  type VisitAction,
} from "@/lib/db/repositories/visits";

export type { VisitAction };

/** PRD §18.8: path tanpa query/hash, kode undangan diredaksi. */
export function normalizeVisitPath(
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  const bare = path.split(/[?#]/)[0] || "/";
  if (/^\/invite\//.test(bare)) return "/invite/[redacted]";
  return bare.slice(0, 512);
}

/**
 * Satu pintu untuk semua catatan kunjungan (PRD §10.3): deduplikasi
 * `room_view` dan `visible = false` untuk `logout`.
 */
export async function recordVisit(input: {
  userId?: string | null;
  action: VisitAction;
  path?: string | null;
  chapterId?: string | null;
  roomId?: string | null;
}) {
  if (
    input.action === "room_view" &&
    input.userId &&
    input.roomId &&
    (await hasRecentRoomView(input.userId, input.roomId))
  ) {
    return;
  }

  await insertVisit({
    ...input,
    path: normalizeVisitPath(input.path),
    visible: input.action !== "logout",
  });
}
