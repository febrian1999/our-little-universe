import Link from "next/link";

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
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <li key={room.id}>
          <Link
            href={`/${chapterSlug}/${room.key}`}
            className="flex h-full flex-col gap-1 rounded-3xl border border-neutral-200/80 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span aria-hidden className="text-2xl">
              {room.icon}
            </span>
            <span className="text-lg font-semibold text-neutral-900">
              {room.title}
            </span>
            {room.description ? (
              <span className="text-sm leading-relaxed text-neutral-600">
                {room.description}
              </span>
            ) : null}
            {room.locked ? (
              <span className="mt-2 text-xs font-semibold text-neutral-500">
                Terkunci
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
