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
            className="group relative flex h-full min-h-[185px] flex-col justify-between overflow-hidden rounded-[26px] border border-white/90 bg-white/85 p-6 shadow-[0_10px_25px_rgba(190,24,93,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_32px_rgba(190,24,93,0.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {/* Legacy signature corner circle decoration */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-7 -top-7 size-28 rounded-full bg-pink-100/70 transition-transform duration-300 group-hover:scale-110"
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-white/95 text-3xl shadow-xs ring-1 ring-pink-100/80 transition-transform duration-300 group-hover:scale-110">
                  <span
                    aria-hidden
                    className="filter drop-shadow-[0_4px_6px_rgba(244,114,182,0.35)]"
                  >
                    {room.icon}
                  </span>
                </div>
                {room.locked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-pink-50/80 px-2.5 py-1 text-xs font-medium text-neutral-500">
                    <span aria-hidden>🔒</span>
                    Terkunci
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-pink-50/80 px-2.5 py-1 text-xs font-semibold text-[#be185d] opacity-90 transition group-hover:bg-pink-500 group-hover:text-white">
                    Masuk
                    <StarIcon className="size-3" />
                  </span>
                )}
              </div>

              <h2 className="mt-5 font-serif text-xl font-medium tracking-tight text-[#be185d] transition group-hover:text-pink-600">
                {room.title}
              </h2>

              {room.description ? (
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#79677f]">
                  {room.description}
                </p>
              ) : null}
            </div>

            <div className="relative z-10 mt-5 flex items-center justify-between border-t border-pink-100/50 pt-3 text-xs text-[#79677f]">
              <span className="font-medium tracking-wider uppercase">Ruangan</span>
              <span className="font-mono text-neutral-400">#{room.key}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
