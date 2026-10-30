# Aturan Kerja AI Agent — Our Little Universe

Dokumen ini adalah kontrak kerja untuk AI agent (dan manusia) yang mengubah repo ini.
Baca file ini **sebelum** menulis kode.

Urutan baca yang disarankan:
1. `AGENTS.md` (root, ditulis `next dev`)
2. `docs/agent-rules.md` (file ini)
3. `docs/PRD.md` bagian 3, 4, 7, 17
4. `docs/schema.md` bagian 3 dan 4
5. `node_modules/next/dist/docs/` untuk API Next.js versi terpasang
6. `lib/db/schema.ts`

`docs/manual-setup.md` berisi langkah yang **hanya bisa dilakukan pemilik akun** (GitHub, Neon, Cloudinary, R2, Firebase, Vercel). Agent tidak boleh mengarang kredensial atau menganggap langkah itu sudah selesai.

---

## 1. Prinsip

1. **Skema adalah sumber kebenaran.** Kalau kode dan skema bertentangan, skema menang.
2. **Satu pintu per tanggung jawab.** Database lewat `lib/db/repositories/`, auth lewat `lib/auth/`, pencatatan history lewat `lib/visits.ts`, media lewat `lib/media/`.
3. **Server yang memutuskan.** Role, batas upload, dan validasi tidak pernah hanya di client.
4. **Ubah sesedikit mungkin.** Jangan refactor file yang tidak berkaitan dengan tugas.
5. **Kalau ragu, berhenti dan tanya.** Lebih baik satu pertanyaan daripada satu migrasi yang salah.
6. **Tidak ada hard delete.** Semua penghapusan soft delete, dan media tidak ikut dihapus.
7. **Framework dan library read-only.** Error diperbaiki di cara memanggil, bukan dengan mengedit sumber pihak ketiga.

---

## 2. Struktur File

```
app/
  (public)/page.tsx                  landing + gate
  (auth)/login/page.tsx
  (auth)/auth/action/page.tsx
  (auth)/invite/[code]/page.tsx
  (app)/[chapter]/page.tsx           castle map / menu utama
  (app)/[chapter]/[roomKey]/page.tsx  room feed atau room playlist
  (app)/[chapter]/connect/page.tsx
  admin/layout.tsx
  admin/page.tsx
  admin/chapters/page.tsx
  admin/chapters/[id]/page.tsx
  admin/chapters/[id]/rooms/[roomId]/page.tsx
  admin/media/page.tsx
  admin/access/page.tsx
  admin/history/page.tsx
  admin/settings/page.tsx
  robots.ts                          disallow all
  api/auth/session/route.ts
  api/guardian/route.ts
  api/upload/sign/route.ts
  api/upload/r2/presign/route.ts
  api/notify/telegram/route.ts
components/
  auth/login-form.tsx
  ui/gift-card.tsx
  ui/badge.tsx
  ui/button.tsx
  ui/empty-state.tsx
  ambient-background.tsx
  guardian-status.tsx
  room-grid.tsx
  playlist-card.tsx
  playlist-player.tsx
  song-card.tsx
  song-picker.tsx
  video-poster-upload.tsx
  admin/kpi-card.tsx
  admin/timeline-table.tsx
  admin/item-form.tsx
  admin/playlist-form.tsx
lib/
  auth/index.ts  firebase.ts  firebase-admin.ts  session.ts  roles.ts
  db/index.ts  schema.ts
  db/repositories/chapters.ts  rooms.ts  items.ts  playlists.ts
                   visits.ts  users.ts  invites.ts  settings.ts
  media/cloudinary.ts  r2.ts  image-loader.ts  spotify.ts
  validation/chapter.schema.ts  room.schema.ts  item.schema.ts
             playlist.schema.ts  invite.schema.ts
  visits.ts
  audit.ts
  security/origin.ts  headers.ts  urls.ts  paths.ts
  utils/cn.ts  format-date.ts
docs/
  PRD.md  schema.md  agent-rules.md  decisions.md
drizzle/
scripts/
  seed.mts  backup.ts
.github/
  workflows/ci.yml  migrate.yml  backup.yml
  rulesets/main.json
tests/
  setup.ts
vitest.config.mts
proxy.ts                           redirect ringan (bukan middleware.ts)
AGENTS.md                          aturan agent dari next dev (di-commit)
```

File test berdampingan dengan sumbernya (`lib/visits.test.ts`), bukan di folder terpisah.

Tidak ada folder route per room. Semua room memakai `[roomKey]`; halaman memilih tampilan dari `rooms.kind` (`feed` atau `playlist`). Menambah room cukup lewat admin, tanpa file baru (D-043).

### Aturan penempatan

| Butuh | Taruh di |
|---|---|
| Query database | `lib/db/repositories/<entity>.ts` |
| Validasi input | `lib/validation/<entity>.schema.ts` (Zod) |
| Mutasi dari form | Server Action di file route atau `actions.ts` di folder route |
| Endpoint yang dipanggil client | `app/api/**/route.ts` |
| Komponen visual | `components/` |
| Logika auth | `lib/auth/` |
| Unit test | `<nama-sumber>.test.ts` di samping sumbernya |
| Workflow CI/CD | `.github/workflows/<nama>.yml` |
| Penulisan audit log | `lib/audit.ts` (satu pintu, dipanggil dari repository) |
| Cek Origin / header keamanan | `lib/security/` |
| Normalisasi URL, `?next=`, dan path kunjungan | `lib/security/urls.ts`, `lib/security/paths.ts` |
| `robots.txt` | `app/robots.ts` |
| Redirect ringan / rewrite | `proxy.ts` (bukan `middleware.ts`) |

---

## 3. Larangan Keras

Berikut hal yang **tidak boleh** dilakukan, dalam urutan tingkat bahaya:

1. `DELETE FROM` tabel mana pun. Semua penghapusan wajib soft delete (`deleted_at` + `deleted_by`). Khusus `visits`: dilarang dihapus dan hanya boleh di-`UPDATE` pada `visible`, `updated_at`, `updated_by`. Khusus `audit_logs`: dilarang di-`UPDATE` maupun dihapus.
2. `ALTER TABLE` manual di Neon console / psql.
3. Mengedit file di `drizzle/` secara manual.
4. Menaruh secret di file yang masuk git (`.env` wajib di `.gitignore`).
5. Mengimpor `db` di komponen atau page:
   ```ts
   // SALAH
   import { db } from '@/lib/db';
   // BENAR
   import { getChapterBySlug } from '@/lib/db/repositories/chapters';
   ```
6. Upload media tanpa verifikasi sesi di server.
7. Memakai unsigned Cloudinary preset.
8. `any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error` (kecuali dengan komentar alasan).
9. `use client` di `page.tsx` atau `layout.tsx` — hanya di komponen daun.
10. `console.log` di kode yang di-deploy. Pakai `console.error` hanya di blok `catch`.
11. Menambah dependency baru tanpa mencatat alasan di `docs/decisions.md`.
12. Mengubah `app/globals.css` di luar variabel tema dan utilitas yang sudah ditetapkan.
13. Hardcode nama orang, tanggal, atau URL di komponen. Semua dari database atau env.
14. Push langsung ke `main`, atau `git push --force` ke branch yang punya PR aktif.
15. `dangerouslySetInnerHTML`, `eval`, `new Function`.
16. `sql.raw()` atau `db.execute()` dengan string yang disusun dari input; interpolasi nama kolom dari request.
17. Meneruskan URL mentah user ke `href`, `src`, atau `srcDoc` tanpa validasi `https` + host allowlist.
18. Menyebar objek body request ke `insert`/`update`; setiap field dipetakan eksplisit setelah Zod `.strict()`.
19. Menerima upload `image/svg+xml` atau HTML.
20. Menjalankan `scripts/seed.ts` saat `NODE_ENV=production`.
21. Mengubah data lewat `GET`, atau route handler mutasi tanpa `assertSameOrigin`.
22. Menaruh `DATABASE_URL` produksi pada environment Preview Vercel.
23. Auto-link caption/deskripsi atau merender markdown/HTML dari input user.
24. `remotePatterns` wildcard atau `dangerouslyAllowSVG` pada `next/image`.
25. Menyajikan file upload lewat domain aplikasi (`rewrite`, route handler, atau optimizer).
26. `pull_request_target`, atau workflow yang memegang secret tanpa Actions yang di-pin ke SHA.
27. OG image atau metadata dinamis yang membaca database.
28. Mengedit `node_modules/**`, source framework/library, atau `.next/**`; memakai `patch-package`/`pnpm patch`; mem-fork atau menyalin file library ke repo untuk diubah.

---

## 4. Konvensi Kode

### Penamaan

| Jenis | Gaya | Contoh |
|---|---|---|
| Komponen | PascalCase | `RoomGrid.tsx` |
| Hook | `use` + PascalCase | `useGuardian.ts` |
| Fungsi repository | `verbNoun` | `getChapterBySlug`, `listRooms`, `listRoomItems`, `listRoomPlaylists`, `createItem`, `softDeletePlaylist` |
| Server Action | `verbNounAction` | `createItemAction`, `createPlaylistAction` |
| Skema Zod | camelCase + `Schema` | `createItemSchema` |
| Tabel/kolom DB | snake_case | `created_at` |
| File di `app/` | kebab-case | `room-grid.tsx` (kalau perlu) |
| File test | nama sumber + `.test` | `lib/visits.test.ts` |

### Tipe

- Tipe didapat dari Drizzle (`typeof items.$inferSelect`) atau dari Zod (`z.infer<typeof schema>`).
- Jangan mendefinisikan ulang tipe yang sudah ada.
- Semua fungsi publik punya tipe balik eksplisit.

### Komponen

- Server Component sebagai default.
- `'use client'` hanya untuk: state, event handler, `useEffect`, browser API.
- Data fetching di Server Component lewat repository, bukan `fetch` ke API sendiri.
- Props selalu bertipe; tidak ada `props: any`.

### Error

```ts
// pola yang dipakai
try {
  // ...
} catch (err) {
  console.error('[createItem]', err);
  throw new Error('Gagal menyimpan item');
}
```
Jangan menampilkan pesan error mentah dari database ke UI.

---

## 5. Alur Kerja Standar

### 5.1 Menambah field ke tabel

```
1. ubah lib/db/schema.ts
2. npx drizzle-kit generate
3. BACA file SQL yang dihasilkan di drizzle/
4. npx drizzle-kit migrate
5. perbarui docs/schema.md (DDL + kamus data)
6. perbarui lib/validation/*.schema.ts
7. perbarui repository terkait
8. npm run typecheck && npm run lint && npm run build
9. pastikan kolom audit (`created_at`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`) dan filter `deleted_at` tetap utuh
```

### 5.2 Menambah halaman

```
1. tentukan route + siapa yang boleh akses (PRD §4)
2. buat page.tsx sebagai Server Component
3. ambil data lewat repository
4. pecah bagian interaktif jadi komponen 'use client'
5. pastikan halaman tidak membocorkan data DB ke publik; kalau publik, copy harus statis
6. uji di 360 px dan 1440 px
7. tulis unit test untuk logika murni yang lahir dari halaman itu
```

### 5.3 Menambah aksi yang perlu dicatat

```
1. tentukan nilai enum (tambah ke visitAction kalau perlu + migrasi)
2. panggil logVisit() dari server, satu tempat
3. pastikan tidak ada duplikasi dalam 60 detik
```

### 5.4 Menghadapi error dari framework atau library

```
1. baca pesan error + tipe + dokumentasi versi yang terpasang
2. perbaiki cara memanggil API kita (tipe, argumen, await, params Promise)
3. jika perlu, ubah konfigurasi milik repo (next.config.ts, tsconfig.json, vitest.config.mts)
4. jika masih gagal, cek bug versi → naikkan/turunkan versi di package.json + catat di decisions.md
5. jika API tidak cocok, buat adapter di lib/, jangan ubah library
6. fork/patch hanya boleh lewat keputusan baru dan persetujuan Ian
```

- `node_modules/**`, source Next.js/React/Drizzle/Tailwind/SDK, dan `.next/**` tidak boleh diedit.
- Jangan memakai `patch-package`, `pnpm patch`, monkey-patch, atau `require.cache`.
- File library yang disalin ke repo lalu diubah dianggap pelanggaran yang sama.
- Konfigurasi milik repo tetap boleh diubah; itu bukan bagian dari library.

### 5.5 Menambah room atau playlist

```
1. room baru: tentukan key unik per chapter + kind ('feed' | 'playlist')
2. key tidak boleh menabrak route tetap: 'connect' (music/touring/healing hanya contoh seed)
3. playlist hanya untuk room kind = 'playlist'; room 'feed' tidak boleh punya playlist
4. kanonikkan URL lewat lib/media/spotify.ts → simpan tanpa ?si=
5. tulis audit_logs dengan entity 'playlist' dalam transaksi yang sama
6. castle map harus langsung menampilkan pintu baru tanpa perubahan kode
```

- Tidak ada folder route per room; jangan membuat `app/(app)/[chapter]/music/`.
- URL Spotify mentah tidak pernah masuk `iframe src`; embed dibentuk dari ID tervalidasi.
- Menghapus room atau playlist = soft delete, bukan hapus baris.

---

## 6. Definisi Selesai (Definition of Done)

Sebuah tugas baru boleh dinyatakan selesai jika **semua** poin ini terpenuhi:

> Karena `development` tidak melewati CI (D-047), poin verifikasi di bawah adalah satu-satunya gerbang sebelum push. Jangan menyerahkan pekerjaan yang belum lolos.

- [ ] `npm run typecheck` hijau
- [ ] `npm run lint` hijau
- [ ] `npm run test:run` hijau
- [ ] Coverage `lib/` dan `components/` ≥ 80%
- [ ] `npm run build` hijau
- [ ] Tidak ada `any` baru
- [ ] Tidak ada query database di luar `lib/db/repositories/`
- [ ] Tidak ada `DELETE` di kode; penghapusan memakai `softDelete*`
- [ ] Semua query baca memfilter `deleted_at is null`
- [ ] Setiap mutasi mengisi `updated_at` dan `updated_by`
- [ ] Setiap mutasi data menulis `audit_logs` dalam transaksi yang sama
- [ ] Route handler mutasi memanggil `assertSameOrigin` dan hanya menerima `POST`
- [ ] Tidak ada URL mentah user di `href`/`src`/iframe; host sudah divalidasi
- [ ] Halaman mengembalikan header keamanan `lib/security/headers.ts`
- [ ] Tidak ada secret di `NEXT_PUBLIC_*`; `npm audit --omit=dev` bersih
- [ ] `app/robots.ts` + `X-Robots-Tag` noindex terpasang; tidak ada halaman publik berisi data DB
- [ ] Caption tidak di-auto-link dan tidak dirender sebagai HTML/markdown
- [ ] `next/image` hanya host eksplisit; SVG tidak diizinkan
- [ ] Tidak ada upload yang disajikan lewat domain aplikasi
- [ ] Tidak ada workflow `pull_request_target`; Actions dengan secret di-pin ke SHA
- [ ] `git status` tidak menunjukkan perubahan di `node_modules/`, `.next/`, atau file library
- [ ] Tidak ada `patch-package`, fork library, atau file library yang disalin ke repo
- [ ] Tidak ada folder route per room; room baru muncul dari database
- [ ] `rooms.kind` dihormati: room `playlist` tidak merender feed, room `feed` tidak merender playlist
- [ ] URL playlist kanonik (`https://open.spotify.com/playlist/{22}`), tanpa `?si=`, dan embed dibentuk server
- [ ] Jika skema berubah: migrasi ada, `docs/schema.md` diperbarui
- [ ] Tidak memakai `export const dynamic`; data dinamis dibungkus `<Suspense>`
- [ ] Jika menangani redirect/request, memakai `proxy.ts`, bukan `middleware.ts`
- [ ] Jika route baru: aturan akses sesuai PRD §4 dan ditegakkan di server
- [ ] Tampilan diuji di 360 px dan 1440 px, tanpa scroll horizontal
- [ ] Fokus keyboard terlihat pada elemen interaktif baru
- [ ] `prefers-reduced-motion` tidak memicu animasi
- [ ] Tidak ada secret baru yang masuk client bundle

---

## 7. Perintah

```bash
npm run dev            # dev server
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run test           # vitest watch
npm run test:run       # vitest run (dipakai CI)
npm run test:coverage  # vitest run --coverage
npm run build          # production build

npm run db:generate    # drizzle-kit generate
npm run db:migrate     # drizzle-kit migrate
npm run db:studio      # drizzle-kit studio
npm run db:seed        # tsx scripts/seed.ts
```

Semua perintah ini harus ada di `package.json` sejak M1. `next lint` sudah tidak ada; script `lint` memanggil `eslint` langsung. `next dev` dan `next build` memakai Turbopack secara default.

Perintah `db:*` dan `scripts/backup.ts` memakai `DATABASE_URL_UNPOOLED` (koneksi langsung Neon). Runtime aplikasi memakai `DATABASE_URL` (pooled). Jangan menjalankan migrasi lewat pooler.

---

## 8. Batasan Teknis yang Sering Salah

### Soft delete

```ts
// BENAR
await db.update(items)
  .set({
    deletedAt: new Date(),
    deletedBy: user.id,
    updatedAt: new Date(),
    updatedBy: user.id,
  })
  .where(and(eq(items.id, id), isNull(items.deletedAt)));

// SALAH
await db.delete(items).where(eq(items.id, id));
```

- Semua query baca menambahkan `isNull(table.deletedAt)`.
- Unique index bersifat parsial (`where deleted_at is null`). Jangan memakai `.unique()` biasa di kolom yang bisa di-soft-delete.
- `visits` dan `settings` tidak punya `deleted_at`; jangan menambahkannya.

### Next.js 16

Versi terpasang **16.4.3**. Konvensinya berbeda dari Next.js lama:

- **Middleware bernama Proxy.** File `proxy.ts` di root, fungsi `proxy(request)`. Tidak ada `middleware.ts`.
- **Cache Components aktif** (`cacheComponents: true`, `partialPrefetching: true`). Tidak ada `export const dynamic`, `experimental.ppr`, atau `runtime` export.
- Data yang harus segar (DB, `cookies()`, `headers()`) dibungkus `<Suspense>`; jangan memakai `use cache` untuk data privat.
- `params` dan `searchParams` tetap **Promise**. Pakai helper tipe global:
  ```ts
  export default async function Page(props: PageProps<'/[chapter]/[roomKey]'>) {
    const { chapter, roomKey } = await props.params;
  }
  ```
- `next.config.ts`: `poweredByHeader: false`; `images.remotePatterns` hanya host eksplisit (Cloudinary, R2, thumbnail YouTube); `dangerouslyAllowSVG: false`.
- Jangan membuat `opengraph-image` yang membaca database.
- `redirect()` hanya ke path internal hasil `safeNextPath()`.
- Sebelum memakai API yang belum dikenal, baca `node_modules/next/dist/docs/` (versi terpasang), bukan materi dari ingatan.

### Tailwind 4

- Tidak ada `tailwind.config.js`. Konfigurasi lewat CSS: `@import "tailwindcss";` lalu blok `@theme`.
- Warna tema (`primary`, `accent`) dideklarasikan di `@theme`, bukan di JS.
- Loader memakai `@tailwindcss/turbopack` melalui `turbopack.rules` di `next.config.ts`. Jangan menambah `postcss.config` atau loader kedua.

### Responsif

- `100vh` dilarang. Pakai `100dvh` atau Tailwind `min-h-dvh`.
- Jangan pakai `overflow: hidden` di `body` — pakai `overflow-x: clip`.
- Animasi ambient wajib `position: fixed`, `pointer-events: none`, `z-index: -1`.
- Input wajib `font-size: 16px` untuk mencegah zoom otomatis di iOS Safari.

### Cloudinary

- Signature dihitung di server dengan `api_secret`. Jangan pernah mengirim secret ke client.
- URL transformasi dibentuk di server atau lewat loader, bukan disimpan di DB (simpan `public_id` saja).
- Foto iPhone bisa HEIC — pastikan URL memakai `f_auto` agar dikonversi.
- Aktifkan **strict transformations**; signature menyertakan `allowed_formats`, `max_file_size`, folder tetap, dan `overwrite: false`.
- `public_id` divalidasi regex sebelum dipakai membentuk URL transformasi.

### Cloudflare R2

- Presigned PUT punya masa berlaku; jangan di-cache di client.
- CORS bucket harus mengizinkan origin app, `PUT`, dan `GET`.
- Key dibuat server: `chapters/{chapterId}/{uuid}.{ext}`; ekstensi hanya dari allowlist media.
- Presign mengunci `Content-Type`. `.html`, `.svg`, dan `.js` ditolak.
- Bucket backup terpisah dan privat; token per bucket.

### Neon di Vercel

- Pakai pooled connection (`-pooler` di hostname).
- Jangan membuat instance `db` baru per request.
- Autosuspend 5 menit: request pertama setelah idle lebih lambat. Jangan dianggap error.
- Environment **Preview** memakai `DATABASE_URL` ke Neon branch; `DATABASE_URL` produksi dilarang di Preview (D-038).

### Auth

- Semua akses lewat `lib/auth/index.ts`. Jangan mengimpor `firebase-admin` di komponen.
- `requireRole()` dipanggil di Server Component/Action, bukan di client.
- `proxy.ts` hanya untuk redirect, bukan satu-satunya pengecekan.

### Keamanan

```ts
// lib/security/origin.ts
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    throw new Error('Origin tidak valid');
  }
}
```

- Route handler yang mengubah state: `POST` saja, `content-type: application/json`, panggil `assertSameOrigin` paling awal.
- Cookie sesi: `__Host-olu_session`, `httpOnly`, `secure`, `sameSite=lax`, umur 5 hari, ditandatangani `SESSION_SECRET`.
- `?next=` hanya path internal, divalidasi lewat `new URL(next, origin)` dan perbandingan `origin` (bukan awalan `//`).
- URL lagu/media hanya `https` dengan host allowlist; embed dibentuk server.
- URL playlist hanya `https://open.spotify.com/playlist/{22 karakter}`; parameter pelacak dibuang dan ID divalidasi sebelum membentuk embed.
- Jangan mencatat token, cookie, atau secret ke log/audit.
- Header keamanan dari `lib/security/headers.ts`; CSP report-only dulu, enforce di M8.
- `app/robots.ts` + `X-Robots-Tag` noindex di semua respons. Situs ini tidak boleh muncul di pencarian.
- Landing `/` hanya memakai status `gate_open`; copy, judul, dan metadata statis. Tidak ada data chapter/guardian di halaman publik.
- Caption dan deskripsi adalah teks biasa. Tanpa markdown, HTML, atau auto-link.
- Media selalu dari origin Cloudinary/R2; jangan pernah menyajikannya lewat domain aplikasi.
- `safeNextPath()` memakai `new URL(next, origin)` dan membandingkan `origin`, bukan cek awalan string.
- `normalizeVisitPath()` meredaksi segmen dinamis sensitif: `/invite/[redacted]`.
- Preview deployment terlindungi Vercel Authentication; jangan menguji login Firebase di preview.
- Tidak ada OG image dinamis; crawler tidak boleh membaca database.

---

## 9. Hemat Konteks (untuk AI)

Sebelum menebak API framework, baca `AGENTS.md` di root dan dokumentasi versi terpasang di `node_modules/next/dist/docs/`. Jangan mengandalkan ingatan tentang Next.js versi lama.

1. Jangan membaca seluruh repo. Baca `@file` yang relevan saja.
2. Sebelum mencari fungsi, cek `lib/db/repositories/` dan `lib/auth/` lebih dulu.
3. Kalau butuh mengubah pola yang dipakai di banyak tempat, tanyakan dulu — jangan refactor massal tanpa izin.
4. Jangan menulis ulang file utuh untuk perubahan kecil. Gunakan edit terarah.
5. Jangan menjalankan `npm run build` berkali-kali; jalankan sekali di akhir.
6. Jangan membuat file dokumentasi baru. Perbarui yang sudah ada.
7. Unit test tidak boleh membuka koneksi database atau jaringan; mock `lib/db`.

---

## 10. Branch, Commit, dan PR

### Branch

```
main            ← produksi / CI-CD; hanya PR rilis dari development
development     ← branch kerja harian; tanpa ruleset, tanpa CI
feat/<ringkas>  fix/<ringkas>  chore/<ringkas>  db/<ringkas>  docs/<ringkas>
                  dibuat dari development
```

Alur harian:

```bash
git switch development
git switch -c feat/nama-ringkas
# ...kerja...
npm run typecheck && npm run lint && npm run test:run
git add -A && git commit -m "feat(scope): ringkasan"
git switch development
git merge --squash feat/nama-ringkas
git push origin development
git branch -d feat/nama-ringkas
```

Alur rilis: PR `development` → `main`; CI `verify` berjalan di PR dan wajib hijau. Merge ke `main` adalah satu-satunya pemicu deploy produksi. Jangan push langsung ke `main`; `development` boleh di-push bebas.

Karena CI tidak berjalan di `development`, kegagalan yang lolos baru terlihat saat PR rilis. Selalu jalankan tiga perintah verifikasi di atas sebelum commit.

### Format commit

```
feat(admin): tambah form edit item
fix(auth): cegah redirect loop pada sesi kedaluwarsa
chore(db): migrasi kolom duration_s
docs(schema): perbarui kamus data items
refactor(repo): satukan query room ke satu fungsi
```

Satu commit = satu tujuan. Jangan gabungkan migrasi dengan perubahan UI.

### Aturan PR

- Judul PR mengikuti format commit.
- Deskripsi wajib: apa yang berubah, cara menguji, risiko.
- Jangan merge sebelum job `verify` hijau.
- Jangan force-push ke branch yang sudah direview.
- Migrasi database di PR tersendiri berawalan `db/`.

---

## 11. Saat Tidak Yakin

Tanyakan, dengan format:

```
Konteks  : <apa yang sedang dikerjakan>
Masalah  : <apa yang membingungkan>
Opsi A   : <konsekuensi>
Opsi B   : <konsekuensi>
Saran    : <pilihan + alasan>
```

Jangan mengambil keputusan yang mengubah skema, biaya, atau hak akses tanpa persetujuan Ian.

Jika masalahnya berasal dari framework atau library:

```
Konteks  : <versi paket + API yang dipanggil>
Gejala   : <error persis>
Sudah    : <perbaikan call site yang dicoba>
Opsi A   : <workaround di kode kita>
Opsi B   : <naik/turun versi + risiko>
Saran    : <pilihan + alasan>
```

Fork, patch, atau mengedit sumber library **tidak** diambil sebagai jalan pintas tanpa persetujuan eksplisit.
