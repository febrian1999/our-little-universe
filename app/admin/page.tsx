import { connection } from "next/server";
import Link from "next/link";
import { listChapters } from "@/lib/db/repositories/chapters";
import { countActiveItems } from "@/lib/db/repositories/items";
import { listRooms } from "@/lib/db/repositories/rooms";
import { listVisits, visitStats } from "@/lib/db/repositories/visits";

const DAYS = 14;

export default async function DashboardPage() {
  // Statistik memakai `new Date()`, jadi harus setelah request dimulai.
  await connection();
  const [stats, recent, items, chapters] = await Promise.all([
    visitStats(DAYS),
    listVisits({ limit: 8 }),
    countActiveItems(),
    listChapters(),
  ]);

  const roomsPerChapter = await Promise.all(
    chapters.map(async (chapter) => ({
      chapter,
      rooms: await listRooms(chapter.id),
    })),
  );

  const peak = Math.max(1, ...stats.series.map((day) => day.views));
  const kpi = [
    { label: `Kunjungan room ${DAYS} hari`, value: stats.totals.room_view ?? 0 },
    {
      label: "Hari dengan kunjungan",
      value: stats.series.filter((day) => day.views > 0).length,
    },
    { label: "Kenangan aktif", value: items },
    { label: `Unggahan ${DAYS} hari`, value: stats.totals.upload ?? 0 },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Dashboard
      </h1>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map((card) => (
          <li
            key={card.label}
            className="rounded-2xl border border-neutral-200 bg-white p-4"
          >
            <p className="text-2xl font-semibold text-neutral-900">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-neutral-500">{card.label}</p>
          </li>
        ))}
      </ul>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Kunjungan {DAYS} hari terakhir
        </h2>
        <ul className="mt-4 flex h-32 items-end gap-1">
          {stats.series.map((day) => (
            <li key={day.day} className="flex-1">
              <div
                title={`${day.day}: ${day.views} kunjungan, ${day.uniques} unik`}
                style={{ height: `${Math.round((day.views / peak) * 100)}%` }}
                className="min-h-1 w-full rounded-t bg-primary/70"
              />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-neutral-500">
          Puncak {peak} kunjungan/hari · zona waktu Asia/Jakarta
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">
            Kunjungan terakhir
          </h2>
          <Link href="/admin/history" className="text-sm text-accent underline">
            Semua history
          </Link>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {recent.rows.map((visit) => (
            <li
              key={visit.id}
              className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-2 last:border-0"
            >
              <span className="min-w-0 flex-1 truncate text-neutral-800">
                <span className="font-semibold">{visit.action}</span>
                {visit.roomTitle ? ` · ${visit.roomTitle}` : ""}
                {visit.path ? ` · ${visit.path}` : ""}
              </span>
              <span className="shrink-0 text-xs text-neutral-500">
                {visit.userName ?? "tamu"} ·{" "}
                {visit.createdAt.toLocaleString("id-ID", {
                  timeZone: "Asia/Jakarta",
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </li>
          ))}
          {recent.rows.length === 0 ? (
            <li className="text-neutral-500">Belum ada kunjungan.</li>
          ) : null}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Konten</h2>
          <Link
            href="/admin/chapters"
            className="text-sm text-accent underline"
          >
            Kelola chapter
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-neutral-500">
              <tr>
                <th className="py-2">Chapter</th>
                <th className="py-2">Ruangan</th>
                <th className="py-2">Gerbang</th>
              </tr>
            </thead>
            <tbody>
              {roomsPerChapter.map(({ chapter, rooms }) => (
                <tr key={chapter.id} className="border-t border-neutral-100">
                  <td className="py-2">
                    <Link
                      href={`/admin/chapters/${chapter.id}`}
                      className="text-accent underline"
                    >
                      {chapter.title}
                    </Link>
                  </td>
                  <td className="py-2 text-neutral-600">{rooms.length}</td>
                  <td className="py-2 text-neutral-600">
                    {chapter.gateOpen ? "terbuka" : "tertutup"}
                  </td>
                </tr>
              ))}
              {roomsPerChapter.length === 0 ? (
                <tr>
                  <td className="py-2 text-neutral-500" colSpan={3}>
                    Belum ada chapter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
