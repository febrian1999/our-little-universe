import { connection } from "next/server";
import Link from "next/link";
import { SparklesIcon } from "@/components/ui/sparkles";
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
    {
      label: `Kunjungan ${DAYS} hari`,
      value: stats.totals.room_view ?? 0,
      gradient: "from-pink-500/10 via-rose-500/10 to-purple-500/10",
      accent: "text-pink-600",
      icon: "✨",
    },
    {
      label: "Hari berkunjung",
      value: stats.series.filter((day) => day.views > 0).length,
      gradient: "from-purple-500/10 via-indigo-500/10 to-sky-500/10",
      accent: "text-purple-600",
      icon: "🌙",
    },
    {
      label: "Kenangan aktif",
      value: items,
      gradient: "from-amber-500/10 via-orange-500/10 to-pink-500/10",
      accent: "text-amber-600",
      icon: "💎",
    },
    {
      label: `Unggahan ${DAYS} hari`,
      value: stats.totals.upload ?? 0,
      gradient: "from-sky-500/10 via-teal-500/10 to-emerald-500/10",
      accent: "text-sky-600",
      icon: "📸",
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-pink-100/70 px-3 py-0.5 text-xs font-semibold text-pink-600">
            <SparklesIcon className="size-3.5" />
            <span>Overview</span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight text-neutral-900">
            Dashboard
          </h1>
        </div>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map((card) => (
          <li
            key={card.label}
            className={`glass-panel relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-4 transition-all duration-200 hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl" aria-hidden>{card.icon}</span>
              <span className={`text-2xl font-semibold tracking-tight ${card.accent}`}>
                {card.value}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-neutral-600">{card.label}</p>
          </li>
        ))}
      </ul>

      <section className="glass-panel mt-8 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">
            Kunjungan {DAYS} hari terakhir
          </h2>
          <span className="text-xs font-medium text-neutral-500">
            Puncak: {peak} kunjungan
          </span>
        </div>
        <ul className="mt-5 flex h-36 items-end gap-1.5 rounded-xl bg-pink-50/30 p-2 sm:gap-2">
          {stats.series.map((day) => {
            const heightPercent = Math.max(8, Math.round((day.views / peak) * 100));
            return (
              <li key={day.day} className="group relative flex h-full flex-1 items-end">
                <div
                  title={`${day.day}: ${day.views} kunjungan, ${day.uniques} unik`}
                  style={{ height: `${heightPercent}%` }}
                  className="w-full rounded-t-md bg-gradient-to-t from-pink-500 to-purple-400 transition-all group-hover:from-pink-400 group-hover:to-amber-300"
                />
              </li>
            );
          })}
        </ul>
        <p className="mt-2.5 text-right text-[11px] text-neutral-400">
          Zona waktu Asia/Jakarta
        </p>
      </section>

      <section className="glass-panel mt-8 rounded-2xl p-5">
        <div className="flex items-center justify-between border-b border-pink-100/60 pb-3">
          <h2 className="text-sm font-semibold text-neutral-900">
            Kunjungan terakhir
          </h2>
          <Link href="/admin/history" className="text-xs font-semibold text-pink-600 hover:text-pink-700">
            Semua history →
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-pink-50 text-sm">
          {recent.rows.map((visit) => (
            <li
              key={visit.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
                <span className="rounded-full bg-pink-100/80 px-2 py-0.5 text-[11px] font-medium text-pink-700">
                  {visit.action}
                </span>
                <span className="truncate text-xs text-neutral-700 sm:text-sm">
                  {visit.roomTitle ? `${visit.roomTitle}` : ""}
                  {visit.path ? ` · ${visit.path}` : ""}
                </span>
              </div>
              <span className="shrink-0 text-xs text-neutral-400">
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
            <li className="py-3 text-center text-xs text-neutral-400">Belum ada kunjungan tercatat.</li>
          ) : null}
        </ul>
      </section>

      <section className="glass-panel mt-8 rounded-2xl p-5">
        <div className="flex items-center justify-between border-b border-pink-100/60 pb-3">
          <h2 className="text-sm font-semibold text-neutral-900">Konten Ruangan</h2>
          <Link
            href="/admin/chapters"
            className="text-xs font-semibold text-pink-600 hover:text-pink-700"
          >
            Kelola chapter →
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="py-2">Chapter</th>
                <th className="py-2">Ruangan</th>
                <th className="py-2">Status Gerbang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {roomsPerChapter.map(({ chapter, rooms }) => (
                <tr key={chapter.id} className="hover:bg-pink-50/20">
                  <td className="py-2.5">
                    <Link
                      href={`/admin/chapters/${chapter.id}`}
                      className="font-medium text-pink-600 hover:underline"
                    >
                      {chapter.title}
                    </Link>
                  </td>
                  <td className="py-2.5 text-neutral-600">{rooms.length} ruang</td>
                  <td className="py-2.5">
                    {chapter.gateOpen ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Terbuka
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                        <span className="size-1.5 rounded-full bg-neutral-400" />
                        Tertutup
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {roomsPerChapter.length === 0 ? (
                <tr>
                  <td className="py-3 text-neutral-400" colSpan={3}>
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
