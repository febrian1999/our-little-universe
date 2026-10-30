import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

// PRD §5.2: sebelum login halaman hanya menampilkan copy generik. Kode
// divalidasi di server saat redeem, bukan di sini.
export default function InvitePage(props: PageProps<"/invite/[code]">) {
  return (
    <main className="relative grid flex-1 place-items-center px-6 py-16">
      <div
        aria-hidden
        className="ambient bg-[radial-gradient(60%_50%_at_20%_10%,#fce7f3_0%,transparent_60%),radial-gradient(50%_45%_at_85%_85%,#dbeafe_0%,transparent_65%)]"
      />

      <section className="w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white/80 p-8 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Sebuah undangan
        </h1>
        <p className="mt-2 mb-6 text-base leading-relaxed text-neutral-600">
          Masuk dengan akun yang menerima undangan ini. Kalau tautannya sudah
          kedaluwarsa, pintunya akan tetap tertutup.
        </p>

        <Suspense
          fallback={
            <p className="min-h-24 text-sm text-neutral-500">Memuat…</p>
          }
        >
          <InvitePanel params={props.params} />
        </Suspense>
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
