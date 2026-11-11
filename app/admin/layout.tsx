import Link from "next/link";
import { SparklesIcon } from "@/components/ui/sparkles";
import { requireRole } from "@/lib/auth";

/** Admin membaca sesi di setiap request; shell statis tidak berguna di sini. */
export const instant = false;

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const user = await requireRole("editor");

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div aria-hidden className="ambient ambient-admin" />

      <header className="sticky top-0 z-40 px-4 py-3 sm:px-6">
        <nav className="glass-panel mx-auto flex max-w-4xl items-center justify-between gap-4 rounded-full px-5 py-2.5 text-sm shadow-xs">
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-serif font-medium text-neutral-900 transition hover:bg-pink-100/60"
            >
              <SparklesIcon className="size-4 text-pink-500" />
              <span>Admin</span>
            </Link>
            <Link
              href="/admin/chapters"
              className="rounded-full px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100/80 sm:text-sm"
            >
              Chapter
            </Link>
            <Link
              href="/admin/history"
              className="rounded-full px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100/80 sm:text-sm"
            >
              History
            </Link>
            {user.role === "owner" ? (
              <Link
                href="/admin/access"
                className="rounded-full px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100/80 sm:text-sm"
              >
                Akses
              </Link>
            ) : null}
            <Link
              href="/admin/settings"
              className="rounded-full px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100/80 sm:text-sm"
            >
              Setelan
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-xs font-semibold text-pink-600 hover:text-pink-700 sm:inline"
            >
              ← Halaman utama
            </Link>
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 ring-1 ring-pink-100">
              <span className="size-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-neutral-700">
                {user.name}
              </span>
              <span className="rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-pink-600 uppercase">
                {user.role}
              </span>
            </div>
          </div>
        </nav>
      </header>

      <main id="konten" className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
