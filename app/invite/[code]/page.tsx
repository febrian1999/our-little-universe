import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { SparklesIcon } from "@/components/ui/sparkles";

// PRD §5.2: sebelum login halaman hanya menampilkan copy generik. Kode
// divalidasi di server saat redeem, bukan di sini.
export default function InvitePage(props: PageProps<"/invite/[code]">) {
  return (
    <main id="konten" className="relative grid min-h-dvh flex-1 place-items-center px-6 py-16">
      <div
        aria-hidden
        className="ambient ambient-fairy"
      />

      <section className="glass-panel relative w-full max-w-md overflow-hidden rounded-[2rem] p-8 text-center sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 size-40 -translate-x-1/2 rounded-full bg-pink-300/30 blur-2xl"
        />

        <div className="relative flex flex-col items-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-100 to-amber-100 text-pink-500 shadow-xs ring-1 ring-white/80">
            <SparklesIcon className="size-6" />
          </div>

          <p className="text-xs font-semibold tracking-widest text-pink-500 uppercase">
            Special Invitation
          </p>

          <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight text-neutral-900">
            Sebuah Undangan
          </h1>

          <p className="mt-2 mb-6 text-sm leading-relaxed text-neutral-600">
            Masuk dengan akun yang menerima undangan ini. Kalau tautannya sudah
            kedaluwarsa, pintunya akan tetap tertutup.
          </p>

          <Suspense
            fallback={
              <div className="flex min-h-24 items-center justify-center gap-2 text-xs text-neutral-500">
                <span aria-hidden className="size-2 animate-pulse rounded-full bg-pink-400" />
                Memuat undangan…
              </div>
            }
          >
            <InvitePanel params={props.params} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

async function InvitePanel({
  params,
}: {
  params: PageProps<"/invite/[code]">["params"];
}) {
  const { code } = await params;
  return <LoginForm invite={code} />;
}
