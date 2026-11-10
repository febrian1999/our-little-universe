import Link from "next/link";
import { createChapterAction } from "@/app/admin/actions";
import { Field, Notice } from "@/components/admin/form";
import { listChapters } from "@/lib/db/repositories/chapters";

export default async function ChaptersPage(props: PageProps<"/admin/chapters">) {
  const chapters = await listChapters();
  const query = await props.searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Chapter
      </h1>
      <Notice
        error={typeof query.error === "string" ? query.error : undefined}
        ok={typeof query.ok === "string" ? query.ok : undefined}
      />

      <ul className="mt-6 space-y-2">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <Link
              href={`/admin/chapters/${chapter.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm hover:border-primary"
            >
              <span className="font-semibold text-neutral-900">
                {chapter.title}
              </span>
              <span className="text-neutral-500">
                /{chapter.slug}
                {chapter.gateOpen ? " · gerbang terbuka" : ""}
              </span>
            </Link>
          </li>
        ))}
        {chapters.length === 0 ? (
          <li className="text-sm text-neutral-500">Belum ada chapter.</li>
        ) : null}
      </ul>

      <h2 className="mt-10 text-lg font-semibold text-neutral-900">
        Chapter baru
      </h2>
      <form
        action={createChapterAction}
        className="mt-4 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-2"
      >
        <Field label="Slug" name="slug" placeholder="anniversary" required />
        <Field label="Judul" name="title" placeholder="Anniversary" required />
        <Field label="Subjudul" name="subtitle" placeholder="Opsional" />
        <Field label="Mulai" name="startsAt" type="date" />
        <button type="submit" className="btn-primary sm:col-span-2">
          Simpan chapter
        </button>
      </form>
    </>
  );
}
