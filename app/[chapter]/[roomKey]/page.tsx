import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { after } from "next/server";
import { PhotoGrid } from "@/components/lightbox";
import { PlaylistPlayer } from "@/components/playlist-player";
import { SongCard } from "@/components/song-card";
import { EmptyState } from "@/components/ui/empty-state";
import { hasMinRole, requireUser } from "@/lib/auth";
import { getChapterBySlug } from "@/lib/db/repositories/chapters";
import { ITEMS_PER_PAGE, listItems } from "@/lib/db/repositories/items";
import { listPlaylists } from "@/lib/db/repositories/playlists";
import { getRoom } from "@/lib/db/repositories/rooms";
import { cloudinaryLoader } from "@/lib/media/image-loader";
import { spotifyPlaylistEmbed, spotifyTrackEmbed } from "@/lib/media/spotify";
import { youtubeEmbedUrl } from "@/lib/media/youtube";
import { recordVisit } from "@/lib/visits";

export default function RoomPage(props: PageProps<"/[chapter]/[roomKey]">) {
  return (
    <main id="konten" className="relative flex-1 px-6 py-12">
      <div
        aria-hidden
        className="ambient ambient-fairy"
      />

      <Suspense
        fallback={
          <div className="mx-auto flex max-w-2xl items-center gap-2 text-sm text-neutral-500">
            <span aria-hidden className="size-2 animate-pulse rounded-full bg-pink-400" />
            Membuka ruangan…
          </div>
        }
      >
        <Room params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

function songEmbed(provider: string, url: string, startS: number | null) {
  if (provider === "spotify") return spotifyTrackEmbed(url, startS);
  if (provider === "youtube") return youtubeEmbedUrl(url, startS);
  return null;
}

async function Room({
  params,
  searchParams,
}: {
  params: PageProps<"/[chapter]/[roomKey]">["params"];
  searchParams: PageProps<"/[chapter]/[roomKey]">["searchParams"];
}) {
  const { chapter: slug, roomKey } = await params;
  const user = await requireUser();

  const chapter = await getChapterBySlug(slug);
  if (!chapter) notFound();

  const room = await getRoom(chapter.id, roomKey);
  if (!room || !hasMinRole(user.role, room.minRole)) notFound();

  after(() =>
    recordVisit({
      userId: user.id,
      action: "room_view",
      path: `/${slug}/${roomKey}`,
      chapterId: chapter.id,
      roomId: room.id,
    }),
  );

  const query = await searchParams;
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href={`/${chapter.slug}`}
        className="group inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1 text-xs font-semibold text-neutral-600 shadow-xs ring-1 ring-neutral-200/60 backdrop-blur transition hover:text-pink-600 hover:ring-pink-300"
      >
        <span aria-hidden className="transition group-hover:-translate-x-0.5">←</span>
        <span>Kembali ke {chapter.title}</span>
      </Link>

      <header className="mt-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-xs ring-1 ring-pink-100">
            <span aria-hidden>{room.icon}</span>
          </div>
          <div>
            <h1 className="font-serif text-3xl font-normal tracking-tight text-neutral-900 sm:text-4xl">
              {room.title}
            </h1>
            <p className="text-xs tracking-wider text-pink-500 uppercase">
              {room.kind === "playlist" ? "Music Room" : "Memory Room"}
            </p>
          </div>
        </div>

        {room.description ? (
          <p className="mt-3 text-base leading-relaxed text-neutral-600">
            {room.description}
          </p>
        ) : null}
      </header>

      {room.kind === "playlist" ? (
        <PlaylistSection roomId={room.id} />
      ) : (
        <FeedSection roomId={room.id} page={page} slug={slug} roomKey={roomKey} />
      )}
    </div>
  );
}

async function PlaylistSection({ roomId }: { roomId: string }) {
  const rows = await listPlaylists(roomId);
  if (rows.length === 0) return <EmptyState>Belum ada playlist di sini.</EmptyState>;

  return (
    <PlaylistPlayer
      playlists={rows.map((row) => ({
        id: row.id,
        title: row.title,
        url: row.url,
        embedUrl: spotifyPlaylistEmbed(row.url),
      }))}
    />
  );
}

async function FeedSection({
  roomId,
  page,
  slug,
  roomKey,
}: {
  roomId: string;
  page: number;
  slug: string;
  roomKey: string;
}) {
  const rows = await listItems(roomId, (page - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE + 1);
  const hasNext = rows.length > ITEMS_PER_PAGE;
  const items = hasNext ? rows.slice(0, ITEMS_PER_PAGE) : rows;

  if (items.length === 0) {
    return page > 1 ? (
      <EmptyState>
        Halaman ini kosong.{" "}
        <Link href={`/${slug}/${roomKey}`} className="text-accent underline">
          Kembali ke halaman pertama
        </Link>
      </EmptyState>
    ) : (
      <EmptyState>Belum ada kenangan di ruangan ini.</EmptyState>
    );
  }

  const photos = items
    .filter((item) => item.type === "photo" && item.publicId)
    .map((item) => ({
      id: item.id,
      publicId: item.publicId as string,
      caption: item.caption,
    }));

  const others = items.filter(
    (item) => !(item.type === "photo" && item.publicId),
  );

  return (
    <>
      {photos.length > 0 ? (
        <div className="mt-8">
          <PhotoGrid photos={photos} />
        </div>
      ) : null}

      <div className="mt-8 space-y-5">
        {others.map((item) => (
          <article
            key={item.id}
            className="glass-panel overflow-hidden rounded-3xl p-5 shadow-xs sm:p-6"
          >
            {item.type === "video" && item.provider === "youtube" && item.url ? (
              <YouTubeEmbed url={item.url} title={item.caption ?? "Video"} />
            ) : null}

            {item.type === "video" && item.provider === "r2" && item.url ? (
              <video
                src={item.url}
                poster={item.thumbUrl ?? undefined}
                preload="metadata"
                controls
                playsInline
                className="w-full rounded-2xl bg-black"
              />
            ) : null}

            {item.type === "photo" && item.url ? (
              <Image
                loader={cloudinaryLoader}
                src={item.publicId ?? item.url}
                alt={item.caption ?? ""}
                width={800}
                height={800}
                sizes="(max-width: 640px) 100vw, 640px"
                className="w-full rounded-2xl object-cover"
              />
            ) : null}

            {item.caption ? (
              <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-neutral-800">
                {item.caption}
              </p>
            ) : null}

            {item.songUrl ? (
              <div className="mt-3">
                <SongCard
                  title={item.songTitle}
                  embedUrl={songEmbed(item.songProvider, item.songUrl, item.songStartS)}
                  externalUrl={item.songUrl}
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {page > 1 || hasNext ? (
        <nav className="mt-8 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={`/${slug}/${roomKey}?page=${page - 1}`}
              className="tap inline-flex items-center text-accent underline"
            >
              ← Sebelumnya
            </Link>
          ) : (
            <span />
          )}
          {hasNext ? (
            <Link
              href={`/${slug}/${roomKey}?page=${page + 1}`}
              className="tap inline-flex items-center text-accent underline"
            >
              Berikutnya →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}

function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const embedUrl = youtubeEmbedUrl(url);
  if (!embedUrl) return null;
  return (
    <iframe
      src={embedUrl}
      title={title}
      loading="lazy"
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="aspect-video w-full rounded-2xl border-0"
    />
  );
}
