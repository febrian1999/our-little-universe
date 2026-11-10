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
            className="glass-panel overflow-hidden rounded-3xl p-5 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
                  <span aria-hidden className="text-xl">📻</span>
                </div>
                <div>
                  <p className="font-serif text-lg font-medium text-neutral-900">
                    {playlist.title}
                  </p>
                  <p className="text-xs text-neutral-400">Spotify Playlist</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {playlist.embedUrl ? (
                  <button
                    type="button"
                    onClick={() => setActive(isActive ? null : playlist.id)}
                    className="tap rounded-full bg-pink-600 px-5 text-xs font-semibold text-white transition hover:bg-pink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
                  >
                    {isActive ? "Tutup" : "Putar"}
                  </button>
                ) : null}
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
