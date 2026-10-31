"use client";

import { useState } from "react";

export type PlaylistItem = {
  id: string;
  title: string;
  url: string;
  embedUrl: string | null;
};

/** Satu iframe aktif pada satu waktu; tidak ada autoplay (PRD §7.2). */
export function PlaylistPlayer({ playlists }: { playlists: PlaylistItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <ul className="mt-8 space-y-3">
      {playlists.map((playlist) => {
        const isActive = active === playlist.id;
        return (
          <li
            key={playlist.id}
            className="rounded-3xl border border-neutral-200/80 bg-white/80 p-4 shadow-sm backdrop-blur"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-neutral-900">
                  {playlist.title}
                </p>
                <p className="text-xs text-neutral-500">Spotify</p>
              </div>

              <div className="flex items-center gap-3">
                {playlist.embedUrl ? (
                  <button
                    type="button"
                    onClick={() => setActive(isActive ? null : playlist.id)}
                    className="tap rounded-full bg-accent px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {isActive ? "Tutup" : "Putar"}
                  </button>
                ) : null}
                <a
                  href={playlist.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm text-accent underline"
                >
                  Buka di Spotify
                </a>
              </div>
            </div>

            {isActive && playlist.embedUrl ? (
              <iframe
                src={playlist.embedUrl}
                title={playlist.title}
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="mt-3 h-80 w-full rounded-2xl border-0"
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
