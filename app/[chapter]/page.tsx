import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getChapterBySlug } from "@/lib/db/repositories/chapters";
import { listRooms } from "@/lib/db/repositories/rooms";

export default function ChapterPage(props: PageProps<"/[chapter]">) {
  return (
    <main className="relative flex-1 px-6 py-12">
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
    <div className="mx-auto w-full max-w-2xl">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          {chapter.title}
        </h1>
        {chapter.subtitle ? (
          <p className="mt-2 text-base text-neutral-600">{chapter.subtitle}</p>
        ) : null}
      </header>

      {rooms.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          Belum ada ruangan di Chapter ini.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/${chapter.slug}/${room.key}`}
                className="flex h-full flex-col gap-1 rounded-3xl border border-neutral-200/80 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span aria-hidden className="text-2xl">
                  {room.icon}
                </span>
                <span className="text-lg font-semibold text-neutral-900">
                  {room.title}
                </span>
                {room.description ? (
                  <span className="text-sm leading-relaxed text-neutral-600">
                    {room.description}
                  </span>
                ) : null}
                {room.locked ? (
                  <span className="mt-2 text-xs font-semibold text-neutral-500">
                    Terkunci
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
