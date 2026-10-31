import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createItemAction,
  createPlaylistAction,
  deleteItemAction,
  deletePlaylistAction,
  deleteRoomAction,
  updateRoomAction,
} from "@/app/admin/actions";
import { Card, Field, Notice, Select, TextArea } from "@/components/admin/form";
import { PhotoUpload } from "@/components/admin/photo-upload";
import { getChapterById } from "@/lib/db/repositories/chapters";
import { listItems } from "@/lib/db/repositories/items";
import { listPlaylists } from "@/lib/db/repositories/playlists";
import { getRoomById } from "@/lib/db/repositories/rooms";

export default async function RoomAdmin(
  props: PageProps<"/admin/chapters/[id]/rooms/[roomId]">,
) {
  const { id, roomId } = await props.params;
  const query = await props.searchParams;

  const chapter = await getChapterById(id);
  const room = await getRoomById(roomId);
  if (!chapter || !room || room.chapterId !== chapter.id) notFound();

  const from = `/admin/chapters/${chapter.id}/rooms/${room.id}`;
  const error = typeof query.error === "string" ? query.error : undefined;
  const ok = typeof query.ok === "string" ? query.ok : undefined;

  return (
    <>
      <Link href={`/admin/chapters/${chapter.id}`} className="text-sm text-accent underline">
        ← {chapter.title}
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
        <span aria-hidden className="mr-2">
          {room.icon}
        </span>
        {room.title}
      </h1>
      <Notice error={error} ok={ok} />

      <form
        action={updateRoomAction}
        className="mt-6 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-2"
      >
        <input type="hidden" name="id" value={room.id} />
        <input type="hidden" name="from" value={from} />
        <Field label="Key" name="key" defaultValue={room.key} required />
        <Field label="Judul" name="title" defaultValue={room.title} required />
        <Field label="Ikon" name="icon" defaultValue={room.icon} />
        <Select
          label="Jenis"
          name="kind"
          defaultValue={room.kind}
          options={[
            { value: "feed", label: "Feed" },
            { value: "playlist", label: "Playlist" },
          ]}
        />
        <div className="sm:col-span-2">
          <Field
            label="Deskripsi"
            name="description"
            defaultValue={room.description ?? ""}
          />
        </div>
        <Field
          label="Urutan"
          name="sortOrder"
          type="number"
          defaultValue={String(room.sortOrder)}
        />
        <button type="submit" className="btn-primary sm:col-span-2">
          Simpan ruangan
        </button>
      </form>

      {room.kind === "playlist" ? (
        <PlaylistSection roomId={room.id} from={from} />
      ) : (
        <ItemSection roomId={room.id} chapterId={chapter.id} from={from} />
      )}

      <h2 className="mt-10 text-lg font-semibold text-neutral-900">Bahaya</h2>
      <Card>
        <form action={deleteRoomAction} className="flex items-center gap-3">
          <input type="hidden" name="id" value={room.id} />
          <input type="hidden" name="from" value={`/admin/chapters/${chapter.id}`} />
          <p className="flex-1 text-sm text-neutral-600">
            Hapus ruangan ini? Isinya ikut tersembunyi, tanpa hard delete.
          </p>
          <button
            type="submit"
            className="tap rounded-full border border-red-300 px-4 text-sm font-semibold text-red-700"
          >
            Hapus ruangan
          </button>
        </form>
      </Card>
    </>
  );
}

async function ItemSection({
  roomId,
  chapterId,
  from,
}: {
  roomId: string;
  chapterId: string;
  from: string;
}) {
  const items = await listItems(roomId, 0, 100);

  return (
    <>
      <h2 className="mt-10 text-lg font-semibold text-neutral-900">Item</h2>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm"
          >
            <span className="min-w-0 flex-1 truncate text-neutral-800">
              <span className="font-semibold">{item.type}</span> ·{" "}
              {item.caption ?? item.publicId ?? item.url ?? "(tanpa teks)"}
            </span>
            <form action={deleteItemAction}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="from" value={from} />
              <button
                type="submit"
                className="tap rounded-full border border-red-300 px-3 text-xs font-semibold text-red-700"
              >
                Hapus
              </button>
            </form>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="text-sm text-neutral-500">Belum ada item.</li>
        ) : null}
      </ul>

      <h2 className="mt-10 text-lg font-semibold text-neutral-900">
        Item baru
      </h2>
      <form
        action={createItemAction}
        className="mt-4 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-2"
      >
        <input type="hidden" name="roomId" value={roomId} />
        <input type="hidden" name="from" value={from} />
        <Select
          label="Tipe"
          name="type"
          defaultValue="text"
          options={[
            { value: "text", label: "Teks" },
            { value: "photo", label: "Foto" },
            { value: "video", label: "Video YouTube" },
            { value: "song", label: "Lagu" },
          ]}
        />
        <Field label="Tanggal" name="takenAt" type="date" />
        <div className="sm:col-span-2">
          <TextArea label="Caption" name="caption" />
        </div>
        <div className="sm:col-span-2">
          <PhotoUpload chapterId={chapterId} />
        </div>
        <Field label="URL (video/lagu)" name="url" placeholder="https://" />
        <Field label="Lagu tempelan" name="songUrl" placeholder="https://" />
        <Field label="Judul lagu" name="songTitle" />
        <Field label="Mulai detik" name="songStartS" type="number" />
        <Field label="Urutan" name="sortOrder" type="number" defaultValue="0" />
        <button type="submit" className="btn-primary sm:col-span-2">
          Simpan item
        </button>
      </form>
    </>
  );
}

async function PlaylistSection({
  roomId,
  from,
}: {
  roomId: string;
  from: string;
}) {
  const playlists = await listPlaylists(roomId);

  return (
    <>
      <h2 className="mt-10 text-lg font-semibold text-neutral-900">Playlist</h2>
      <ul className="mt-4 space-y-2">
        {playlists.map((playlist) => (
          <li
            key={playlist.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm"
          >
            <span className="min-w-0 flex-1 truncate">
              <span className="font-semibold text-neutral-900">
                {playlist.title}
              </span>{" "}
              <span className="text-neutral-500">{playlist.url}</span>
            </span>
            <form action={deletePlaylistAction}>
              <input type="hidden" name="id" value={playlist.id} />
              <input type="hidden" name="from" value={from} />
              <button
                type="submit"
                className="tap rounded-full border border-red-300 px-3 text-xs font-semibold text-red-700"
              >
                Hapus
              </button>
            </form>
          </li>
        ))}
        {playlists.length === 0 ? (
          <li className="text-sm text-neutral-500">Belum ada playlist.</li>
        ) : null}
      </ul>

      <h2 className="mt-10 text-lg font-semibold text-neutral-900">
        Playlist baru
      </h2>
      <form
        action={createPlaylistAction}
        className="mt-4 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-2"
      >
        <input type="hidden" name="roomId" value={roomId} />
        <input type="hidden" name="from" value={from} />
        <Field
          label="URL Spotify"
          name="url"
          placeholder="https://open.spotify.com/playlist/…"
          required
        />
        <Field label="Judul" name="title" required />
        <Field label="Urutan" name="sortOrder" type="number" defaultValue="0" />
        <button type="submit" className="btn-primary sm:col-span-2">
          Simpan playlist
        </button>
      </form>
    </>
  );
}
