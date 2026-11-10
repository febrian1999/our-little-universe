import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RoomGrid } from "@/components/room-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { SparklesIcon } from "@/components/ui/sparkles";
import { requireUser } from "@/lib/auth";
import { getChapterBySlug } from "@/lib/db/repositories/chapters";
import { listRooms } from "@/lib/db/repositories/rooms";

export default function ChapterPage(props: PageProps<"/[chapter]">) {
  return (
    <main id="konten" className="relative flex-1 px-6 py-12">
      <div
        aria-hidden
        className="ambient ambient-fairy"
      />

      <Suspense
        fallback={
          <div className="mx-auto flex max-w-6xl items-center gap-2 text-sm text-neutral-500">
            <span aria-hidden className="size-2 animate-pulse rounded-full bg-pink-400" />
            Membuka peta kastil…
          </div>
        }
      >
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
      <header className="relative mb-10">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-pink-100/70 px-3 py-1 text-xs font-semibold text-pink-600">
          <SparklesIcon className="size-3.5" />
          <span>Castle Map</span>
        </div>

        <h1 className="mt-3 font-serif text-3xl font-normal tracking-tight text-neutral-900 sm:text-5xl">
          {chapter.title}
        </h1>
        {chapter.subtitle ? (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            {chapter.subtitle}
          </p>
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
