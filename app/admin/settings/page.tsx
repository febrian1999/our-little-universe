import { toggleGateAction } from "@/app/admin/actions";
import { Notice } from "@/components/admin/form";
import { requireRole } from "@/lib/auth";
import { listChapters } from "@/lib/db/repositories/chapters";

export default async function SettingsPage(
  props: PageProps<"/admin/settings">,
) {
  const user = await requireRole("editor");
  const isOwner = user.role === "owner";
  const query = await props.searchParams;
  const chapters = await listChapters();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Setelan
      </h1>
      <Notice
        error={typeof query.error === "string" ? query.error : undefined}
        ok={typeof query.ok === "string" ? query.ok : undefined}
      />

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-neutral-900">Gerbang</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Gerbang terbuka membuat landing menampilkan tombol masuk. Hanya
          pemilik yang bisa mengubahnya.
        </p>

        <ul className="mt-4 space-y-2">
          {chapters.map((chapter) => (
            <li
              key={chapter.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm"
            >
              <span>
                <span className="font-semibold text-neutral-900">
                  {chapter.title}
                </span>{" "}
                <span className="text-neutral-500">
                  · gerbang {chapter.gateOpen ? "terbuka" : "tertutup"}
                </span>
              </span>

              {isOwner ? (
                <form action={toggleGateAction}>
                  <input type="hidden" name="id" value={chapter.id} />
                  <button
                    type="submit"
                    className={`tap rounded-full px-4 text-sm font-semibold ${
                      chapter.gateOpen
                        ? "border border-neutral-300 text-neutral-700"
                        : "bg-accent text-white"
                    }`}
                  >
                    {chapter.gateOpen ? "Tutup gerbang" : "Buka gerbang"}
                  </button>
                </form>
              ) : (
                <span className="text-neutral-500">Hanya pemilik</span>
              )}
            </li>
          ))}
          {chapters.length === 0 ? (
            <li className="text-sm text-neutral-500">Belum ada chapter.</li>
          ) : null}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">Notifikasi</h2>
        <p className="mt-1 rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-600">
          Notifikasi Telegram belum aktif. Semua aksi tetap tercatat di{" "}
          <span className="font-medium">History</span>, jadi tidak ada yang
          hilang selama fitur ini ditunda.
        </p>
      </section>
    </>
  );
}
