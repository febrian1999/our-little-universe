// ponytail: gate masih statis sampai M4 menghubungkan chapters.gate_open.
const gateOpen = false;

export default function LandingPage() {
  return (
    <main className="relative grid flex-1 place-items-center px-6 py-16">
      <div
        aria-hidden
        className="ambient bg-[radial-gradient(60%_50%_at_20%_10%,#fce7f3_0%,transparent_60%),radial-gradient(50%_45%_at_85%_85%,#dbeafe_0%,transparent_65%)]"
      />

      <section className="w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white/80 p-8 shadow-sm backdrop-blur">
        <p className="flex items-center gap-2 text-sm text-neutral-600">
          <span
            aria-hidden
            className={`size-2 rounded-full ${gateOpen ? "bg-primary" : "bg-neutral-400"}`}
          />
          {gateOpen ? "Gerbang terbuka" : "Gerbang masih tertutup"}
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-900">
          Our Little Universe
        </h1>

        <p className="mt-3 text-base leading-relaxed text-neutral-600">
          Sebuah ruang kecil untuk cerita, foto, dan lagu yang hanya kita yang
          tahu. Kalau gerbangnya terbuka, masuklah pelan-pelan.
        </p>

        <div className="mt-8">
          {gateOpen ? (
            <a
              href="/login"
              className="tap flex w-full items-center justify-center rounded-full bg-accent px-6 text-base font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Buka Gerbang
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-describedby="gate-closed"
              className="tap flex w-full cursor-not-allowed items-center justify-center rounded-full bg-neutral-200 px-6 text-base font-semibold text-neutral-500"
            >
              Buka Gerbang
            </button>
          )}

          <p
            id="gate-closed"
            className="mt-3 text-center text-sm text-neutral-500"
          >
            {gateOpen
              ? "Silakan masuk dengan akun yang sudah diundang."
              : "Belum ada yang membuka gerbang hari ini. Coba lagi nanti."}
          </p>
        </div>
      </section>
    </main>
  );
}
