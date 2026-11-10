import Link from "next/link";
import { requireRole } from "@/lib/auth";

/** Admin membaca sesi di setiap request; shell statis tidak berguna di sini. */
export const instant = false;

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const user = await requireRole("editor");

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white/80 px-6 py-4 backdrop-blur">
        <nav className="mx-auto flex max-w-4xl items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-semibold text-neutral-900">
              Admin
            </Link>
            <Link href="/admin/chapters" className="text-neutral-700">
              Chapter
            </Link>
            <Link href="/admin/history" className="text-neutral-700">
              History
            </Link>
            <Link href="/admin/settings" className="text-neutral-700">
              Setelan
            </Link>
            <Link href="/" className="text-accent underline">
              Halaman utama
            </Link>
          </div>
          <span className="text-neutral-500">
            {user.name} · {user.role}
          </span>
        </nav>
      </header>

      <main id="konten" className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
