import { Suspense } from "react";
import { openGateAction } from "@/app/actions";
import { SparklesIcon, StarIcon } from "@/components/ui/sparkles";
import { getPrimaryChapter } from "@/lib/db/repositories/chapters";

export default function LandingPage() {
  return (
    <main id="konten" className="relative grid min-h-dvh flex-1 place-items-center px-6 py-16">
      <div
        aria-hidden
        className="ambient ambient-fairy"
      />

      <section className="glass-panel relative w-full max-w-md overflow-hidden rounded-[2rem] p-8 text-center sm:p-10">
        {/* Glow ambient halus di atas kartu */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 size-48 -translate-x-1/2 rounded-full bg-pink-300/30 blur-2xl"
        />

        <div className="relative flex flex-col items-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-100 to-amber-100 text-pink-500 shadow-sm ring-1 ring-white/80">
            <SparklesIcon className="size-7" />
          </div>

          <p className="text-xs font-semibold tracking-widest text-pink-500 uppercase">
            A Safe Haven
          </p>

          <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight text-neutral-900 sm:text-4xl">
            Our Little Universe
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
            Sebuah ruang kecil untuk cerita, foto, dan lagu yang hanya kita yang
            tahu. Kalau gerbangnya terbuka, masuklah pelan-pelan.
          </p>

          <div className="mt-8 w-full">
            <Suspense fallback={<SkeletonGate />}>
              <GateCTA />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}

function SkeletonGate() {
  return (
    <>
      <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100/80 px-3 py-1 text-xs text-neutral-500 backdrop-blur-xs">
        <span aria-hidden className="size-2 animate-pulse rounded-full bg-neutral-400" />
        Memeriksa gerbang…
      </div>
      <button
        type="button"
        disabled
        className="tap mt-4 flex w-full cursor-not-allowed items-center justify-center rounded-full bg-neutral-200/80 px-6 text-sm font-semibold text-neutral-400"
      >
        Buka Gerbang
      </button>
    </>
  );
}

function ClosedGate() {
  return (
    <>
      <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100/90 px-3.5 py-1 text-xs font-medium text-neutral-600">
        <span aria-hidden className="size-2 rounded-full bg-neutral-400" />
        Gerbang masih tertutup
      </div>
      <button
        type="button"
        disabled
        aria-describedby="gate-note"
        className="tap mt-4 flex w-full cursor-not-allowed items-center justify-center rounded-full bg-neutral-200/70 px-6 text-sm font-semibold text-neutral-400"
      >
        Buka Gerbang
      </button>
      <p id="gate-note" className="mt-3 text-center text-xs leading-relaxed text-neutral-500">
        Belum ada yang membuka gerbang hari ini. Coba lagi nanti.
      </p>
    </>
  );
}

async function GateCTA() {
  const chapter = await getPrimaryChapter();
  if (!chapter?.gateOpen) return <ClosedGate />;

  return (
    <>
      <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3.5 py-1 text-xs font-semibold text-pink-600 ring-1 ring-pink-200/60">
        <span aria-hidden className="size-2 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]" />
        Gerbang Terbuka
      </div>
      <form action={openGateAction} className="mt-4">
        <input
          type="hidden"
          name="next"
          value={`/login?next=${encodeURIComponent(`/${chapter.slug}`)}`}
        />
        <button
          type="submit"
          className="btn-dreamy tap flex w-full items-center justify-center gap-2 px-6 text-sm font-semibold tracking-wide"
        >
          <StarIcon className="size-4" />
          <span>Buka Gerbang</span>
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-neutral-500">
        Silakan masuk dengan akun yang sudah diundang.
      </p>
    </>
  );
}
