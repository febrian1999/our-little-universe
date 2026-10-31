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
    <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-4">
      <p className="text-sm font-semibold text-neutral-900">
        {title ?? "Lagu tempelan"}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {embedUrl ? (
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            className="tap rounded-full bg-primary px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {playing ? "Tutup lagu" : "Putar lagu"}
          </button>
        ) : null}
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-sm text-accent underline"
        >
          Buka di sumbernya
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
