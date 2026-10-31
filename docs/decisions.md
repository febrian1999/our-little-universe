# Log Keputusan — Our Little Universe

Setiap perubahan pada keputusan teknis di `docs/PRD.md` §3, atau keputusan yang mengubah skema/biaya/hak akses, dicatat di sini. Satu keputusan = satu baris. Jangan mengubah baris lama; tambahkan baris baru jika keputusan berubah.

Format: `ID | tanggal | topik | keputusan | alasan | dampak`

---

## Keputusan aktif

| ID | Tanggal | Topik | Keputusan | Alasan | Dampak |
|---|---|---|---|---|---|
| D-001 | 2026-10-28 | Domain | Tetap `*.vercel.app`, tanpa domain kustom | Target biaya Rp 0 | R2 diakses lewat `pub-xxxx.r2.dev`; ganti `R2_PUBLIC_BASE` jika nanti beli domain |
| D-002 | 2026-10-28 | Akses ruangan Healing | `min_role = guest`; guest boleh melihat, tidak boleh mengedit | Isi tetap bisa dibaca orang terdekat | Semua room `min_role = guest`; batas tulis berbasis role |
| D-003 | 2026-10-28 | Kompresi video | Tidak ada kompresi/transcoding, video tampil apa adanya | Menghindari dependency dan pekerjaan tambahan | Kuota R2 10 GB jadi risiko utama |
| D-004 | 2026-10-28 | Izin upload | Hanya `owner`/`editor` | Mencegah spam dan isi tak terkontrol | `guest` read-only total |
| D-005 | 2026-10-28 | Nama event pertama | "Our Little Universe" | Nama proyek dipertahankan | Slug `our-little-universe` di seed |
| D-006 | 2026-10-28 | Tanggal 17 Sep 2026 | Tidak ditampilkan di UI | Bukan bagian cerita yang diinginkan | `events.starts_at` tetap ada sebagai data |
| D-007 | 2026-10-28 | Batas file video | 500 MB per file | Melindungi kuota R2 tanpa kompresi | Dicek di server sebelum presign |
| D-008 | 2026-10-28 | Guest upload | Dihapus total dari v1 | Tidak ada pemakai; mengurangi jalur mati | Key `settings.features` tidak dipakai |
| D-009 | 2026-10-28 | Salinan YouTube | Unlisted, URL ditempel manual; R2 tetap sumber utama | Unlisted bisa diputar tanpa akun Google dan tidak tampil di channel | Tidak perlu OAuth/`googleapis`; video besar cukup di YouTube |
| D-010 | 2026-10-28 | Lagu per postingan | Satu lagu opsional per item, kartu + embed, mulai otomatis | Meniru kebiasaan Instagram | Kolom `song_*` di `items`; autoplay jatuh ke sentuhan pertama jika diblokir |
| D-011 | 2026-10-28 | Owner pertama | `OWNER_EMAIL` di env; email `firdausfebrian666@gmail.com` | Jalur aman tanpa invite manual | Promosi ke `owner` saat login pertama |
| D-012 | 2026-10-28 | Tipe item | `photo`, `video`, `song`, `text`; `letter` dihapus | Semua tulisan cukup satu tipe | Enum berubah sebelum database dibuat |
| D-013 | 2026-10-28 | Akses konten | Login app wajib untuk semua konten | Gate dan invite tetap bermakna | Pemutaran YouTube tetap tanpa akun Google |
| D-014 | 2026-10-28 | Musik antar-room | Berhenti saat pindah room | Menghindari state global dan bug audio | Tidak ada mini-player di v1 |
| D-015 | 2026-10-28 | Hapus event | `owner` dan `editor` boleh | Editor dipercaya mengelola event | Penghapusan soft delete, bisa dipulihkan manual |
| D-016 | 2026-10-28 | Zona waktu | `Asia/Jakarta` untuk agregasi dan tampilan | Menghindari hari bergeser 7 jam | Semua query statistik memakai `at time zone 'Asia/Jakarta'` |
| D-017 | 2026-10-28 | Poster video | Ambil frame pertama di browser, unggah ke Cloudinary | Tidak perlu upload manual | Butuh langkah `canvas` di komponen upload |
| D-018 | 2026-10-28 | Hapus item | Hanya baris database; file Cloudinary/R2 tetap | Menghindari risiko salah hapus aset | Kuota R2 hanya bertambah; pembersihan manual di luar app |
| D-019 | 2026-10-28 | Kolom audit | Semua tabel punya `created_at`, `updated_at`, `updated_by` | Jejak perubahan jelas | Repository wajib mengisi `updated_by` |
| D-020 | 2026-10-28 | Soft delete | Semua penghapusan soft delete; tidak ada hard delete | Data tidak hilang permanen | Tidak ada `DELETE` di aplikasi; query filter `deleted_at is null` |
| D-021 | 2026-10-28 | Pengecualian soft delete | `visits` dan `settings` tanpa `deleted_at` | `visits` append-only; `settings` key-value tidak pernah dihapus | `visits` disembunyikan lewat `visible` |
| D-022 | 2026-10-28 | Kolom penghapus | Tambah `deleted_by` | Perlu tahu siapa yang menghapus, terutama karena editor boleh hapus event | Kolom uuid nullable di tabel yang punya `deleted_at` |
| D-023 | 2026-10-28 | Unique + soft delete | Semua unique menjadi partial unique index `where deleted_at is null` | Nilai bisa dipakai ulang setelah dihapus | `users.email`, `users.firebase_uid`, `events.slug`, `invites.code`, `rooms(event_id,key)` |
| D-024 | 2026-10-28 | Primary key invites | `id uuid` sebagai PK; `code` jadi kolom ber-index unik parsial | PK tidak bisa parsial, kode harus bisa dipakai ulang | Semua query invite memakai `code`, bukan PK |
| D-025 | 2026-10-28 | Pembersihan media | Skrip `prune-media` dibatalkan | Bertentangan dengan soft delete | File media disimpan selamanya; dikelola manual dari dashboard provider |
| D-026 | 2026-10-28 | Framework | Next.js **16.4.3**, versi dikunci persis | Versi stabil terbaru; proyek masih nol kode | Turbopack default; `params` tetap Promise; perlu cek breaking change CLI sebelum M1 |
| D-027 | 2026-10-28 | Styling | Tailwind CSS **4.3.3** + `@tailwindcss/postcss` | Versi stabil terbaru | Tanpa `tailwind.config.js`; tema lewat `@theme` di `globals.css` |
| D-028 | 2026-10-28 | TypeScript | Dikunci **5.9.3**; TS 7 ditunda | TS 7 native baru, ekosistem tooling belum tentu sinkron | Revisit setelah M1 stabil |
| D-029 | 2026-10-28 | Docker | Tidak dipakai | Neon cloud; tidak ada komponen yang perlu dikontainerkan | Uji migrasi memakai Neon branch |
| D-030 | 2026-10-28 | CD | Integrasi Git Vercel; tanpa pipeline deploy sendiri | Hobby gratis, preview per PR | Produksi hanya dari `main` |
| D-031 | 2026-10-28 | Migrasi database | Manual via `workflow_dispatch` + input `MIGRATE` | SQL hasil generate wajib dibaca dulu | Tidak ada auto-migrate saat merge |
| D-032 | 2026-10-28 | Proteksi `main` | GitHub Ruleset: PR wajib, `verify` wajib, force-push & hapus ditolak, tanpa bypass | Tidak ada push langsung ke `main` | Repo publik agar ruleset dan Actions gratis |
| D-033 | 2026-10-28 | Unit testing | Vitest + Testing Library; coverage `lib/` & `components/` ≥ 80% | Cepat, TS native, gratis | Test berdampingan dengan sumber; tanpa DB/jaringan |
| D-034 | 2026-10-28 | Audit log perubahan | Tabel `audit_logs` append-only, ditulis dalam transaksi mutasi lewat `lib/audit.ts` | `visits` hanya mencatat kunjungan, bukan perubahan data | Pengecualian D-019/D-020: hanya `created_at`, tanpa `updated_at`/`deleted_at`; ikut backup dan retensi permanen |
| D-035 | 2026-10-28 | Baseline keamanan | Header wajib sejak M1, cookie `__Host-olu_session`, `assertSameOrigin` untuk `/api/**`, URL allowlist, Zod `.strict()` + pemetaan field eksplisit, larangan `sql.raw`/`dangerouslySetInnerHTML`/`eval` | Empat area yang diminta: SQLi, CSRF, XSS, backdoor | Rincian di PRD §18; helper di `lib/security/` |
| D-036 | 2026-10-28 | Seed di produksi | `scripts/seed.ts` menolak jalan bila `NODE_ENV=production`; invite `DEMO2026` dan user demo hanya dibuat di dev | Seed produksi = backdoor guest yang bisa dipakai siapa pun | Seed hanya untuk database lokal/Neon branch |
| D-037 | 2026-10-28 | CSP | `Content-Security-Policy-Report-Only` di M6, enforcement dengan nonce di M8 | Risiko merusak embed YouTube/Spotify jika langsung enforce | Sumber diizinkan: self, Cloudinary, `pub-*.r2.dev`, YouTube, Spotify, GA4 |
| D-038 | 2026-10-28 | Env Preview | `DATABASE_URL` pada environment Preview Vercel wajib menunjuk Neon branch, bukan database produksi | PR terbuka bisa merusak data asli | Uji migrasi dan login preview memakai branch terpisah |
| D-039 | 2026-10-28 | Postur anti-penyalahgunaan | `robots.txt` + `X-Robots-Tag` noindex di semua respons, landing statis, preview via Vercel Authentication, caption tanpa auto-link/HTML, media tidak diproksikan lewat domain aplikasi | Situs ini sasaran potensial spam judol/adware; nilai SEO dan jalur tulis harus dibuat nol | Rincian di PRD §18.11; preview butuh login Vercel; tidak ada OG dinamis |
| D-040 | 2026-10-28 | Hardening akun & supply chain | 2FA/passkey di GitHub/Vercel/Cloudflare/Neon/Firebase, secret scanning + push protection, Actions pin SHA, `npm ci --ignore-scripts`, playbook insiden | Kredensial dan build script adalah jalur masuk yang tersisa | Rincian PRD §18.12; postinstall hanya untuk paket yang di-allowlist; secret yang pernah masuk git wajib dirotasi |
| D-041 | 2026-10-29 | Framework & library read-only | `node_modules/**`, source framework/library, dan `.next/**` tidak diedit; error diperbaiki di call site atau lewat perubahan versi; `patch-package`/fork dilarang tanpa keputusan baru | Perubahan di library hilang saat install ulang dan menyembunyikan penyimpangan | Aturan di agent-rules §1, §3 #28, §5.4; patch/fork wajib persetujuan |
| D-042 | 2026-10-29 | Playlist per room | Room bertipe playlist hanya berisi kontainer playlist Spotify; feed postingan tidak berada di room itu. Tabel `playlists` menyimpan `room_id`, `provider`, `url`, `title`, `sort_order`; tanpa cover, mood, atau artist corner | Playlist adalah kumpulan tautan, bukan konten yang perlu diparse; memisahkan feed dan playlist menjaga keduanya sederhana | Playlist dikelola dari admin room; URL wajib `https://open.spotify.com/playlist/{22}` dan di-kanonikkan tanpa `?si=`; embed dibentuk server dari ID |
| D-043 | 2026-10-29 | Landing, castle map, dan jenis room | `/` adalah landing publik; `/[chapter]` adalah castle map/menu utama; `rooms.kind` bernilai `feed` atau `playlist`. Room seed `home` dihapus | Castle map menjadi navigasi utama, sehingga room bernama "Home" membuka halaman yang membingungkan | Pintu castle map dirender dari `rooms` (bukan hardcode); jumlah room mengikuti database; room baru otomatis punya halaman |
| D-044 | 2026-10-29 | Istilah `event` menjadi `chapter` | Rename penuh: tabel `chapters`, kolom `chapter_id`, `audit_entity 'chapter'`, route `/[chapter]` dan `/admin/chapters`, repository `chapters.ts`. Label UI **Chapter** | "Chapter" lebih menjelaskan momen dalam cerita dan dipilih sebelum ada kode, sehingga rename masih murah | Kolom `slug` tetap nama teknis; `getChapterBySlug()`; semua dokumen dan migrasi awal memakai `chapter` |
| D-045 | 2026-10-29 | Konvensi Next.js 16.4.3 | Ikuti API versi terpasang: `proxy.ts` (bukan `middleware.ts`), `cacheComponents` + `partialPrefetching`, data dinamis di `<Suspense>` tanpa `export const dynamic`, typed props `PageProps`/`LayoutProps`, Tailwind lewat `@tailwindcss/turbopack`. Dependency memakai versi stabil terbaru saat instalasi dan dikunci persis | Next 16 mengganti nama middleware dan model caching; memaksa pola lama berisiko error atau mematikan fitur | Rujukan `node_modules/next/dist/docs/`; `next.config.ts` menyimpan kedua flag; dokumen memakai `proxy.ts`; loader turbopack menggantikan `@tailwindcss/postcss` pada D-027; upgrade lewat PR |
| D-046 | 2026-10-29 | Model branch | `development` = integrasi harian (PR + `verify` wajib); `main` = produksi/CI-CD dan hanya menerima PR rilis dari `development`. Branch kerja `feat/ fix/ chore/ db/ docs/` dibuat dari `development` | Memisahkan pekerjaan dari rilis agar `main` selalu siap deploy | Push langsung ke `development` dan `main` dilarang; deploy produksi hanya dari `main` |
| D-047 | 2026-10-29 | Revisi model branch | `development` menjadi branch kerja harian tanpa ruleset dan tanpa CI; yang diproteksi hanya `main` (PR wajib + `verify`). CI hanya berjalan pada PR ke `main` dan push ke `main` | Dikerjakan satu orang; menunggu CI di setiap perubahan memperlambat iterasi, sementara `main` tetap satu-satunya jalur deploy sehingga cukup dijaga di sana | Menggantikan bagian D-046 tentang proteksi `development`; ruleset `development` dibatalkan; DoD mewajibkan `typecheck` + `lint` + `test:run` lokal sebelum push; `main` tetap menolak push langsung |
| D-048 | 2026-10-30 | Implementasi auth M3 | ID token Firebase diverifikasi server lewat `firebase-admin`; sesi cookie HMAC 5 hari. `POST /api/auth/session` menerima `{ idToken, next?, invite? }`: tanpa `invite` memakai `provisionUser`, dengan `invite` memakai `redeemInvite` (satu statement CTE: cek kuota, `uses + 1`, upsert user, catat `invite_redeem`). `proxy.ts` hanya mengarahkan bila cookie tidak ada. Login memakai Google; email link menunggu `/auth/action` diaktifkan | Neon HTTP tidak punya transaksi interaktif, sementara klaim undangan harus atomik; menggabungkan login dan redeem di satu route menghindari sesi "setengah jadi" untuk user yang belum `is_allowed` | Route mengembalikan `redirectTo` yang sudah divalidasi `safeNextPath`; `getSession()` mengembalikan `null` bila `is_allowed = false`; email/password tidak dipakai karena PRD memilih Google + email link |
| D-049 | 2026-10-31 | COOP untuk OAuth popup | `Cross-Origin-Opener-Policy` menjadi `same-origin-allow-popups`, menggantikan `same-origin` | `same-origin` memutus `window.opener` popup Google sehingga `signInWithPopup()` tidak pernah selesai: popup tertutup, tanpa request, tanpa error | Frame tetap dilarang (`X-Frame-Options: DENY`); hanya popup yang boleh mempertahankan opener; berlaku juga di produksi |

---

## Konsekuensi yang diterima

1. **Kuota R2 hanya bertambah.** Tidak ada jalur hapus file dari app, dan tidak ada kompresi. Penyelamatan: video panjang ke YouTube, bersihkan manual dari dashboard Cloudflare.
2. **Database menumpuk baris soft-deleted.** Tidak ada UI pemulihan/pembersihan di v1; dikelola lewat SQL manual.
3. **`r2.dev` punya rate limit** dan bukan jalur produksi resmi. Diterima untuk 2–20 user (D-001).

---

## Catatan

- Keputusan stack (Next.js 16.4.3, Drizzle, Neon, Firebase Auth, Cloudinary, R2, Vercel, Serwist) ada di `docs/PRD.md` §3 dan sudah mengikat.
- D-001 s.d. D-049 menggantikan seluruh daftar "Keputusan Terbuka" pada PRD versi 2.0.
- Entri D-001 – D-041 ditulis sebelum rename D-044. Setiap kata "event" pada baris lama dibaca sebagai **chapter** (`events` → `chapters`, `event_id` → `chapter_id`, `events.starts_at` → `chapters.starts_at`). Keputusan isinya tidak berubah.
