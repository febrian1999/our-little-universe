"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cloudinaryLoader } from "@/lib/media/image-loader";

export type Photo = {
  id: string;
  publicId: string;
  caption: string | null;
};

/** Grid foto + lightbox; Esc menutup, panah kiri/kanan berpindah (PRD §7.3). */
export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowRight") {
        setOpen((index) => (index === null ? index : (index + 1) % photos.length));
      }
      if (event.key === "ArrowLeft") {
        setOpen((index) =>
          index === null ? index : (index - 1 + photos.length) % photos.length,
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  const current = open === null ? null : photos[open];

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={photo.caption ?? "Buka foto"}
              className="tap block w-full overflow-hidden rounded-2xl bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Image
                loader={cloudinaryLoader}
                src={photo.publicId}
                alt={photo.caption ?? ""}
                width={400}
                height={400}
                sizes="(max-width: 640px) 50vw, 33vw"
                className="size-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.caption ?? "Foto"}
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/85 p-4"
        >
          <Image
            loader={cloudinaryLoader}
            src={current.publicId}
            alt={current.caption ?? ""}
            width={1200}
            height={1200}
            sizes="100vw"
            className="max-h-[80dvh] w-auto rounded-2xl object-contain"
          />
          <p className="text-center text-sm text-white/80">
            {current.caption ? `${current.caption} · ` : ""}Esc untuk menutup
          </p>
        </div>
      ) : null}
    </>
  );
}
