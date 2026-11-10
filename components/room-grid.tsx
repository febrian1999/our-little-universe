import Link from "next/link";
import { StarIcon } from "@/components/ui/sparkles";

export type RoomDoor = {
  id: string;
  key: string;
  title: string;
  icon: string;
  description: string | null;
  locked: boolean;
};

export function RoomGrid({
  chapterSlug,
  rooms,
}: {
  chapterSlug: string;
  rooms: RoomDoor[];
}) {
  return (
    <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <li key={room.id}>
          <Link
            href={`/${chapterSlug}/${room.key}`}
            className="glass-panel glass-panel-hover group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-6 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {/* Soft decorative glow background in card */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-pink-100/60 blur-xl transition group-hover:bg-pink-200/80"
            />

            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-13 items-center justify-center rounded-2xl bg-white/90 text-2xl shadow-xs ring-1 ring-pink-100 transition group-hover:scale-110">
                  <span aria-hidden>{room.icon}</span>
                </div>
                {room.locked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500">
                    <span aria-hidden>🔒</span>
                    Terkunci
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-pink-500 opacity-0 transition group-hover:opacity-100">
                    Masuk
                    <StarIcon className="size-3" />
                  </span>
                )}
              </div>

              <h2 className="mt-4 font-serif text-xl font-normal tracking-tight text-neutral-900 group-hover:text-pink-600">
                {room.title}
              </h2>

              {room.description ? (
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 line-clamp-2">
                  {room.description}
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between pt-2 text-xs text-neutral-400">
              <span className="tracking-widest uppercase">Room</span>
              <span className="font-mono text-neutral-400">#{room.key}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
