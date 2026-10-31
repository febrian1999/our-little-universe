import Link from "next/link";
import { connection } from "next/server";
import { listAudit } from "@/lib/db/repositories/audit";
import { visitAction, auditEntity } from "@/lib/db/schema";
import { listVisits } from "@/lib/db/repositories/visits";

const LIMIT = 50;
const ACTIONS = visitAction.enumValues;
const ENTITIES = auditEntity.enumValues;

const str = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : undefined;

function when(date: Date) {
  return date.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function pageHref(query: Record<string, unknown>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "page" || typeof value !== "string") continue;
    params.set(key, value);
  }
  params.set("page", String(page));
  return `/admin/history?${params.toString()}`;
}

export default async function HistoryPage(
  props: PageProps<"/admin/history">,
) {
  const query = await props.searchParams;
  await connection();
  const tab = str(query.tab) === "changes" ? "changes" : "visits";
  const page = Math.max(1, Number.parseInt(str(query.page) ?? "1", 10) || 1);
  const offset = (page - 1) * LIMIT;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        History
      </h1>

      <nav className="mt-4 flex gap-2 text-sm">
        <Link
          href="/admin/history"
          aria-current={tab === "visits" ? "page" : undefined}
          className={`tap rounded-full px-4 py-2 ${
            tab === "visits"
              ? "bg-accent text-white"
              : "border border-neutral-300 text-neutral-700"
          }`}
        >
          Kunjungan
        </Link>
        <Link
          href="/admin/history?tab=changes"
          aria-current={tab === "changes" ? "page" : undefined}
          className={`tap rounded-full px-4 py-2 ${
            tab === "changes"
              ? "bg-accent text-white"
              : "border border-neutral-300 text-neutral-700"
          }`}
        >
          Perubahan
        </Link>
      </nav>

      {tab === "visits" ? (
        <VisitsTab query={query} page={page} offset={offset} />
      ) : (
        <ChangesTab query={query} page={page} offset={offset} />
      )}
    </>
  );
}

async function VisitsTab({
  query,
  page,
  offset,
}: {
  query: Record<string, unknown>;
  page: number;
  offset: number;
}) {
  const action = ACTIONS.find((value) => value === str(query.action));
  const from = str(query.from);
  const to = str(query.to);
  const includeHidden = str(query.all) === "1";

  const { rows, hasNext } = await listVisits({
    action,
    from,
    to,
    includeHidden,
    offset,
    limit: LIMIT,
  });

  return (
    <>
      <form
        method="get"
        className="mt-4 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-4"
      >
        <label className="text-sm text-neutral-700">
          <span className="mb-1 block font-medium">Aksi</span>
          <select
            name="action"
            defaultValue={action ?? ""}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base"
          >
            <option value="">Semua</option>
            {ACTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-neutral-700">
          <span className="mb-1 block font-medium">Dari</span>
          <input
            type="date"
            name="from"
            defaultValue={from ?? ""}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base"
          />
        </label>
        <label className="text-sm text-neutral-700">
          <span className="mb-1 block font-medium">Sampai</span>
          <input
            type="date"
            name="to"
            defaultValue={to ?? ""}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base"
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            name="all"
            value="1"
            defaultChecked={includeHidden}
            className="size-4"
          />
          Tampilkan semua
        </label>
        <button type="submit" className="btn-primary sm:col-span-4">
          Terapkan filter
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-2">Waktu</th>
              <th className="px-4 py-2">Aksi</th>
              <th className="px-4 py-2">Siapa</th>
              <th className="px-4 py-2">Room</th>
              <th className="px-4 py-2">Path</th>
              <th className="px-4 py-2">Terlihat</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-neutral-100">
                <td className="whitespace-nowrap px-4 py-2 text-neutral-600">
                  {when(row.createdAt)}
                </td>
                <td className="px-4 py-2 font-semibold text-neutral-900">
                  {row.action}
                </td>
                <td className="px-4 py-2 text-neutral-600">
                  {row.userName ?? "tamu"}
                </td>
                <td className="px-4 py-2 text-neutral-600">
                  {row.roomTitle ?? "—"}
                </td>
                <td className="px-4 py-2 text-neutral-600">{row.path ?? "—"}</td>
                <td className="px-4 py-2 text-neutral-600">
                  {row.visible ? "ya" : "tidak"}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-neutral-500" colSpan={6}>
                  Belum ada kunjungan yang cocok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pager query={query} page={page} hasNext={hasNext} />
    </>
  );
}

async function ChangesTab({
  query,
  page,
  offset,
}: {
  query: Record<string, unknown>;
  page: number;
  offset: number;
}) {
  const entity = ENTITIES.find((value) => value === str(query.entity));
  const { rows, hasNext } = await listAudit({ entity, offset, limit: LIMIT });

  return (
    <>
      <form
        method="get"
        className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-4"
      >
        <input type="hidden" name="tab" value="changes" />
        <label className="text-sm text-neutral-700">
          <span className="mb-1 block font-medium">Entitas</span>
          <select
            name="entity"
            defaultValue={entity ?? ""}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-base"
          >
            <option value="">Semua</option>
            {ENTITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary px-6">
          Terapkan
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-2">Waktu</th>
              <th className="px-4 py-2">Aksi</th>
              <th className="px-4 py-2">Entitas</th>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Oleh</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-neutral-100">
                <td className="whitespace-nowrap px-4 py-2 text-neutral-600">
                  {when(row.createdAt)}
                </td>
                <td className="px-4 py-2 font-semibold text-neutral-900">
                  {row.action}
                </td>
                <td className="px-4 py-2 text-neutral-600">{row.entity}</td>
                <td className="px-4 py-2 font-mono text-xs text-neutral-500">
                  {row.entityId.slice(0, 8)}
                </td>
                <td className="px-4 py-2 text-neutral-600">
                  {row.actorName ?? "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-neutral-500" colSpan={5}>
                  Belum ada perubahan yang cocok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pager query={query} page={page} hasNext={hasNext} />
    </>
  );
}

function Pager({
  query,
  page,
  hasNext,
}: {
  query: Record<string, unknown>;
  page: number;
  hasNext: boolean;
}) {
  if (page === 1 && !hasNext) return null;
  return (
    <nav className="mt-6 flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link
          href={pageHref(query, page - 1)}
          className="tap inline-flex items-center text-accent underline"
        >
          ← Sebelumnya
        </Link>
      ) : (
        <span />
      )}
      {hasNext ? (
        <Link
          href={pageHref(query, page + 1)}
          className="tap inline-flex items-center text-accent underline"
        >
          Berikutnya →
        </Link>
      ) : null}
    </nav>
  );
}
