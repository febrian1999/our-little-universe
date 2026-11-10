"use client";

import { useState } from "react";

/** Kartu lagu tempelan: embed dimuat setelah diketuk, tanpa autoplay. */
export function SongCard({
  title,
  embedUrl,
  externalUrl,
}: {
  title: string | null;
  embedUrl: string | null;
  externalUrl: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="glass-panel overflow-hidden rounded-2xl p-5 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-pink-100 text-pink-500">
          <span aria-hidden className="text-lg">🎵</span>
        </div>
        <div>
          <p className="font-serif text-base font-medium text-neutral-900">
            {title ?? "Lagu kenangan"}
          </p>
          <span className="text-xs text-neutral-400">Track embed</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {embedUrl ? (
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            className="tap rounded-full bg-pink-600 px-4 text-xs font-semibold tracking-wide text-white transition hover:bg-pink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
          >
            {playing ? "Tutup lagu" : "Putar lagu"}
          </button>
        ) : null}
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs font-medium text-pink-600 underline decoration-pink-300 underline-offset-2 transition hover:text-pink-700"
        >
          Buka di sumbernya ↗
        </a>
      </div>

      {playing && embedUrl ? (
        <iframe
          src={embedUrl}
          title={title ?? "Lagu"}
          loading="lazy"
          allow="encrypted-media; clipboard-write; picture-in-picture"
          className="mt-3 h-40 w-full rounded-xl border-0"
        />
      ) : null}
    </div>
  );
}
