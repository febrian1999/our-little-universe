import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { SparklesIcon } from "@/components/ui/sparkles";
import { getSession } from "@/lib/auth";
import { getPrimaryChapter } from "@/lib/db/repositories/chapters";
import { safeNextPath } from "@/lib/security/paths";

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main id="konten" className="relative grid min-h-dvh flex-1 place-items-center px-6 py-16">
      <div
        aria-hidden
        className="ambient ambient-fairy"
      />

      <section className="glass-panel relative w-full max-w-md overflow-hidden rounded-[2rem] p-8 text-center sm:p-10">
        {/* Glow ambient halus */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 size-40 -translate-x-1/2 rounded-full bg-pink-300/30 blur-2xl"
        />

        <div className="relative flex flex-col items-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-100 to-amber-100 text-pink-500 shadow-xs ring-1 ring-white/80">
            <SparklesIcon className="size-6" />
          </div>

          <p className="text-xs font-semibold tracking-widest text-pink-500 uppercase">
            Identitas Pengunjung
          </p>

          <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight text-neutral-900">
            Masuk
          </h1>

          <p className="mt-2 mb-6 text-sm leading-relaxed text-neutral-600">
            Gerbang ini hanya terbuka untuk yang sudah diundang.
          </p>

          <Suspense
            fallback={
              <div className="flex min-h-24 items-center justify-center gap-2 text-xs text-neutral-500">
                <span aria-hidden className="size-2 animate-pulse rounded-full bg-pink-400" />
                Memuat formulir…
              </div>
            }
          >
            <LoginPanel searchParams={props.searchParams} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

async function LoginPanel({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const params = await searchParams;
  const next =
    typeof params.next === "string" ? (safeNextPath(params.next) ?? null) : null;

  if (await getSession()) {
    const chapter = await getPrimaryChapter();
    redirect(next ?? (chapter ? `/${chapter.slug}` : "/"));
  }

  return <LoginForm next={next ?? undefined} />;
}
