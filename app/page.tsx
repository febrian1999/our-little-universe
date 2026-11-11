import { Suspense } from "react";
import { openGateAction } from "@/app/actions";
import { AmbientSky } from "@/components/ambient-sky";
import { SparklesIcon, StarIcon } from "@/components/ui/sparkles";
import { getPrimaryChapter } from "@/lib/db/repositories/chapters";

export default function LandingPage() {
  return (
    <main id="konten" className="relative grid min-h-dvh flex-1 place-items-center px-6 py-16">
      <div
        aria-hidden
        className="ambient ambient-fairy"
      />
      <AmbientSky />

      <section className="glass-panel relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] p-8 text-center shadow-[0_20px_50px_rgba(236,72,153,0.18)] sm:p-10">
        {/* Glow ambient halus di atas kartu */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 size-48 -translate-x-1/2 rounded-full bg-pink-300/30 blur-2xl"
        />

        <div className="relative flex flex-col items-center">
          {/* Legacy ribbon badge */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-pink-500 px-4 py-1.5 text-xs font-semibold text-white shadow-xs">
            <SparklesIcon className="size-3.5" />
            <span>Princess × Guardian</span>
          </div>

          {/* Castle bounce icon with drop-shadow */}
          <div className="my-2 text-6xl select-none filter drop-shadow-[0_8px_12px_rgba(244,114,182,0.45)]">
            🏰
          </div>

          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#be185d] sm:text-4xl">
            Our Little Universe
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[#79677f] sm:text-base">
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
