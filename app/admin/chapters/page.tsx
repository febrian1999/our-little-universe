import Link from "next/link";
import { createChapterAction } from "@/app/admin/actions";
import { Field, Notice } from "@/components/admin/form";
import { SparklesIcon } from "@/components/ui/sparkles";
import { listChapters } from "@/lib/db/repositories/chapters";

export default async function ChaptersPage(props: PageProps<"/admin/chapters">) {
  const chapters = await listChapters();
  const query = await props.searchParams;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-pink-100/70 px-3 py-0.5 text-xs font-semibold text-pink-600">
            <SparklesIcon className="size-3.5" />
            <span>Manajemen Bab</span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight text-neutral-900">
            Chapter
          </h1>
        </div>
      </div>

      <Notice
        error={typeof query.error === "string" ? query.error : undefined}
        ok={typeof query.ok === "string" ? query.ok : undefined}
      />

      <ul className="mt-6 space-y-3">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <Link
              href={`/admin/chapters/${chapter.id}`}
              className="glass-panel glass-panel-hover flex items-center justify-between gap-3 rounded-2xl p-4 text-sm transition"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-pink-100/70 text-base">
                  📖
                </span>
                <div>
                  <span className="font-semibold text-neutral-900">
                    {chapter.title}
                  </span>
                  <p className="text-xs text-neutral-500">/{chapter.slug}</p>
                </div>
              </div>
              <div>
                {chapter.gateOpen ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/50">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Gerbang Terbuka
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                    <span className="size-1.5 rounded-full bg-neutral-400" />
                    Tertutup
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
        {chapters.length === 0 ? (
          <li className="glass-panel rounded-2xl p-6 text-center text-sm text-neutral-500">
            Belum ada chapter yang dibuat.
          </li>
        ) : null}
      </ul>

      <h2 className="mt-10 font-serif text-xl font-normal text-neutral-900">
        Tambah Chapter Baru
      </h2>
      <form
        action={createChapterAction}
        className="glass-panel mt-4 grid gap-4 rounded-2xl p-6 sm:grid-cols-2"
      >
        <Field label="Slug" name="slug" placeholder="anniversary" required />
        <Field label="Judul" name="title" placeholder="Anniversary" required />
        <Field label="Subjudul" name="subtitle" placeholder="Opsional" />
        <Field label="Mulai" name="startsAt" type="date" />
        <button type="submit" className="btn-dreamy mt-2 sm:col-span-2">
          Simpan Chapter ✨
        </button>
      </form>
    </>
  );
}
