import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth";
import { getPrimaryChapter } from "@/lib/db/repositories/chapters";
import { safeNextPath } from "@/lib/security/paths";

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main id="konten" className="relative grid flex-1 place-items-center px-6 py-16">
      <div
        aria-hidden
        className="ambient bg-[radial-gradient(60%_50%_at_20%_10%,#fce7f3_0%,transparent_60%),radial-gradient(50%_45%_at_85%_85%,#dbeafe_0%,transparent_65%)]"
      />

      <section className="w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white/80 p-8 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Masuk
        </h1>
        <p className="mt-2 mb-6 text-base leading-relaxed text-neutral-600">
          Gerbang ini hanya terbuka untuk yang sudah diundang.
        </p>

        <Suspense
          fallback={
            <p className="min-h-24 text-sm text-neutral-500">Memuat…</p>
          }
        >
          <LoginPanel searchParams={props.searchParams} />
        </Suspense>
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
