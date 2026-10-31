import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createRoomAction,
  deleteChapterAction,
  updateChapterAction,
} from "@/app/admin/actions";
import { Card, Field, Notice, Select } from "@/components/admin/form";
import { getChapterById } from "@/lib/db/repositories/chapters";
import { listRooms } from "@/lib/db/repositories/rooms";

export default async function ChapterAdmin(
  props: PageProps<"/admin/chapters/[id]">,
) {
  const { id } = await props.params;
  const query = await props.searchParams;

  const chapter = await getChapterById(id);
  if (!chapter) notFound();

  const rooms = await listRooms(chapter.id);

  return (
    <>
      <Link href="/admin/chapters" className="text-sm text-accent underline">
        ← Semua chapter
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
        {chapter.title}
      </h1>
      <Notice
        error={typeof query.error === "string" ? query.error : undefined}
        ok={typeof query.ok === "string" ? query.ok : undefined}
      />

      <form
        action={updateChapterAction}
        className="mt-6 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-2"
      >
        <input type="hidden" name="id" value={chapter.id} />
        <Field label="Slug" name="slug" defaultValue={chapter.slug} required />
        <Field label="Judul" name="title" defaultValue={chapter.title} required />
        <Field
          label="Subjudul"
          name="subtitle"
          defaultValue={chapter.subtitle ?? ""}
        />
        <Field
          label="Mulai"
          name="startsAt"
          type="date"
          defaultValue={chapter.startsAt?.toISOString().slice(0, 10) ?? ""}
        />
        <button type="submit" className="btn-primary sm:col-span-2">
          Simpan perubahan
        </button>
      </form>

      <h2 className="mt-10 text-lg font-semibold text-neutral-900">Ruangan</h2>
      <ul className="mt-4 space-y-2">
        {rooms.map((room) => (
          <li key={room.id}>
            <Link
              href={`/admin/chapters/${chapter.id}/rooms/${room.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm hover:border-primary"
            >
              <span className="font-semibold text-neutral-900">
                <span aria-hidden className="mr-2">
                  {room.icon}
                </span>
                {room.title}
              </span>
              <span className="text-neutral-500">
                /{room.key} · {room.kind}
              </span>
            </Link>
          </li>
        ))}
        {rooms.length === 0 ? (
          <li className="text-sm text-neutral-500">Belum ada ruangan.</li>
        ) : null}
      </ul>

      <h2 className="mt-10 text-lg font-semibold text-neutral-900">
        Ruangan baru
      </h2>
      <form
        action={createRoomAction}
        className="mt-4 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-2"
      >
        <input type="hidden" name="chapterId" value={chapter.id} />
        <Field label="Key" name="key" placeholder="touring" required />
        <Field label="Judul" name="title" placeholder="Touring" required />
        <Field label="Ikon" name="icon" placeholder="✨" defaultValue="✨" />
        <Select
          label="Jenis"
          name="kind"
          defaultValue="feed"
          options={[
            { value: "feed", label: "Feed" },
            { value: "playlist", label: "Playlist" },
          ]}
        />
        <div className="sm:col-span-2">
          <Field label="Deskripsi" name="description" placeholder="Opsional" />
        </div>
        <Field label="Urutan" name="sortOrder" type="number" defaultValue="0" />
        <button type="submit" className="btn-primary sm:col-span-2">
          Simpan ruangan
        </button>
      </form>

      <h2 className="mt-10 text-lg font-semibold text-neutral-900">Bahaya</h2>
      <Card>
        <form action={deleteChapterAction} className="flex items-center gap-3">
          <input type="hidden" name="id" value={chapter.id} />
          <p className="flex-1 text-sm text-neutral-600">
            Hapus chapter ini? Bisa dilakukan pemilik saja, dan datanya tetap
            tersimpan sebagai soft delete.
          </p>
          <button
            type="submit"
            className="tap rounded-full border border-red-300 px-4 text-sm font-semibold text-red-700"
          >
            Hapus chapter
          </button>
        </form>
      </Card>
    </>
  );
}
