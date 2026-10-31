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
        className="ambient bg-[radial-gradient(60%_50%_at_20%_10%,#fce7f3_0%,transparent_60%),radial-gradient(50%_45%_at_85%_85%,#dbeafe_0%,transparent_65%)]"
      />

      <Suspense
        fallback={<p className="text-sm text-neutral-500">Membuka ruangan…</p>}
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
      <Link href={`/${chapter.slug}`} className="text-sm text-accent underline">
        ← {chapter.title}
      </Link>

      <header className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          <span aria-hidden className="mr-2">
            {room.icon}
          </span>
          {room.title}
        </h1>
        {room.description ? (
          <p className="mt-2 text-base text-neutral-600">{room.description}</p>
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

      <div className="mt-8 space-y-4">
        {others.map((item) => (
          <article
            key={item.id}
            className="rounded-3xl border border-neutral-200/80 bg-white/80 p-4 shadow-sm backdrop-blur"
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
