"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { insertAudit } from "@/lib/db/repositories/audit";
import {
  createChapter,
  getChapterById,
  softDeleteChapter,
  updateChapter,
} from "@/lib/db/repositories/chapters";
import {
  createItem,
  softDeleteItem,
  updateItem,
} from "@/lib/db/repositories/items";
import {
  createPlaylist,
  softDeletePlaylist,
  updatePlaylist,
} from "@/lib/db/repositories/playlists";
import {
  createRoom,
  getRoom,
  softDeleteRoom,
  updateRoom,
} from "@/lib/db/repositories/rooms";
import { recordVisit } from "@/lib/visits";
import { chapterSchema, toChapterInput } from "@/lib/validation/chapter.schema";
import { itemSchema, toItemInput } from "@/lib/validation/item.schema";
import {
  playlistSchema,
  toPlaylistInput,
} from "@/lib/validation/playlist.schema";
import { roomSchema, toRoomInput } from "@/lib/validation/room.schema";

/** Hanya field ini yang diambil dari FormData; sisanya (`from`, `id`) diabaikan. */
function fields(formData: FormData, keys: readonly string[]) {
  return Object.fromEntries(
    keys.map((key) => [key, String(formData.get(key) ?? "")]),
  );
}

function fail(from: string, message: string): never {
  redirect(`${from}?error=${encodeURIComponent(message)}`);
}

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Data tidak valid";
}

const CHAPTER_KEYS = ["slug", "title", "subtitle", "startsAt"] as const;
const ROOM_KEYS = [
  "key",
  "title",
  "icon",
  "description",
  "kind",
  "sortOrder",
] as const;
const ITEM_KEYS = [
  "type",
  "caption",
  "takenAt",
  "publicId",
  "url",
  "width",
  "height",
  "songUrl",
  "songTitle",
  "songStartS",
  "sortOrder",
] as const;
const PLAYLIST_KEYS = ["url", "title", "sortOrder"] as const;

function parse<T extends z.ZodType>(
  schema: T,
  formData: FormData,
  keys: readonly string[],
  from: string,
): z.infer<T> {
  const result = schema.safeParse(fields(formData, keys));
  if (!result.success) fail(from, firstIssue(result.error));
  return result.data as z.infer<T>;
}

export async function createChapterAction(formData: FormData) {
  const user = await requireRole("editor");
  const from = "/admin";
  const input = toChapterInput(parse(chapterSchema, formData, CHAPTER_KEYS, from));

  const chapter = await createChapter(input, user.id);
  await insertAudit({
    actorId: user.id,
    action: "create",
    entity: "chapter",
    entityId: chapter.id,
    chapterId: chapter.id,
    after: chapter,
  });

  revalidatePath("/", "layout");
  redirect(`/admin/chapters/${chapter.id}`);
}

export async function updateChapterAction(formData: FormData) {
  const user = await requireRole("editor");
  const id = String(formData.get("id") ?? "");
  const from = `/admin/chapters/${id}`;
  const before = await getChapterById(id);
  if (!before) fail(from, "Chapter tidak ditemukan");

  const input = toChapterInput(parse(chapterSchema, formData, CHAPTER_KEYS, from));
  const after = await updateChapter(id, input, user.id);
  await insertAudit({
    actorId: user.id,
    action: "update",
    entity: "chapter",
    entityId: id,
    chapterId: id,
    before,
    after,
  });

  revalidatePath("/", "layout");
  redirect(`${from}?ok=1`);
}

export async function deleteChapterAction(formData: FormData) {
  const user = await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const row = await softDeleteChapter(id, user.id);
  if (row) {
    await insertAudit({
      actorId: user.id,
      action: "soft_delete",
      entity: "chapter",
      entityId: id,
      chapterId: id,
      before: row,
    });
  }
  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function createRoomAction(formData: FormData) {
  const user = await requireRole("editor");
  const chapterId = String(formData.get("chapterId") ?? "");
  const from = `/admin/chapters/${chapterId}`;

  const input = toRoomInput(parse(roomSchema, formData, ROOM_KEYS, from));
  // Key duplikat juga ditolak index unik parsial; ini hanya agar pesannya manusiawi.
  if (await getRoom(chapterId, input.key)) {
    fail(from, `Key "${input.key}" sudah dipakai di chapter ini`);
  }

  const room = await createRoom(chapterId, input, user.id);
  await insertAudit({
    actorId: user.id,
    action: "create",
    entity: "room",
    entityId: room.id,
    chapterId,
    after: room,
  });

  revalidatePath("/", "layout");
  redirect(`${from}?ok=1`);
}

export async function updateRoomAction(formData: FormData) {
  const user = await requireRole("editor");
  const id = String(formData.get("id") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  const input = toRoomInput(parse(roomSchema, formData, ROOM_KEYS, from));
  const after = await updateRoom(id, input, user.id);
  await insertAudit({
    actorId: user.id,
    action: "update",
    entity: "room",
    entityId: id,
    chapterId: after?.chapterId ?? null,
    after,
  });

  revalidatePath("/", "layout");
  redirect(`${from}?ok=1`);
}

export async function deleteRoomAction(formData: FormData) {
  const user = await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  const row = await softDeleteRoom(id, user.id);
  if (row) {
    await insertAudit({
      actorId: user.id,
      action: "soft_delete",
      entity: "room",
      entityId: id,
      chapterId: row.chapterId,
      before: row,
    });
  }

  revalidatePath("/", "layout");
  redirect(from);
}

export async function createItemAction(formData: FormData) {
  const user = await requireRole("editor");
  const roomId = String(formData.get("roomId") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  const input = toItemInput(parse(itemSchema, formData, ITEM_KEYS, from));
  const item = await createItem(roomId, input, user.id);
  await insertAudit({
    actorId: user.id,
    action: "create",
    entity: "item",
    entityId: item.id,
    after: item,
  });

  if (input.publicId) {
    await recordVisit({
      userId: user.id,
      action: "upload",
      path: from,
      roomId,
    });
  }

  revalidatePath("/", "layout");
  redirect(`${from}?ok=1`);
}

export async function updateItemAction(formData: FormData) {
  const user = await requireRole("editor");
  const id = String(formData.get("id") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  const input = toItemInput(parse(itemSchema, formData, ITEM_KEYS, from));
  const after = await updateItem(id, input, user.id);
  await insertAudit({
    actorId: user.id,
    action: "update",
    entity: "item",
    entityId: id,
    after,
  });

  revalidatePath("/", "layout");
  redirect(`${from}?ok=1`);
}

export async function deleteItemAction(formData: FormData) {
  const user = await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  const row = await softDeleteItem(id, user.id);
  if (row) {
    await insertAudit({
      actorId: user.id,
      action: "soft_delete",
      entity: "item",
      entityId: id,
      before: row,
    });
  }

  revalidatePath("/", "layout");
  redirect(from);
}

export async function createPlaylistAction(formData: FormData) {
  const user = await requireRole("editor");
  const roomId = String(formData.get("roomId") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  const parsed = parse(playlistSchema, formData, PLAYLIST_KEYS, from);
  const input = toPlaylistInput(parsed);
  if (!input) fail(from, "Tautan Spotify tidak valid");

  const playlist = await createPlaylist(roomId, input, user.id);
  await insertAudit({
    actorId: user.id,
    action: "create",
    entity: "playlist",
    entityId: playlist.id,
    after: playlist,
  });

  revalidatePath("/", "layout");
  redirect(`${from}?ok=1`);
}

export async function updatePlaylistAction(formData: FormData) {
  const user = await requireRole("editor");
  const id = String(formData.get("id") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  const parsed = parse(playlistSchema, formData, PLAYLIST_KEYS, from);
  const input = toPlaylistInput(parsed);
  if (!input) fail(from, "Tautan Spotify tidak valid");

  const after = await updatePlaylist(id, input, user.id);
  await insertAudit({
    actorId: user.id,
    action: "update",
    entity: "playlist",
    entityId: id,
    after,
  });

  revalidatePath("/", "layout");
  redirect(`${from}?ok=1`);
}

export async function deletePlaylistAction(formData: FormData) {
  const user = await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  const row = await softDeletePlaylist(id, user.id);
  if (row) {
    await insertAudit({
      actorId: user.id,
      action: "soft_delete",
      entity: "playlist",
      entityId: id,
      before: row,
    });
  }

  revalidatePath("/", "layout");
  redirect(from);
}
