export type PlaylistItem = {
  id: string;
  title: string;
  url: string;
  embedUrl: string | null;
};

/** Semua playlist tampil terbuka; tidak ada toggle buka/tutup (PRD §7.2: tanpa autoplay). */
export function PlaylistPlayer({ playlists }: { playlists: PlaylistItem[] }) {
  return (
    <div className="space-y-6">
      {/* Legacy Vinyl Turntable Hero Card */}
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink-500 via-purple-500 to-sky-400 p-6 text-center text-white shadow-[0_16px_36px_rgba(219,39,119,0.22)]">
        <div className="mx-auto mb-4 flex size-36 items-center justify-center">
          <div className="flex size-32 animate-spin-slow items-center justify-center rounded-full border-4 border-white/40 bg-radial from-[#37313e] via-[#25202a] to-[#17141b] shadow-2xl">
            <div className="flex size-12 items-center justify-center rounded-full border-2 border-white bg-gradient-to-tr from-pink-200 to-purple-200 text-xl font-bold text-pink-700 shadow-inner">
              🎵
            </div>
          </div>
        </div>

        <h2 className="font-serif text-2xl font-normal tracking-tight">
          Music Room Turntable
        </h2>
        <p className="mt-1 text-xs text-white/85">
          Lagu kenangan kita, siap diputar kapan saja ✨
        </p>

        <div className="mt-3 inline-block rounded-full bg-white/20 px-3.5 py-1 text-[11px] font-medium tracking-wider uppercase backdrop-blur-xs">
          Playing
        </div>
      </div>

      <ul className="space-y-3">
        {playlists.map((playlist) => (
          <li
            key={playlist.id}
            className="glass-panel overflow-hidden rounded-3xl p-5 shadow-xs transition hover:border-pink-300/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-pink-100/70 text-xl ring-1 ring-pink-200/60">
                  <span aria-hidden>🎧</span>
                </div>
                <div>
                  <p className="font-serif text-lg font-medium text-neutral-900">
                    {playlist.title}
                  </p>
                  <p className="text-xs text-neutral-400">Spotify Playlist</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={playlist.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs font-medium text-pink-600 underline decoration-pink-300 underline-offset-2 transition hover:text-pink-700"
                >
                  Buka di Spotify ↗
                </a>
              </div>
            </div>

            {playlist.embedUrl ? (
              <iframe
                src={playlist.embedUrl}
                title={playlist.title}
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="mt-4 h-80 w-full rounded-2xl border-0 shadow-inner"
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
