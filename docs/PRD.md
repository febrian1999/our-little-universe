# PRD — Our Little Universe

**Versi:** 2.3
**Status:** Final — siap implementasi
**Pemilik:** Ian
**Update terakhir:** 2026-10-28
**Asal:** project mangkrak `mybf.ian-gift` (Echa)
**Target biaya:** Rp 0
**Dokumen terkait:** `docs/schema.md`, `docs/agent-rules.md`, `docs/decisions.md`

---

## 1. Konteks

| Item | Isi |
|---|---|
| Apa ini | Website personal berisi "ruang" kenangan (foto, video, surat, lagu) yang bisa diisi terus-menerus oleh pemiliknya |
| Untuk siapa | Ian (owner) dan orang-orang yang diundang (guest) |
| Masalah yang diselesaikan | Project lama hanya kerangka: 3 halaman statis, tanpa konten, dan tidak ada cara menambah isi tanpa mengedit kode |
| Prinsip utama | Bisa dirawat 2–3 tahun oleh satu orang non-desainer, dengan AI sebagai rekan implementasi |

### 1.1 Warisan dari project lama

Dipertahankan:
- Konsep "Gate" sebagai pintu masuk.
- Nama ruangan: Homepage, Touring, Healing, Music.
- Narasi Princess × Guardian.
- Tanggal 17 September 2026 disimpan sebagai data (`events.starts_at`), **tidak ditampilkan** di UI.

Dibuang:
- `guardian-syc-firebase.js` (dead code, tidak pernah di-import).
- CSS inline di setiap file HTML.
- Status guardian yang di-hardcode di landing page.
- Tombol gate yang rusak (`<button> onclick="openGate()"🔒 Open The Gate</button>` — atribut masuk ke text content).
- Firebase Hosting dan Firestore sebagai database.

---

## 2. Ruang Lingkup

### 2.1 v1.0 (harus ada)

- Login (Google + email link) dengan role `owner` / `editor` / `guest`.
- Gate yang bisa dibuka/tutup manual oleh owner.
- Multi-event (satu instalasi bisa menampung beberapa momen, mis. anniversary, ulang tahun).
- Empat ruangan per event, dapat ditambah/diubah.
- CRUD konten (teks, foto, video, lagu).
- Upload foto (Cloudinary) dan video (Cloudflare R2) — hanya `owner`/`editor`.
- Undangan berbasis kode + batas pemakaian.
- History append-only yang tidak pernah dihapus.
- Dashboard admin: KPI, timeline, pengelolaan konten.
- Lagu tempelan opsional di setiap postingan (kartu + embed).
- PWA yang bisa diinstal di iPhone 13 dan Android.
- Notifikasi Telegram yang bisa dimatikan.
- Penghapusan bersifat **soft delete** — tidak ada hard delete, data tidak hilang permanen.
- Unit test (Vitest) untuk logika murni, wajib hijau di CI.
- Audit log perubahan data (append-only), terpisah dari history kunjungan.
- CI GitHub Actions + proteksi `main`: tidak ada push langsung, semua lewat PR.

### 2.2 Di luar v1.0

- Komentar, chat, reaksi emoji.
- Multi-tenant (banyak pasangan dalam satu instalasi).
- Pembayaran.
- Email transaksional.
- Aplikasi mobile native.
- Kompresi/transcoding video (browser maupun server) — video ditampilkan apa adanya.
- Upload media oleh `guest`.

---

## 3. Keputusan Teknis

Keputusan di bawah ini mengikat. Perubahan harus dicatat di `docs/decisions.md`.

| Layer | Keputusan | Alasan |
|---|---|---|
| Framework | Next.js 16.4.3 App Router | Versi stabil terbaru; Turbopack default |
| Bahasa | TypeScript 5.9.3 `strict` | Tipe ketat; TS 7 ditunda sampai ekosistem siap |
| Styling | Tailwind CSS 4.3.3 | Konfigurasi lewat `@theme` di CSS |
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

---

## 4. Role & Hak Akses

| Role | Hak |
|---|---|
| `owner` | Semua; menghapus event; mengubah role user; membuka/menutup gate; mengatur notifikasi |
| `editor` | Menambah/edit/hapus event, room, dan item; upload media; tidak bisa mengubah role |
| `guest` | Membaca semua ruangan (`min_role = guest`); **tidak bisa** upload, edit, atau hapus |

Aturan akses halaman:

| Route | Akses |
|---|---|
| `/` | publik |
| `/login` | publik |
| `/invite/[code]` | publik (redeem butuh login) |
| `/[eventSlug]` | login (semua role) |
| `/[eventSlug]/[roomKey]` | login + `role >= room.min_role` |
| `/admin/**` | `owner` atau `editor` |

Semua pengecekan role dilakukan **di server** (middleware + repository), tidak pernah hanya di client.

Semua room — termasuk `healing` — memakai `min_role = guest`. Pembatasan tulis murni berbasis role: hanya `owner` dan `editor`.

`owner` dan `editor` sama-sama boleh menghapus event, room, dan item. Semua penghapusan adalah **soft delete** (`deleted_at` + `deleted_by`); tidak ada `DELETE` di aplikasi dan tidak ada UI pemulihan di v1.

---

## 5. Alur Utama

### 5.1 Masuk

```
/  → klik "Open The Gate"
   ├─ gate tertutup → tampilkan "Belum dibuka", tombol disabled
   └─ gate terbuka  → /login jika belum ada sesi → /[eventSlug]
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

### 5.3 Guardian Connect

Dipertahankan dari project lama, disederhanakan:

```
Login → halaman /[eventSlug]/connect
  → isi nama + birthday (opsional)
  → POST → settings['guardian'] = { name, birthday, lastSeen }
  → visits(action='connect')
  → owner melihat status via polling GET /api/guardian (5 detik, hanya saat tab aktif)
  → jika notifikasi aktif: POST /api/notify/telegram
```

### 5.4 Menambah konten

Hanya `owner` dan `editor`. `guest` tidak melihat tombol ini dan endpoint upload menolaknya di server.

```
/admin → pilih event → pilih room → "Tambah item"

foto     → POST /api/upload/sign            → upload langsung ke Cloudinary
           → simpan { type:'photo', provider:'cloudinary', public_id, width, height }
video    → POST /api/upload/r2/presign      → PUT langsung browser ke R2
           → ambil frame pertama di canvas  → upload poster ke Cloudinary
           → simpan { type:'video', provider:'r2', url, thumb_url, duration_s }
video >500 MB → tempel URL YouTube unlisted → simpan { type:'video', provider:'youtube', url }
lagu     → tempel URL Spotify/YouTube       → simpan { type:'song', provider:'spotify', url }
teks     → tulis langsung                   → simpan { type:'text', caption }
```

Setiap item non-lagu boleh diberi **satu lagu tempelan** lewat `song_provider`, `song_url`, `song_title`, `song_start_s`. Kartu lagu memutar embed; autoplay dicoba, dan jika browser memblokir, pemutaran dimulai pada sentuhan pertama di ruangan. Musik berhenti saat pindah room.

Upload dicatat sebagai `upload` di `visits`.

### 5.5 Membuka gate

```
/admin → toggle gate
  → update events.gate_open
  → visits(action='gate_toggle')
  → halaman gate di landing langsung berubah (revalidasi / polling)
```

---

## 6. Peta Halaman

```
/                                  landing + gate
/login                             login
/auth/action                       penyelesaian email link Firebase
/invite/[code]                     redeem undangan
/[eventSlug]                       universe home (layout B)
/[eventSlug]/[roomKey]             ruangan
/[eventSlug]/connect               guardian connect
/admin                             dashboard (layout C)
/admin/events                      daftar event
/admin/events/[id]                 detail event + daftar room
/admin/events/[id]/rooms/[roomId]  daftar item + form item
/admin/media                       pustaka media
/admin/access                      invite + daftar user
/admin/history                     timeline kunjungan + log perubahan
/admin/settings                    gate, notifikasi, analytics
```

---

## 7. Spesifikasi UI

### 7.1 Prinsip

- Mobile-first. Desktop adalah penyempurnaan, bukan sebaliknya.
- Lebar minimum yang didukung: **360 px**. Target utama: **390 px** (iPhone 13).
- Tidak boleh ada scroll horizontal di lebar mana pun.
- Target sentuh minimum 44×44 px (Apple HIG / Material).
- Animasi ambient tidak boleh memengaruhi layout (harus `position: fixed` + `pointer-events: none`).

### 7.2 Layout per area

**User → Opsi B (two column)**
```
Desktop ≥1024px                     Mobile <1024px
┌──────────┬──────────────────┐     ┌──────────────┐
│ identitas│  grid ruangan    │     │ identitas    │
│ status   │  1/2/3 kolom     │     ├──────────────┤
│ nav      │  feed terbaru    │     │  grid 1 kolom│
│ (sticky) │                  │     │              │
└──────────┴──────────────────┘     ├──────────────┤
 260px       max-w-6xl              │ bottom nav   │
└──────────────┘
```

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
| Gate | Kartu `max-w-md`; tombol disabled + pesan jelas saat gate tutup; tanpa scroll horizontal di 360 px |
| User home | Sidebar sticky tidak menutupi konten; grid 1/2/3 kolom; bottom nav mobile tidak menutupi item terakhir (`pb-24`) |
| Room | Video `preload="metadata"` + poster; gambar `srcset` 3 ukuran; lightbox bisa ditutup dengan Esc |
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

### 8.1 Aturan

- Upload **selalu** lewat endpoint server yang memverifikasi sesi + role. Tidak ada unsigned preset.
- Upload hanya untuk role `owner`/`editor`; `guest` read-only.
- Batas **500 MB per file** video, dicek di server sebelum presign. Video lebih besar diarahkan ke YouTube unlisted karena tidak ada kompresi.
- Poster video diambil otomatis dari frame pertama di browser lalu diunggah ke Cloudinary (bukan R2) agar hemat bandwidth. Jika gagal, poster boleh kosong.
- Salinan YouTube wajib **unlisted**, tidak pernah `public` dan tidak dipublikasikan ke channel.
- Key R2 dibuat server: `events/{eventId}/{uuid}.{ext}` — mencegah path traversal.
- R2 butuh CORS: `AllowedOrigins: [domain app]`, `AllowedMethods: [PUT, GET]`, `AllowedHeaders: [*]`.
- Tanpa domain kustom, bucket diakses lewat `https://pub-xxxx.r2.dev`.
- Menghapus item **tidak** menghapus file di Cloudinary/R2. Pembersihan aset dilakukan manual dari dashboard provider.
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

`audit_logs` mencatat setiap mutasi data: `create`, `update`, `soft_delete`, `restore` pada `event`, `room`, `item`, `invite`, `user`, dan `setting`.

- Ditulis dalam transaksi yang sama dengan mutasi, lewat `lib/audit.ts` — satu pintu.
- Menyimpan `before`/`after` sebagai JSON, plus `actor_id` dan `event_id`.
- Append-only: tidak pernah `UPDATE`, tidak pernah `DELETE`.
- `users.last_login_at` tidak dicatat agar log tidak penuh noise.
- Ditampilkan di `/admin/history` sebagai tab "Perubahan" (M6).

---

## 11. Keamanan

| Risiko | Mitigasi |
|---|---|
| Guest membuka ruangan terlarang | Cek `min_role` di repository (server), bukan di komponen |
| Upload tidak sah | Hanya `owner`/`editor`; cek role di route handler sebelum presign |
| File kebesaran | Batas 500 MB per file video, dicek di server |
| Secret bocor | `*_SECRET`, `PRIVATE_KEY`, `BOT_TOKEN` hanya di env server (tanpa `NEXT_PUBLIC_`) |
| Path traversal R2 | Key dibuat server, bukan dari nama file client |
| Koneksi Postgres habis | Pooled `DATABASE_URL`, satu instance `db` |
| Backup hilang | Cron harian ke R2 |
| Session dicuri | Cookie `httpOnly`, `secure`, `sameSite=lax`, ditandatangani `SESSION_SECRET`, umur 5 hari |
| Penghapusan tidak sengaja | Soft delete + `deleted_by`; pulihkan lewat SQL manual oleh owner |
| Media yatim | Diterima (D-018); pembersihan manual di dashboard Cloudinary/R2 |
| Perubahan data tanpa jejak | Setiap mutasi menulis `audit_logs` dengan `before`/`after` dan `actor_id` |
| Log diubah atau dihapus | `audit_logs` append-only; tidak ada endpoint update/delete |

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
| M1 | Scaffold, Tailwind, layout B/C, ambient layer, Vitest, CI | Halaman kosong responsif di 360 & 1440; `npm run build` dan `npm run test:run` hijau |
| M2 | Drizzle schema + migrasi + seed + repository + unit test logika + `lib/audit.ts` | `npm run db:migrate` jalan; seed menghasilkan 1 event + 4 room; semua query filter `deleted_at` |
| M3 | Auth (`lib/auth/`) + middleware + login/invite | Guest bisa masuk via invite; owner bisa masuk |
| M4 | CRUD event/room/item + halaman user + kartu lagu | Konten tampil di user dan bisa diedit di admin; hapus = soft delete + audit |
| M5 | Upload Cloudinary + R2 + poster canvas | Foto HEIC dari iPhone tampil di Chrome Android |
| M6 | Visits + dashboard history + statistik + tab perubahan | Aksi tercatat; data tidak bisa dihapus dari UI |
| M7 | Gate toggle + notifikasi Telegram | Gate berubah; pesan masuk ke Telegram |
| M8 | PWA + polish + a11y | Terinstal di iPhone 13 & Android; Lighthouse ≥ 90 |

Urutan wajib: **M1 → M2 → M3**. M4–M8 boleh paralel setelahnya.

---

## 14. Environment Variables

```
DATABASE_URL=postgres://...                 # pooled
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

---

## 15. Keputusan Final

Diputuskan 2026-10-28. Tidak ada pertanyaan terbuka. **Sumber kebenaran lengkap: `docs/decisions.md` (D-001 – D-034).**

| Topik | Keputusan |
|---|---|
| Domain | Tetap `*.vercel.app`, tanpa domain kustom |
| Akses konten | Login app wajib untuk semua konten; YouTube unlisted tanpa akun Google |
| Ruangan Healing | Bisa dilihat `guest`, tidak bisa diedit |
| Upload | Hanya `owner`/`editor`; batas 500 MB per file video |
| Video | Tanpa kompresi; R2 sumber utama, salinan YouTube unlisted manual |
| Lagu | Satu lagu tempelan per postingan, kartu + embed |
| Nama event | "Our Little Universe", slug `our-little-universe` |
| Tanggal 17 Sep 2026 | Tidak ditampilkan di UI |
| Hapus konten | `owner` + `editor`; soft delete untuk semua tabel |
| Zona waktu | `Asia/Jakarta` |
| Repo & proteksi | Publik; tidak ada push langsung ke `main`; wajib PR + CI hijau |
| Testing | Vitest, coverage `lib/` ≥ 80%, wajib hijau di CI |
| Audit log | Setiap mutasi data dicatat di `audit_logs` (append-only, `before`/`after`) |

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

---

## 17. CI/CD & Pengujian

### 17.1 Model branch

```
main                 ← produksi; hanya menerima merge dari PR
feat/<ringkas>       fix/<ringkas>      chore/<ringkas>      db/<ringkas>
```

**Dilarang push langsung ke `main`**, termasuk oleh owner. Alur wajib: buat branch → commit → push branch → PR → CI hijau → squash merge → branch dihapus.

### 17.2 Ruleset `main`

Diterapkan sebagai GitHub Ruleset (`bypass_actors` kosong, tidak ada pengecualian):

| Aturan | Efek |
|---|---|
| `deletion` | branch `main` tidak bisa dihapus |
| `non_fast_forward` | force-push ditolak |
| `pull_request` | wajib PR; 0 approval karena dikerjakan sendiri; thread wajib selesai |
| `required_status_checks` | job `verify` wajib hijau, `strict` (harus rebase ke `main` terbaru) |

Repo bersifat **publik** agar ruleset dan Actions gratis tanpa batas menit.

### 17.3 Workflow

| File | Pemicu | Isi |
|---|---|---|
| `.github/workflows/ci.yml` | push `main` + PR | `npm ci` → cek migrasi ter-commit → typecheck → lint → test → build |
| `.github/workflows/migrate.yml` | manual + input `MIGRATE` | `db:migrate` ke Neon |
| `.github/workflows/backup.yml` | cron 18.00 UTC (01.00 WIB) | dump DB ke R2 |

Aturan CI:
- `npx drizzle-kit generate` dilanjutkan `git diff --exit-code drizzle/` — PR gagal jika skema berubah tanpa migrasi.
- **Build tidak boleh menyentuh database.** Halaman yang membaca gate wajib `dynamic`; nilai `NEXT_PUBLIC_*` diisi dummy saat CI.
- Migrasi **tidak** dijalankan otomatis saat merge; SQL hasil generate wajib dibaca lebih dulu.

### 17.4 Unit test

Runner **Vitest** + Testing Library, environment `node` (komponen memakai docblock `jsdom`). File test berdampingan dengan sumbernya: `lib/visits.ts` → `lib/visits.test.ts`.

| Diuji | Tidak diuji |
|---|---|
| Zod schema (slug, caption, host lagu, kode invite) | Server Component Next (E2E) |
| `hasMinRole`, validasi invite | Query repository & migrasi (Neon branch) |
| dedupe `room_view` 60 detik, `session_hash`, `logout` | Upload Cloudinary/R2 (manual M5) |
| URL builder Cloudinary, key R2, batas 500 MB | |
| `format-date` Asia/Jakarta | |
| `lib/audit.ts` — bentuk payload `before`/`after`, penolakan field rahasia | |
| komponen UI kecil dan `song-card` | |

- Threshold coverage: **80% baris & fungsi** untuk `lib/` dan `components/`; `app/` dikecualikan.
- Fungsi yang diuji harus menerima `now` sebagai parameter dan dipisah dari I/O.
- `lib/db` selalu di-mock; unit test tidak pernah membuka koneksi.

### 17.5 Deploy

Integrasi Git Vercel, tanpa pipeline deploy sendiri:

| Kejadian | Hasil |
|---|---|
| PR dibuka/diupdate | preview deployment |
| Merge ke `main` | production deployment |

### 17.6 Rahasia

GitHub Actions: `DATABASE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
Vercel: seluruh variabel §14, dipisah Production dan Preview. Secret tidak pernah masuk `NEXT_PUBLIC_*`.

### 17.7 Anggaran

Semua komponen CI/CD di atas gratis: Actions tanpa batas menit untuk repo publik, Vercel Hobby, Neon Free, R2 Free, Cloudinary Free, Firebase Spark.
