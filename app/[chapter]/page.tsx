import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AmbientSky } from "@/components/ambient-sky";
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
      <AmbientSky />

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
  const unlockedCount = rooms.filter((r) => !r.locked).length;
  const progressPercent = rooms.length > 0 ? Math.round((unlockedCount / rooms.length) * 100) : 0;

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl">
      <header className="relative mb-8 text-center sm:text-left">
        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-4">
          <span
            aria-hidden
            className="text-5xl select-none filter drop-shadow-[0_6px_10px_rgba(244,114,182,0.45)] sm:text-6xl"
          >
            🏰
          </span>
          <div className="mt-2 text-center sm:mt-0 sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-pink-200/80 bg-white/70 px-3.5 py-1 text-xs font-semibold tracking-wider text-[#be185d] uppercase shadow-2xs backdrop-blur-xs">
              <SparklesIcon className="size-3.5" />
              <span>Castle Map</span>
            </div>

            <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#be185d] sm:text-5xl">
              {chapter.title}
            </h1>
            {chapter.subtitle ? (
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-[#79677f]">
                {chapter.subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {/* Legacy Progress Panel */}
      {rooms.length > 0 ? (
        <section className="mb-8 rounded-2xl border border-white/90 bg-white/80 p-4 shadow-[0_8px_20px_rgba(190,24,93,0.06)] backdrop-blur-xs">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#79677f]">
            <span>
              Progres Ruangan Terbuka:{" "}
              <strong className="text-[#be185d]">
                {unlockedCount} dari {rooms.length} Ruangan
              </strong>
            </span>
            <span className="font-semibold text-[#be185d]">{progressPercent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-pink-100/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-400 to-sky-300 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </section>
      ) : null}

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
