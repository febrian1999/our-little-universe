import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RoomGrid } from "@/components/room-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { getChapterBySlug } from "@/lib/db/repositories/chapters";
import { listRooms } from "@/lib/db/repositories/rooms";

export default function ChapterPage(props: PageProps<"/[chapter]">) {
  return (
    <main id="konten" className="relative flex-1 px-6 py-12">
      <div
        aria-hidden
        className="ambient bg-[radial-gradient(60%_50%_at_20%_10%,#fce7f3_0%,transparent_60%),radial-gradient(50%_45%_at_85%_85%,#dbeafe_0%,transparent_65%)]"
      />

      <Suspense fallback={<p className="text-sm text-neutral-500">Membuka peta…</p>}>
        <Castle params={props.params} />
      </Suspense>
    </main>
  );
}

async function Castle({ params }: { params: PageProps<"/[chapter]">["params"] }) {
  const { chapter: slug } = await params;
  await requireUser();

  const chapter = await getChapterBySlug(slug);
  if (!chapter) notFound();

  const rooms = await listRooms(chapter.id);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          {chapter.title}
        </h1>
        {chapter.subtitle ? (
          <p className="mt-2 text-base text-neutral-600">{chapter.subtitle}</p>
        ) : null}
      </header>

      {rooms.length === 0 ? (
        <EmptyState>Belum ada ruangan di Chapter ini.</EmptyState>
      ) : (
        <RoomGrid
          chapterSlug={chapter.slug}
          rooms={rooms.map((room) => ({
            id: room.id,
            key: room.key,
            title: room.title,
            icon: room.icon,
            description: room.description,
            locked: room.locked,
          }))}
        />
      )}
    </div>
  );
}
