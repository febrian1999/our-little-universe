# PRD — Our Little Universe

**Versi:** 2.8
**Status:** Final — siap implementasi
**Pemilik:** Ian
**Update terakhir:** 2026-10-29
**Asal:** project mangkrak `mybf.ian-gift` (Echa)
**Target biaya:** Rp 0
**Dokumen terkait:** `docs/schema.md`, `docs/agent-rules.md`, `docs/decisions.md`

---

## 1. Konteks

| Item | Isi |
|---|---|
| Apa ini | Website personal berisi "ruang" kenangan (foto, video, teks, lagu) yang bisa diisi terus-menerus oleh pemiliknya |
| Untuk siapa | Ian (owner) dan orang-orang yang diundang (guest) |
| Masalah yang diselesaikan | Project lama hanya kerangka: 3 halaman statis, tanpa konten, dan tidak ada cara menambah isi tanpa mengedit kode |
| Prinsip utama | Bisa dirawat 2–3 tahun oleh satu orang non-desainer, dengan AI sebagai rekan implementasi |

### 1.1 Warisan dari project lama

Dipertahankan:
- Konsep "Gate" sebagai pintu masuk.
- Nama ruangan awal: Touring, Healing, Music.
- Narasi Princess × Guardian.
- Tanggal 17 September 2026 disimpan sebagai data (`chapters.starts_at`), **tidak ditampilkan** di UI.

Dibuang:
- `guardian-syc-firebase.js` (dead code, tidak pernah di-import).
- CSS inline di setiap file HTML.
- Status guardian yang di-hardcode di landing page.
- Tombol gate yang rusak (`<button> onclick="openGate()"🔒 Open The Gate</button>` — atribut masuk ke text content).
- Firebase Hosting dan Firestore sebagai database.

### 1.2 Referensi project lama (hanya visual)

Dua halaman project lama dipakai sebagai **acuan tampilan**, bukan dependency runtime:

| Halaman | URL | Yang diambil |
|---|---|---|
| Music Room | `https://echaprincess.github.io/mybf.ian-gift/music-room.html` | Susunan kartu playlist Spotify dan tombol "buka di Spotify" |
| Castle Map | `https://echaprincess.github.io/mybf.ian-gift/castle-map.html` | Grid pintu room sebagai menu utama |

Aturan:
- Tidak di-iframe, tidak `fetch`, tidak dijadikan build step. Repo ini tidak bergantung pada GitHub Pages.
- Tidak ada 18 room tetap; jumlah pintu mengikuti tabel `rooms` (D-043).
- Tidak ada bagian artist corner, mood, atau song memory dari halaman lama; playlist hanya kontainer tautan (D-042).
- Jika halaman lama hilang, aplikasi tetap berjalan.

---

## 2. Ruang Lingkup

### 2.1 v1.0 (harus ada)

- Login (Google + email link) dengan role `owner` / `editor` / `guest`.
- Gate yang bisa dibuka/tutup manual oleh owner.
- Multi-chapter (satu instalasi bisa menampung beberapa bab cerita, mis. anniversary, ulang tahun).
- Room dinamis per chapter: tambah/ubah dari admin, tanpa mengedit kode.
- Dua jenis room: `feed` (postingan) dan `playlist` (kontainer Spotify). Keduanya tidak dicampur dalam satu halaman (D-042).
- Castle map sebagai menu utama setelah login, dirender dari tabel `rooms` (D-043).
- CRUD konten (teks, foto, video, lagu).
- Upload foto (Cloudinary) dan video (Cloudflare R2) — hanya `owner`/`editor`.
- Undangan berbasis kode + batas pemakaian.
- History append-only yang tidak pernah dihapus.
- Dashboard admin: KPI, timeline, pengelolaan konten.
- Lagu tempelan opsional di setiap postingan (kartu + embed).
- Playlist Spotify per room playlist, dikelola dari admin.
- PWA yang bisa diinstal di iPhone 13 dan Android.
- Notifikasi Telegram yang bisa dimatikan.
- Penghapusan bersifat **soft delete** — tidak ada hard delete, data tidak hilang permanen.
- Unit test (Vitest) untuk logika murni, wajib hijau di CI.
- Audit log perubahan data (append-only), terpisah dari history kunjungan.
- CI GitHub Actions + proteksi `main`: tidak ada push langsung, semua lewat PR.
- Seluruh situs `noindex`; landing publik hanya copy statis + status gate.

### 2.2 Di luar v1.0

- Komentar, chat, reaksi emoji, guestbook, form kontak.
- Halaman publik yang menampilkan isi chapter/room (termasuk OG image dinamis).
- Multi-tenant (banyak pasangan dalam satu instalasi).
- Pembayaran.
- Email transaksional.
- Aplikasi mobile native.
- Kompresi/transcoding video (browser maupun server) — video ditampilkan apa adanya.
- Upload media oleh `guest`.
- Iklan, ad network, tag manager, atau script pihak ketiga selain GA4.

---

## 3. Keputusan Teknis

Keputusan di bawah ini mengikat. Perubahan harus dicatat di `docs/decisions.md`.

| Layer | Keputusan | Alasan |
|---|---|---|
| Framework | Next.js 16.4.3 App Router | Versi stabil terbaru; Turbopack default |
| Rendering | Cache Components + Partial Prefetching | Shell statis disajikan cepat, data dinamis streaming di `<Suspense>` |
| Bahasa | TypeScript 5.9.3 `strict` | Tipe ketat; TS 7 ditunda sampai ekosistem siap |
| Styling | Tailwind CSS 4.3.3 | Konfigurasi lewat `@theme` di CSS; loader `@tailwindcss/turbopack` |
| Database | Neon Postgres (free) | SQL, 0,5 GB, tanpa kartu kredit |
| ORM | Drizzle ORM + drizzle-kit | SQL-first, migrasi versioned, tipe otomatis |
| Auth | Firebase Auth (Google + email link) | Pilihan Ian; terisolasi di `lib/auth/` |
| Foto | Cloudinary (signed upload) | Konversi HEIC ke WebP/AVIF otomatis |
| Video | Cloudflare R2 (presigned PUT) | Egress gratis, 10 GB storage gratis |
| Hosting | Vercel Hobby, domain `*.vercel.app` | Gratis dan non-komersial; domain kustom ditunda |
| Notifikasi | Telegram Bot via route handler | Gratis, bekerja saat app tertutup |
| Analytics | GA4 + Cloudflare Web Analytics | Kombinasi gratis |
| PWA | Serwist | Offline shell, instalable |
| Testing | Vitest + Testing Library | Cepat, TS native, tanpa biaya |
| CI/CD | GitHub Actions + integrasi Git Vercel | Gratis, repo publik, deploy otomatis |

### 3.1 Catatan tentang Auth

Kontrak auth diisolasi di `lib/auth/index.ts`:

```ts
export type SessionUser = { id: string; email: string; name: string; role: UserRole };
export async function getSession(): Promise<SessionUser | null>;
export async function requireUser(): Promise<SessionUser>;
export async function requireRole(min: UserRole): Promise<SessionUser>;
```

Selama tiga fungsi itu tersedia, implementasi di baliknya boleh diganti (mis. ke Better Auth dengan session di Postgres) tanpa mengubah route atau komponen. Perubahan seperti ini **tidak** memerlukan revisi PRD.

### 3.2 Catatan tentang Next.js 16.4.3

Versi ini berbeda dari Next.js yang umum ada di materi lama. Aturan implementasi:

- **Middleware bernama Proxy.** File `proxy.ts` di root, fungsi `proxy(request)`. Tidak ada `middleware.ts`.
- **Cache Components aktif** (`cacheComponents: true`, `partialPrefetching: true`). Tidak ada `export const dynamic`; data dinamis dibungkus `<Suspense>`.
- **`params` tetap Promise.** Tipe props memakai helper global `PageProps<'/[chapter]'>` dan `LayoutProps<'/'>`.
- **Tidak ada `runtime` export**; Cache Components hanya berjalan di Node runtime.
- **Tailwind lewat** `@tailwindcss/turbopack` di `turbopack.rules`, tanpa `postcss.config`.
- Sebelum memakai API yang belum dikenal, baca dokumentasi versi terpasang di `node_modules/next/dist/docs/`.

Rincian ada di `docs/agent-rules.md` §8 dan D-045.

---

## 4. Role & Hak Akses

| Role | Hak |
|---|---|
| `owner` | Semua; menghapus chapter; mengubah role user; membuka/menutup gate; mengatur notifikasi |
| `editor` | Menambah/edit/hapus chapter, room, item, dan playlist; upload media; tidak bisa mengubah role |
| `guest` | Membaca semua ruangan (`min_role = guest`); **tidak bisa** upload, edit, atau hapus |

Aturan akses halaman:

| Route | Akses |
|---|---|
| `/` | publik |
| `/login` | publik |
| `/invite/[code]` | publik (redeem butuh login) |
| `/[chapter]` | login (semua role) — castle map |
| `/[chapter]/[roomKey]` | login + `role >= room.min_role` |
| `/admin/**` | `owner` atau `editor` |

Semua pengecekan role dilakukan **di server** (`proxy.ts` untuk redirect + repository), tidak pernah hanya di client.

Semua room — termasuk `healing` — memakai `min_role = guest`. Pembatasan tulis murni berbasis role: hanya `owner` dan `editor`.

`owner` dan `editor` sama-sama boleh menghapus chapter, room, item, dan playlist. Semua penghapusan adalah **soft delete** (`deleted_at` + `deleted_by`); tidak ada `DELETE` di aplikasi dan tidak ada UI pemulihan di v1.

---

## 5. Alur Utama

### 5.1 Masuk

```
/  → klik "Open The Gate"
   ├─ gate tertutup → tampilkan "Belum dibuka", tombol disabled
   └─ gate terbuka  → /login jika belum ada sesi → /[chapter]
```

`visits` mencatat `gate_open` saat gate berhasil dilewati.

### 5.2 Undangan

```
Owner buat invite { role, maxUses, expiresAt } → link /invite/CODE
Guest buka link → login → POST redeem
  ├─ valid   → users.role = invite.role, users.is_allowed = true, invites.uses += 1
  └─ invalid → pesan "Undangan tidak valid atau sudah kedaluwarsa"
```

Redeem dicatat sebagai `invite_redeem` di `visits`.

Halaman `/invite/[code]` sebelum login hanya menampilkan copy generik dan tombol login. Tidak ada judul chapter, nama owner, atau detail undangan dari database yang dirender ke publik. Validasi kode terjadi di server setelah sesi ada.

### 5.3 Guardian Connect

Dipertahankan dari project lama, disederhanakan:

```
Login → halaman /[chapter]/connect
  → isi nama + birthday (opsional)
  → POST → settings['guardian'] = { name, birthday, lastSeen }
  → visits(action='connect')
  → owner melihat status via polling GET /api/guardian (5 detik, hanya saat tab aktif)
  → jika notifikasi aktif: POST /api/notify/telegram
```

### 5.4 Menambah konten

Hanya `owner` dan `editor`. `guest` tidak melihat tombol ini dan endpoint upload menolaknya di server.

```
/admin → pilih chapter → pilih room → "Tambah item"

foto     → POST /api/upload/sign            → upload langsung ke Cloudinary
           → simpan { type:'photo', provider:'cloudinary', public_id, width, height }
video    → POST /api/upload/r2/presign      → PUT langsung browser ke R2
           → ambil frame pertama di canvas  → upload poster ke Cloudinary
           → simpan { type:'video', provider:'r2', url, thumb_url, duration_s }
video >500 MB → tempel URL YouTube unlisted → simpan { type:'video', provider:'youtube', url }
lagu     → tempel URL Spotify/YouTube       → simpan { type:'song', provider:'spotify', url }
teks     → tulis langsung                   → simpan { type:'text', caption }
playlist → tempel URL Spotify (room playlist) → simpan { provider:'spotify', url, title, sort_order }
```

Setiap item non-lagu boleh diberi **satu lagu tempelan** lewat `song_provider`, `song_url`, `song_title`, `song_start_s`. Kartu lagu memutar embed; autoplay dicoba, dan jika browser memblokir, pemutaran dimulai pada sentuhan pertama di ruangan. Musik berhenti saat pindah room.

Playlist hanya ditambahkan ke room bertipe `playlist`; URL di-kanonikkan ke `https://open.spotify.com/playlist/{id}` dan disimpan tanpa `?si=`. Feed postingan tetap berada di room `feed`, tidak di room playlist.

Upload dicatat sebagai `upload` di `visits`.

### 5.5 Membuka gate

```
/admin → toggle gate
  → update chapters.gate_open
  → visits(action='gate_toggle')
  → halaman gate di landing langsung berubah (revalidasi / polling)
```

---

## 6. Peta Halaman

```
/                                  landing + gate (copy statis)
/login                             login
/auth/action                       penyelesaian email link Firebase
/invite/[code]                     redeem undangan
/[chapter]                         castle map / menu utama (layout B)
/[chapter]/[roomKey]               room feed
/[chapter]/music                   room playlist (kontainer Spotify)
/[chapter]/connect                 guardian connect
/admin                             dashboard (layout C)
/admin/chapters                    daftar chapter
/admin/chapters/[id]               detail chapter + daftar room
/admin/chapters/[id]/rooms/[roomId]  item feed atau daftar playlist
/admin/media                       pustaka media
/admin/access                      invite + daftar user
/admin/history                     timeline kunjungan + log perubahan
/admin/settings                    gate, notifikasi, analytics
```

`/[chapter]/music` hanya contoh key seed. Semua room memakai `[roomKey]` yang sama; isi halaman ditentukan `rooms.kind` (D-043).

---

## 7. Spesifikasi UI

### 7.1 Prinsip

- Mobile-first. Desktop adalah penyempurnaan, bukan sebaliknya.
- Lebar minimum yang didukung: **360 px**. Target utama: **390 px** (iPhone 13).
- Tidak boleh ada scroll horizontal di lebar mana pun.
- Target sentuh minimum 44×44 px (Apple HIG / Material).
- Animasi ambient tidak boleh memengaruhi layout (harus `position: fixed` + `pointer-events: none`).

### 7.2 Layout per area

**Landing `/` → gate card**
```
┌──────────────────────────┐
│  ambient layer (fixed)   │
│                          │
│   ╭──────────────────╮   │
│   │  copy statis     │   │
│   │  status gate     │   │
│   │  [ Open The Gate]│   │
│   ╰──────────────────╯   │
└──────────────────────────┘
        max-w-md
```

**Castle map `/[chapter]` → layout B (two column)**
```
Desktop ≥1024px                     Mobile <1024px
┌──────────┬──────────────────┐     ┌──────────────┐
│ identitas│  grid pintu room │     │ identitas    │
│ status   │  1/2/3 kolom     │     ├──────────────┤
│ nav      │                  │     │ grid 1 kolom │
│ (sticky) │                  │     │              │
└──────────┴──────────────────┘     ├──────────────┤
 260px       max-w-6xl              │ bottom nav   │
                                    └──────────────┘
```

Pintu dirender dari `rooms` sesuai `sort_order`. Tidak ada daftar key di kode dan tidak ada penghitung "x/y room"; jumlah pintu mengikuti database.

**Room `feed` → daftar item**
```
header room (ikon, judul, deskripsi)
├─ kartu item (teks / foto / video / lagu)
├─ kartu item
└─ paginasi 24
```

**Room `playlist` → kontainer Spotify**
```
header room (ikon, judul, deskripsi)
├─ kartu playlist: judul + tombol putar
├─ kartu playlist
└─ satu iframe Spotify aktif (dimuat setelah diketuk)
```

Room playlist **tidak** menampilkan feed (D-042). Tombol "Buka di Spotify" tersedia sebagai fallback.

**Admin → Opsi C (dashboard grid)**
```
┌────────┬────────────────────────────────┐
│ sidebar│ KPI  KPI  KPI  KPI             │
│ 240px  ├────────────────┬───────────────┤
│        │ chart          │ timeline      │
│        ├────────────────┴───────────────┤
│        │ tabel konten                   │
└────────┴────────────────────────────────┘
```

### 7.3 Kriteria diterima per layar

| Layar | Kriteria |
|---|---|
| Gate | Kartu `max-w-md`; tombol disabled + pesan jelas saat gate tutup; tanpa scroll horizontal di 360 px; **copy statis**, hanya status buka/tutup dari DB |
| Castle map | Pintu dari database, urut `sort_order`; grid 1/2/3 kolom; pintu terkunci menampilkan status; tidak ada jumlah room hardcode |
| Room feed | Video `preload="metadata"` + poster; gambar `srcset` 3 ukuran; lightbox bisa ditutup dengan Esc |
| Room playlist | Kartu playlist dari database; satu iframe aktif; tidak ada autoplay; tanpa scroll horizontal di 360 px |
| Admin | Tabel boleh horizontal-scroll di dalam wrapper sendiri, bukan seluruh halaman |
| History | Default menyembunyikan `visible=false`; ada toggle "tampilkan semua"; filter per action dan rentang tanggal |

### 7.4 CSS global wajib (`app/globals.css`)

```css
@import "tailwindcss";

@theme {
  --color-primary: #EC4899;
  --color-accent: #2563EB;
}

body { min-height: 100dvh; overflow-x: clip; }
input, select, textarea { font-size: 16px; }  /* cegah auto-zoom iOS */
.tap { min-height: 44px; }
.ambient { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: clip; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

Breakpoint uji wajib: 360, 390, 430, 768, 1024, 1440.

---

## 8. Media

| Tipe | Penyimpanan | Upload | Transformasi |
|---|---|---|---|
| Foto | Cloudinary | `POST /api/upload/sign` → upload langsung | `f_auto,q_auto,w_<size>` via loader |
| Video ≤ 500 MB | Cloudflare R2 | presigned PUT browser → R2 | tanpa transformasi |
| Poster video | Cloudinary | frame pertama diambil lewat `canvas` | `f_auto,q_auto,w_<size>` |
| Video besar/panjang | YouTube unlisted | tempel URL manual | embed; tidak dipublikasi di channel |
| Lagu tempelan | Spotify/YouTube | tempel URL | embed di kartu lagu |
| Playlist | Spotify | tempel URL di admin room | embed dibentuk server dari ID playlist |

### 8.1 Aturan

- Upload **selalu** lewat endpoint server yang memverifikasi sesi + role. Tidak ada unsigned preset.
- Upload hanya untuk role `owner`/`editor`; `guest` read-only.
- Batas **500 MB per file** video, dicek di server sebelum presign. Video lebih besar diarahkan ke YouTube unlisted karena tidak ada kompresi.
- Poster video diambil otomatis dari frame pertama di browser lalu diunggah ke Cloudinary (bukan R2) agar hemat bandwidth. Jika gagal, poster boleh kosong.
- Salinan YouTube wajib **unlisted**, tidak pernah `public` dan tidak dipublikasikan ke channel.
- Key R2 dibuat server: `chapters/{chapterId}/{uuid}.{ext}` — mencegah path traversal.
- R2 butuh CORS: `AllowedOrigins: [domain app]`, `AllowedMethods: [PUT, GET]`, `AllowedHeaders: [*]`.
- Tanpa domain kustom, bucket diakses lewat `https://pub-xxxx.r2.dev`.
- **Media tidak pernah diproksikan lewat domain aplikasi.** Tidak ada `rewrite`, route handler, atau image optimizer yang menyajikan file upload dari origin sendiri. Cloudinary/R2 tetap origin terpisah.
- Presign R2 dan signature Cloudinary mengunci `Content-Type` + ekstensi dari allowlist (jpg, png, webp, heic, mp4, mov). `.html`, `.svg`, dan `.js` ditolak.
- Playlist Spotify hanya menerima `https://open.spotify.com/playlist/{22 karakter}`; parameter pelacak seperti `?si=` dibuang sebelum disimpan, dan embed dibentuk server dari ID.
- Menghapus item **tidak** menghapus file di Cloudinary/R2. Pembersihan aset dilakukan manual dari dashboard provider.
- Pengecualian: media yang terbukti disalahgunakan (spam/judol/phishing) **boleh dihapus manual** dari dashboard provider. Ini tidak melanggar aturan soft delete aplikasi karena tidak menyentuh baris database.
- Semua guest melihat video setelah login app; tautan YouTube tidak meminta akun Google.

### 8.2 Rencana pertumbuhan video

Saat ini < 10 GB (batas gratis R2) dan **tidak ada kompresi**. Karena file tidak pernah dihapus lewat app, kuota hanya bertambah. Jika melewati:
1. Pindahkan video panjang ke YouTube unlisted (jalur utama).
2. Hapus video lama dari R2 **manual** lewat dashboard Cloudflare, setelah dipastikan ada di YouTube atau backup.
3. Kompres manual di luar app (mis. HandBrake 720p H.265) sebelum upload — opsional, bukan fitur app.
4. Cloudflare Stream (berbayar) hanya jika benar-benar perlu.

### 8.3 Setup akun (belum dimiliki)

1. **Cloudinary** — daftar free; catat `cloud_name`, `api_key`, `api_secret`; buat upload preset bertipe **signed**.
2. **Cloudflare R2** — aktifkan R2 (free 10 GB); buat bucket `olu-media`; buat API token S3; aktifkan Public Access lewat `r2.dev` (custom domain ditunda).
3. **Neon** — buat project; salin `DATABASE_URL` (gunakan pooled connection untuk Vercel).
4. **Vercel** — import repo GitHub; isi environment variables.
5. **Telegram** — BotFather `/newbot`; ambil token; `getUpdates` untuk chat ID.

---

## 9. Notifikasi

```
POST /api/notify/telegram     (wajib sesi valid)
  body: { kind: 'connect' | 'gate' | 'upload', message: string }
  → cek settings.notifications.enabled
  → jika false: return 204
  → kirim ke settings.notifications.chatIds[]
```

- In-app: polling `GET /api/guardian` tiap 5 detik, hanya saat `document.visibilityState === 'visible'`.
- Toggle di `/admin/settings`.
- `TELEGRAM_BOT_TOKEN` hanya di environment server.
- Rate limit: maksimal 1 pesan per `kind` per 60 detik.

---

## 10. History & Analytics

### 10.1 Prinsip

**History tidak pernah dihapus.** Data yang dianggap berisik disembunyikan (`visits.visible = false`), bukan di-`DELETE`. `visits` adalah satu-satunya tabel tanpa kolom `deleted_at` — history tidak ikut soft delete.

### 10.2 Aksi yang dicatat

`gate_open`, `gate_toggle`, `login`, `logout`, `room_view`, `connect`, `upload`, `invite_redeem`.

### 10.3 Noise reduction

- `logout` → `visible = false`.
- `room_view` duplikat dalam 60 detik untuk room yang sama oleh user yang sama → tidak dicatat.
- Deduplikasi dilakukan di `lib/visits.ts`, satu pintu.

### 10.4 Statistik

Dihitung on-the-fly dengan SQL, tanpa tabel counter. Semua agregasi dan tampilan memakai zona waktu **`Asia/Jakarta`**:

```sql
select date_trunc('day', created_at at time zone 'Asia/Jakarta') as day,
       count(*) filter (where action = 'room_view') as views,
       count(distinct session_hash) as uniques
from visits
where created_at > now() - interval '30 days' and visible
group by 1
order by 1 desc;
```

### 10.5 Analytics eksternal

- GA4 untuk funnel halaman.
- Cloudflare Web Analytics untuk pageview mentah tanpa cookie.

### 10.6 Backup

`scripts/backup.ts` dijalankan GitHub Action harian: dump `visits` + seluruh konten ke JSON/CSV, unggah ke R2. Retensi 90 hari. Baris yang sudah soft-delete **ikut** di-dump; file media tidak.

### 10.7 Log perubahan data

`audit_logs` mencatat setiap mutasi data: `create`, `update`, `soft_delete`, `restore` pada `chapter`, `room`, `item`, `playlist`, `invite`, `user`, dan `setting`.

- Ditulis dalam transaksi yang sama dengan mutasi, lewat `lib/audit.ts` — satu pintu.
- Menyimpan `before`/`after` sebagai JSON, plus `actor_id` dan `chapter_id`.
- Append-only: tidak pernah `UPDATE`, tidak pernah `DELETE`.
- `users.last_login_at` tidak dicatat agar log tidak penuh noise.
- Ditampilkan di `/admin/history` sebagai tab "Perubahan" (M6).

---

## 11. Keamanan

| Risiko | Mitigasi |
|---|---|
| Guest membuka ruangan terlarang | Cek `min_role` di repository (server), bukan di komponen |
| IDOR / akses lintas chapter | Semua query di-scope ke chapter + role di repository; ID entitas dari client tidak dipercaya |
| SQL injection | Drizzle memparameterisasi nilai; `sql.raw` dilarang; sort/filter hanya dari whitelist enum |
| Upload tidak sah | Hanya `owner`/`editor`; cek role di route handler sebelum presign |
| File kebesaran | Batas 500 MB per file video, dicek di server |
| Upload berbahaya (SVG/HTML) | Tolak `image/svg+xml` dan HTML; `allowed_formats` di signature Cloudinary; presign R2 mengunci content-type |
| Secret bocor | `*_SECRET`, `PRIVATE_KEY`, `BOT_TOKEN` hanya di env server (tanpa `NEXT_PUBLIC_`) |
| Path traversal R2 | Key dibuat server, bukan dari nama file client |
| Koneksi Postgres habis | Pooled `DATABASE_URL`, satu instance `db` |
| Backup hilang | Cron harian ke R2 |
| Session dicuri | Cookie `__Host-olu_session`, `httpOnly`, `secure`, `sameSite=lax`, ditandatangani `SESSION_SECRET`, umur 5 hari |
| CSRF | `sameSite=lax`; Server Actions memeriksa Origin; `/api/**` yang mengubah state wajib `assertSameOrigin` dan POST |
| XSS | React meng-escape teks; `dangerouslySetInnerHTML` dilarang; URL divalidasi (https + host allowlist); CSP bertahap |
| Open redirect | `?next=` divalidasi dengan `new URL(next, origin)`; `origin` harus sama, bukan cek awalan string |
| Mass assignment | Zod `.strict()` + pemetaan field eksplisit; body request tidak pernah disebar ke `insert`/`update` |
| Penghapusan tidak sengaja | Soft delete + `deleted_by`; pulihkan lewat SQL manual oleh owner |
| Media yatim | Diterima (D-018); pembersihan manual di dashboard Cloudinary/R2 |
| Perubahan data tanpa jejak | Setiap mutasi menulis `audit_logs` dengan `before`/`after` dan `actor_id` |
| Log diubah atau dihapus | `audit_logs` append-only; tidak ada endpoint update/delete |
| PII di audit log | Hanya `owner`/`editor` yang bisa membaca; secret tidak pernah dicatat |
| Seed jadi backdoor | Seed menolak jalan saat `NODE_ENV=production`; invite demo hanya dibuat di dev |
| Preview mengubah data produksi | `DATABASE_URL` environment Preview wajib Neon branch, bukan database produksi |
| Brute force invite/upload | Batas percobaan dihitung dari database per `session_hash`, bukan variabel memori |
| Dependency berbahaya | Versi dikunci persis, `npm ci`, `npm audit --omit=dev` di CI, dependency baru lewat `decisions.md` |
| Injeksi spam/judol lewat konten | Guest read-only; landing statis; caption tanpa auto-link/HTML; link keluar hanya allowlist; seluruh situs `noindex` |
| Preview dipakai hosting phishing | Standard Protection + Vercel Authentication untuk semua deployment non-produksi |
| Media dipakai host phishing | Origin terpisah dari aplikasi, `Content-Type`/ekstensi dikunci, SVG/HTML ditolak, bisa dihapus manual dari provider |
| Secret dicuri saat build | `npm ci --ignore-scripts` (diuji), Actions pin SHA + `permissions` minimal, secret tidak masuk log |

Rincian implementasi, aturan cookie, dan tabel verifikasi ada di **§18 Model Keamanan**.

---

## 12. Non-Functional Requirements

| Aspek | Target |
|---|---|
| Performa | LCP < 2,5 s pada 4G; CLS < 0,1; Lighthouse ≥ 90 |
| Bundle | First load JS halaman user < 200 KB gzip |
| Responsif | Tanpa scroll horizontal di 360–1440 px |
| Aksesibilitas | Fokus keyboard terlihat; kontras ≥ 4.5:1; `prefers-reduced-motion` dihormati |
| Offline | Shell + halaman terakhir bisa dibuka (PWA) |
| Kompatibilitas | Chrome/Safari/Firefox versi 2 tahun terakhir; iOS 16+ |
| Observability | Error server tercatat di Vercel logs; tidak ada `console.log` di produksi |
| Kualitas kode | `typecheck`, `lint`, `test:run`, `build` hijau di CI; coverage `lib/` ≥ 80% |

---

## 13. Milestone

| M | Isi | Definisi selesai |
|---|---|---|
| M1 | Scaffold, Tailwind, layout B/C, ambient layer, Vitest, CI, header keamanan + robots/noindex | Halaman kosong responsif di 360 & 1440; `npm run build` dan `npm run test:run` hijau; header §18.4 + `Disallow: /` terpasang |
| M2 | Drizzle schema + migrasi + seed + repository + unit test logika + `lib/audit.ts` | `npm run db:migrate` jalan; seed menghasilkan 1 chapter + 3 room (`touring`, `healing`, `music`) + 2 playlist; semua query filter `deleted_at` |
| M3 | Auth (`lib/auth/`) + `proxy.ts` + login/invite | Guest bisa masuk via invite; owner bisa masuk; cookie `__Host-` aktif; `/invite/CODE` tidak tercatat mentah di `visits` |
| M4 | CRUD chapter/room/item + castle map + room feed + room playlist + kartu lagu | Konten tampil di user dan bisa diedit di admin; room baru dari admin langsung punya halaman; hapus = soft delete + audit |
| M5 | Upload Cloudinary + R2 + poster canvas | Foto HEIC dari iPhone tampil di Chrome Android |
| M6 | Visits + dashboard history + statistik + tab perubahan | Aksi tercatat; data tidak bisa dihapus dari UI |
| M7 | Gate toggle + notifikasi Telegram | Gate berubah; pesan masuk ke Telegram |
| M8 | PWA + polish + a11y + CSP enforcement | Terinstal di iPhone 13 & Android; Lighthouse ≥ 90; CSP aktif tanpa pelanggaran |

Urutan wajib: **M1 → M2 → M3**. M4–M8 boleh paralel setelahnya.

---

## 14. Environment Variables

```
DATABASE_URL=postgres://...                 # pooled, dipakai runtime app
DATABASE_URL_UNPOOLED=postgres://...        # direct, dipakai drizzle-kit & script migrasi
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=                      # server only
FIREBASE_PRIVATE_KEY=                       # server only
SESSION_SECRET=                             # server only, penanda tangan cookie
OWNER_EMAIL=firdausfebrian666@gmail.com     # email owner pertama
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=                      # server only
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=                       # server only
R2_BUCKET=olu-media
R2_PUBLIC_BASE=https://pub-xxxxxxxx.r2.dev     # tanpa domain kustom
TELEGRAM_BOT_TOKEN=                         # server only
NEXT_PUBLIC_GA_ID=
```

`DATABASE_URL` di environment Preview Vercel wajib menunjuk Neon branch (D-038), bukan database produksi.

`DATABASE_URL_UNPOOLED` hanya dipakai alat yang butuh koneksi langsung: `drizzle-kit generate/migrate`, `scripts/seed.ts`, `scripts/backup.ts`, dan workflow `migrate.yml`. Runtime aplikasi tidak memakainya. Pooler Neon (PgBouncer) bermasalah untuk DDL dan transaksi panjang, jadi migrasi lewat pooler dilarang.

---

## 15. Keputusan Final

Diputuskan 2026-10-28, diperbarui 2026-10-29. Tidak ada pertanyaan terbuka. **Sumber kebenaran lengkap: `docs/decisions.md` (D-001 – D-047).**

| Topik | Keputusan |
|---|---|
| Domain | Tetap `*.vercel.app`, tanpa domain kustom |
| Akses konten | Login app wajib untuk semua konten; YouTube unlisted tanpa akun Google |
| Ruangan Healing | Bisa dilihat `guest`, tidak bisa diedit |
| Upload | Hanya `owner`/`editor`; batas 500 MB per file video |
| Video | Tanpa kompresi; R2 sumber utama, salinan YouTube unlisted manual |
| Lagu | Satu lagu tempelan per postingan, kartu + embed |
| Playlist | Kontainer Spotify per room `playlist`; hanya URL + judul + urutan; dikelola dari admin (D-042) |
| Navigasi | `/` landing publik; `/[chapter]` castle map; `rooms.kind` = `feed` / `playlist` (D-043) |
| Istilah | `event` → `chapter` di tabel, kolom, route, dan audit; label UI **Chapter** (D-044) |
| Nama chapter | "Our Little Universe", slug `our-little-universe` |
| Tanggal 17 Sep 2026 | Tidak ditampilkan di UI |
| Hapus konten | `owner` + `editor`; soft delete untuk semua tabel |
| Zona waktu | `Asia/Jakarta` |
| Repo & proteksi | Publik; tidak ada push langsung ke `main`; wajib PR + CI hijau |
| Branch | `development` = branch kerja harian tanpa CI; `main` = produksi/CI-CD, hanya dari PR rilis (D-047) |
| Next.js 16 | `proxy.ts`, Cache Components, data dinamis di `<Suspense>`; tanpa `force-dynamic` (D-045) |
| Dependency | Versi stabil terbaru saat instalasi, dikunci persis; upgrade lewat PR (D-045) |
| Testing | Vitest, coverage `lib/` ≥ 80%, wajib hijau di CI |
| Audit log | Setiap mutasi data dicatat di `audit_logs` (append-only, `before`/`after`) |
| Keamanan | Header wajib, cookie `__Host-`, cek Origin, tanpa seed produksi, CSP bertahap |
| Anti-penyalahgunaan | Seluruh situs `noindex`; landing statis; preview terautentikasi; tanpa auto-link/rich text; media tidak diproksikan |
| Framework & library | Read-only; error diperbaiki di call site atau versi; fork/patch butuh keputusan baru |

---

## 16. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Neon autosuspend 5 menit | Request pertama terasa lambat | Terima (± 500 ms), atau ping cron harian |
| Kuota Firebase Auth | — | Gratis tanpa batas praktis untuk 2–20 user |
| Vercel Hobby non-komersial | Situs bisa dinonaktifkan jika dipakai komersial | Pindah ke Cloudflare Pages bila perlu |
| R2 10 GB penuh | Video gagal upload | YouTube unlisted / hapus video lama / tier berbayar (tanpa kompresi) |
| `r2.dev` rate-limited | Video lambat atau gagal | Diterima untuk 2–20 user; beli domain jika mengganggu |
| Media yatim | File menumpuk permanen di R2/Cloudinary | Diterima (D-018); bersihkan manual dari dashboard provider |
| Baris soft-deleted menumpuk | Ruang DB 0,5 GB terpakai | Pantau; arsip manual saat mendekati batas |
| AI menulis di luar pola | Kode berantakan | `docs/agent-rules.md` |
| Situs disusupi dan dipakai spam judol | Nama domain tercemar, konten privat bocor | Noindex total, landing statis, guest read-only, allowlist link, preview terautentikasi, playbook insiden §18.11 |

---

## 17. CI/CD & Pengujian

### 17.1 Model branch

```
main                 ← produksi / CI-CD; hanya menerima PR rilis dari development
development          ← branch kerja harian; tanpa ruleset, tanpa CI
feat/<ringkas>  fix/<ringkas>  chore/<ringkas>  db/<ringkas>  docs/<ringkas>
                     dibuat dari development
```

**Dilarang push langsung ke `main`.** `development` boleh di-push bebas sebagai backup pekerjaan.

Alur harian: buat branch dari `development` → kerja → jalankan `typecheck`, `lint`, `test:run` di lokal → squash merge ke `development` (boleh langsung, boleh lewat PR kecil) → push.

Alur rilis: PR `development` → `main` → `verify` hijau → squash merge. Merge ke `main` adalah satu-satunya pemicu deploy produksi.

Karena `development` tidak melewati CI, verifikasi lokal di `docs/agent-rules.md` §6 (Definition of Done) bersifat wajib, bukan opsional.

### 17.2 Ruleset `main`

Diterapkan sebagai GitHub Ruleset (`bypass_actors` kosong, tidak ada pengecualian):

| Aturan | Efek |
|---|---|
| `deletion` | branch `main` tidak bisa dihapus |
| `non_fast_forward` | force-push ditolak |
| `pull_request` | wajib PR; 0 approval karena dikerjakan sendiri; thread wajib selesai |
| `required_status_checks` | job `verify` wajib hijau, `strict` |

`development` sengaja tidak diproteksi (D-047). Repo bersifat **publik** agar ruleset dan Actions gratis tanpa batas menit.

GitHub tidak punya setelan native untuk membatasi branch sumber PR, jadi aturan "PR ke `main` hanya dari `development`" dijaga secara proses.

### 17.3 Workflow

| File | Pemicu | Isi |
|---|---|---|
| `.github/workflows/ci.yml` | PR ke `main` + push `main` | `npm ci` → cek migrasi ter-commit → typecheck → lint → test → build |
| `.github/workflows/migrate.yml` | manual + input `MIGRATE` | `db:migrate` ke Neon |
| `.github/workflows/backup.yml` | cron 18.00 UTC (01.00 WIB) | dump DB ke R2 |

Aturan CI:
- `npx drizzle-kit generate` dilanjutkan `git diff --exit-code drizzle/` — PR gagal jika skema berubah tanpa migrasi.
- **Build tidak boleh menyentuh database.** Cache Components membolehkan shell statis tanpa query: data gate/DB dibungkus `<Suspense>` dan berjalan saat request, bukan saat build. Jangan memakai `use cache` untuk data privat. `NEXT_PUBLIC_*` diisi dummy saat CI.
- Tidak ada `export const dynamic` di kode; konfigurasi route mengikuti Cache Components (D-045).
- Workflow `migrate.yml` dan `backup.yml` memakai environment `production` (reviewer wajib) dan koneksi langsung `DATABASE_URL_UNPOOLED`.
- `development` tidak menjalankan workflow. Push ke `development` hanya memicu preview deployment Vercel.
- Migrasi **tidak** dijalankan otomatis saat merge; SQL hasil generate wajib dibaca lebih dulu.
- `npm audit --omit=dev --audit-level=high` — PR gagal jika ada kerentanan `high`.
- Pemindaian pola secret: gagal jika `NEXT_PUBLIC_*.{SECRET,TOKEN,PRIVATE}` atau `BOT_TOKEN` muncul di kode client.
- Actions di-pin ke **commit SHA**, bukan tag; `permissions: contents: read`; `pull_request_target` dilarang.
- Install memakai `npm ci --ignore-scripts`. Jika ada dependency yang benar-benar butuh postinstall, allowlist eksplisit di `decisions.md`.
- Build CI hanya memakai `NEXT_PUBLIC_*` dummy; secret server tidak pernah tersedia saat build.
- Build Vercel memakai `installCommand` di `vercel.json`: `npm ci --ignore-scripts`.
- Preview deployment memakai Vercel Authentication (Standard Protection); tidak ada preview publik.

### 17.4 Unit test

Runner **Vitest** + Testing Library, environment `node` (komponen memakai docblock `jsdom`). File test berdampingan dengan sumbernya: `lib/visits.ts` → `lib/visits.test.ts`.

| Diuji | Tidak diuji |
|---|---|
| Zod schema (slug, caption, host lagu, URL playlist, kode invite) | Server Component Next (E2E) |
| `hasMinRole`, validasi invite | Query repository & migrasi (Neon branch) |
| dedupe `room_view` 60 detik, `session_hash`, `logout` | Upload Cloudinary/R2 (manual M5) |
| URL builder Cloudinary, key R2, batas 500 MB | |
| `format-date` Asia/Jakarta | |
| `lib/audit.ts` — bentuk payload `before`/`after`, penolakan field rahasia | |
| `lib/security/` — `assertSameOrigin`, validasi `?next=`, whitelist sort/filter, allowlist host URL | |
| `normalizeVisitPath` — redaksi `/invite/[code]`, buang query/hash | |
| `robots`/header `noindex` terbentuk dari satu sumber | |
| komponen UI kecil, `song-card`, dan `playlist-card` | |

- Threshold coverage: **80% baris & fungsi** untuk `lib/` dan `components/`; `app/` dikecualikan.
- Fungsi yang diuji harus menerima `now` sebagai parameter dan dipisah dari I/O.
- `lib/db` selalu di-mock; unit test tidak pernah membuka koneksi.

### 17.5 Deploy

Integrasi Git Vercel, tanpa pipeline deploy sendiri:

| Kejadian | Hasil |
|---|---|
| Push ke `development` | preview deployment, terlindungi Vercel Authentication; tanpa CI |
| PR `development` → `main` | preview deployment + CI `verify` |
| Merge ke `main` | production deployment |

Push ke `development` yang terlalu sering memakai kuota build Vercel. Jika mengganggu, aktifkan Ignored Build Step untuk branch itu.

### 17.6 Rahasia

GitHub Actions: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
Vercel: seluruh variabel §14, dipisah Production dan Preview. Secret tidak pernah masuk `NEXT_PUBLIC_*`.
`DATABASE_URL` di environment **Preview wajib menunjuk Neon branch**, bukan database produksi (D-038).

### 17.7 Anggaran

Semua komponen CI/CD di atas gratis: Actions tanpa batas menit untuk repo publik, Vercel Hobby, Neon Free, R2 Free, Cloudinary Free, Firebase Spark.

---

## 18. Model Keamanan

### 18.1 Prinsip

1. **Server yang memutuskan.** Role, kepemilikan, dan validasi tidak pernah hanya di client.
2. **Input tidak dipercaya.** Semua input lewat Zod `.strict()`, lalu dipetakan eksplisit ke field DB.
3. **Deny by default.** Route baru tidak dapat diakses sampai aturan role-nya didefinisikan.
4. **Gagal tertutup.** Error mengembalikan pesan generik, bukan detail database.
5. **Tidak ada jalur rahasia.** Tidak ada endpoint debug, akun hardcode, atau bypass berbasis query param.

### 18.2 SQL injection

- Drizzle mengikat nilai sebagai parameter; jangan pernah menyusun SQL dengan string.
- Dilarang: `sql.raw()` dengan input, `db.execute()` berisi string dinamis, interpolasi nama kolom dari request.
- Kolom pengurutan dan filter hanya dari **whitelist enum** yang didefinisikan di kode.
- Repository hanya menerima parameter bertipe, tidak menerima fragmen SQL.

### 18.3 CSRF

- Cookie sesi `sameSite=lax` — POST lintas situs tidak membawa cookie.
- Server Actions memakai pemeriksaan Origin/Host bawaan Next; jangan menggantinya dengan route handler tanpa alasan.
- Setiap route handler `/api/**` yang mengubah state:
  - hanya menerima `POST`,
  - `content-type: application/json`,
  - memanggil `assertSameOrigin(request)` sebelum logika apa pun.
- Tidak ada mutasi lewat `GET`.

### 18.4 XSS dan CSP

- React meng-escape teks. `dangerouslySetInnerHTML`, `eval`, `new Function` dilarang.
- URL dari user divalidasi: skema `https` saja, host harus `open.spotify.com`, `youtube.com`, `youtu.be`, atau domain Cloudinary/R2.
- Embed dibentuk di server dari ID tervalidasi, bukan dari URL mentah.
- `public_id` Cloudinary divalidasi regex sebelum membentuk URL transformasi.
- Header wajib sejak M1: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Cross-Origin-Opener-Policy: same-origin`, `Permissions-Policy` minimal (kamera, mikrofon, lokasi mati), serta `X-Robots-Tag` noindex.
- Respons yang membawa sesi memakai `Cache-Control: no-store`.
- CSP bertahap: `Content-Security-Policy-Report-Only` di M6, enforcement di M8 dengan nonce. Sumber yang diizinkan: self, Cloudinary, `pub-*.r2.dev`, `youtube.com`, `open.spotify.com`, GA4.

### 18.5 Otorisasi dan backdoor

- `requireRole()` dipanggil di setiap Server Component/Action yang menulis, dan di route handler sebelum presign.
- `proxy.ts` hanya untuk redirect; bukan satu-satunya pengecekan.
- `OWNER_EMAIL` hanya mempromosikan user yang sudah terverifikasi provider (Google/email link), dan hanya saat login pertama.
- Seed menolak jalan bila `NODE_ENV=production`; invite `DEMO2026` dan user demo hanya dibuat di dev.
- Tidak ada endpoint debug, impersonasi, atau akun dengan kata sandi hardcode.
- Domain Firebase harus **hostname persis**. Tidak ada wildcard. Preview Vercel tidak dipakai untuk menguji login.
- `?next=` setelah login hanya menerima path internal. Validasi memakai `new URL(next, origin)` dan membandingkan `origin`, bukan cek awalan `//`.
- Kode invite minimal 8 karakter acak, bukan kata kamus; percobaan redeem dibatasi lewat hitungan database.

### 18.6 Upload dan media

- Signature Cloudinary dibuat server, menyertakan `allowed_formats` (jpg, png, webp, heic, mp4, mov), `max_file_size`, dan folder tetap.
- Tolak `image/svg+xml` dan HTML.
- Key R2 dibuat server: `chapters/{chapterId}/{uuid}.{ext}`; presign mengunci `Content-Type` dan berlaku maksimal 5 menit.
- Semua media berada di domain publik provider. Keamanan bergantung pada key berisi uuid, bukan pada URL rahasia.
- Media **tidak** disajikan lewat domain aplikasi: loader mengarah langsung ke provider; tidak ada `rewrite`/route/optimizer untuk upload.
- Cloudinary memakai strict transformations, signed upload, dan `overwrite: false`.

### 18.7 Sesi dan cookie

- Nama cookie `__Host-olu_session` (mensyaratkan `Path=/`, `Secure`, tanpa `Domain`).
- Atribut: `httpOnly`, `secure`, `sameSite=lax`, umur 5 hari, ditandatangani `SESSION_SECRET`.
- Nilai cookie baru dibuat setiap login (mencegah session fixation).
- Tidak ada revocation server-side di v1: cookie bertanda tangan berlaku sampai kedaluwarsa (5 hari). Logout menghapus cookie dan mencatat `visits(action='logout')`.

### 18.8 Data dan privasi

- `visits.path` disimpan ternormalisasi: tanpa query/hash, dan `/invite/{code}` diredaksi menjadi `/invite/[redacted]`.
- `audit_logs` menyimpan `before`/`after`; akses baca hanya untuk `owner`/`editor`, dan tidak pernah memuat secret.
- Backup harian ke R2 memuat baris soft-deleted; bucket backup terpisah dari bucket media dan tidak dapat di-list publik.
- PWA tidak boleh meng-cache respons terautentikasi; hanya app shell.

### 18.9 Dependency

- Versi dikunci persis; lockfile di-commit; CI memakai `npm ci`.
- Versi mengikuti rilis stabil terbaru saat instalasi. Upgrade lewat PR tersendiri, dan dokumen menyesuaikan API terpasang — bukan sebaliknya, bukan downgrade untuk mempertahankan pola lama.
- Install memakai `--ignore-scripts`; postinstall hanya untuk paket yang di-allowlist eksplisit.
- Actions di-pin ke commit SHA, `permissions` minimal, tanpa `pull_request_target`.
- `npm audit --omit=dev` di CI, gagal pada tingkat `high`.
- Dependency baru wajib dicatat di `docs/decisions.md`.
- Dependabot mingguan untuk npm dan GitHub Actions; diff lockfile dibaca sebelum merge.
- **Framework dan library read-only.** `node_modules/**`, source Next.js/React/Drizzle/Tailwind/SDK, dan `.next/**` tidak diedit. Error diperbaiki di call site atau lewat perubahan versi; fork/patch hanya lewat keputusan baru.

### 18.10 Verifikasi keamanan

| Uji | Cara | Ekspektasi |
|---|---|---|
| SQL injection | Kirim `' OR 1=1--` pada kode invite dan filter | Ditolak validasi, tidak ada error SQL |
| CSRF | `curl -X POST` dengan Origin berbeda, tanpa cookie | 403 |
| XSS | Caption `"><img src=x onerror=alert(1)>` | Tampil sebagai teks biasa |
| Open redirect | `/login?next=https://contoh-palsu.test` | Diabaikan, kembali ke `/` |
| Backdoor seed | Jalankan seed dengan `NODE_ENV=production` | Berhenti dengan pesan jelas |
| Preview DB | Periksa env Preview di Vercel | Menunjuk Neon branch, bukan produksi |
| Header | `curl -I` halaman utama | Header keamanan §18.4 ada |
| Noindex | `curl -I /` dan `GET /robots.txt` | `X-Robots-Tag` noindex; `Disallow: /` |
| Preview | Buka URL preview tanpa sesi Vercel | Tertahan Vercel Authentication |
| Log invite | Kunjungi `/invite/ABC123`, lihat `visits` | Tersimpan `/invite/[redacted]` |
| Open redirect varian | `?next=/\evil.com`, `%2F%2Fevil.com`, `https://evil.com` | Semua ditolak |
| Upload berbahaya | Upload `.html` / `.svg` | Ditolak sebelum presign |
| URL playlist | Tempel `https://open.spotify.com/playlist/<id>?si=abc` dan URL host lain | `?si=` dibuang; host lain ditolak |
| Image proxy | `/_next/image?url=https://evil.test/x.jpg` | 400, host tidak diizinkan |
| Build tanpa script | `npm ci --ignore-scripts && npm run build` | Hijau |
| Dependency | `npm audit --omit=dev` | Tidak ada `high`/`critical` |

### 18.11 Anti-penyalahgunaan (spam judol / adware)

Prinsip: situs ini **tidak menghasilkan trafik organik** dan **tidak punya konten dari pengunjung**. Dua sifat itu yang membuatnya tidak menarik bagi bandar judol. Jangan merusaknya tanpa keputusan baru.

#### a. Nilai SEO dibuat nol

- `app/robots.ts` mengembalikan `Disallow: /` untuk semua user-agent.
- Header `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex` di semua respons HTML, termasuk preview.
- Tidak ada sitemap, RSS, halaman daftar publik, atau "share page".
- Landing `/` memakai **copy statis**; DB hanya memberi status `gate_open`. Judul chapter, nama guardian, dan isi ruangan tidak pernah dirender di halaman publik.
- Metadata dan OG image statis. Tidak ada `opengraph-image` yang membaca database — crawler sosial tidak boleh bisa menarik konten privat tanpa login.
- `poweredByHeader: false`; tanpa domain kustom dan tanpa wildcard DNS.

#### b. Tidak ada jalur menulis konten publik

- Guest read-only. Tidak ada komentar, guestbook, form kontak, atau upload dari guest.
- `/invite/[code]` sebelum login hanya copy generik; validasi kode setelah sesi ada.
- Caption dan deskripsi adalah teks biasa: tanpa markdown, HTML, atau auto-link.
- Link keluar hanya `items.url`, `song_url`, dan `playlists.url`, semuanya lewat allowlist. Label link tidak bisa diubah menjadi URL lain.
- Server tidak pernah mengambil URL dari user (anti-SSRF). Thumbnail YouTube dibentuk dari ID, bukan dari URL mentah.

#### c. Media tidak menjadi host phishing

- Cloudinary dan R2 tetap origin terpisah. Tidak ada `rewrite`, route handler, atau optimizer yang menyajikan upload dari domain aplikasi.
- `Content-Type` dan ekstensi dikunci; `.html`, `.svg`, dan `.js` ditolak.
- Cloudinary memakai strict transformations, signed upload, dan `overwrite: false`.
- Bucket backup privat dan terpisah dari bucket media; token R2 dibatasi per bucket; CORS hanya untuk origin aplikasi.
- Media yang terbukti disalahgunakan boleh dihapus manual dari dashboard provider.

#### d. Preview bukan ruang publik

- Standard Protection + Vercel Authentication untuk semua deployment non-produksi.
- Preview tidak dipakai menguji login Firebase.
- Vercel sudah memberi noindex pada preview, tetapi header eksplisit tetap dipasang.

#### e. Injeksi script dan iframe

- CSP enforcement di M8 (report-only M6): `script-src` nonce, `object-src 'none'`, `base-uri 'none'`, `form-action 'self'`, `frame-src` hanya YouTube/Spotify, `frame-ancestors 'none'`, `worker-src 'self'`.
- Tidak ada ad network, tag manager, atau script pihak ketiga selain GA4.
- Service worker hanya dari origin sendiri dan tidak pernah meng-cache HTML terautentikasi.
- `Cache-Control: no-store` untuk respons yang membawa sesi.
- `Referrer-Policy: no-referrer`; iframe embed memakai `referrerpolicy="no-referrer"`.

#### f. Deteksi

- Notifikasi deployment Vercel ke email/Telegram.
- Alert kuota Cloudflare R2, Neon, dan Cloudinary.
- Review mingguan `/admin/history` plus daftar user dan invite.
- Tanda bahaya: user/invite tak dikenal, `create` di luar kebiasaan, lonjakan bandwidth R2, deployment tanpa PR, halaman baru muncul di hasil pencarian.

#### g. Playbook insiden

1. **Bekukan** — pause project Vercel, putuskan integrasi Git sementara.
2. **Cabut** — rotasi `SESSION_SECRET` (semua sesi keluar), Firebase service account, Cloudinary, R2, Neon, dan Telegram; revoke token GitHub/Vercel.
3. **Periksa** — `audit_logs`, daftar deployment, usage provider, query history Neon.
4. **Pulihkan** — deploy commit terakhir yang dikenal baik, restore Neon branch, hapus preview dan media penyalahgunaan.
5. **Laporkan** — Vercel abuse, Cloudflare abuse, Google Search Console removal.
6. **Catat** — tambahkan keputusan dan test regresi.

#### h. Batas yang diterima

- `pub-*.r2.dev` dapat diakses siapa pun yang mengetahui URL; keamanannya bergantung pada key UUID, bukan URL rahasia.
- `noindex` berarti situs tidak muncul di pencarian — memang tujuannya.
- Preview memerlukan login Vercel di perangkat yang membukanya.

Fitur baru yang membuka konten publik, komentar, atau upload dari guest **wajib** melewati keputusan baru di `docs/decisions.md`.

### 18.12 Akun dan kredensial

- 2FA atau passkey wajib di GitHub, Vercel, Cloudflare, Neon, Google/Firebase, dan Telegram.
- GitHub: secret scanning + push protection aktif; token classik dengan scope lebar tidak dipakai; deploy key read-only.
- Vercel: token dibatasi per project, token lama dicabut; notifikasi deployment aktif.
- Cloudflare: token R2 dibatasi per bucket (media vs backup), tidak memakai global API key.
- Cloudinary: API secret hanya di server; strict transformations aktif.
- Firebase: service account key dirotasi jika ada indikasi bocor; authorized domains hanya hostname persis.
- Secret yang pernah masuk git dianggap bocor permanen — rotasi, bukan sekadar hapus commit.
- Log build tidak boleh memuat secret; env server tidak pernah masuk `NEXT_PUBLIC_*`.
- Review kuartalan: daftar token aktif, anggota project, dan authorized domains.
