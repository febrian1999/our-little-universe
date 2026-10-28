# PRD — Our Little Universe

**Versi:** 2.0
**Status:** Draft untuk implementasi
**Pemilik:** Ian
**Asal:** project mangkrak `mybf.ian-gift` (Echa)
**Target biaya:** Rp 0
**Dokumen terkait:** `docs/schema.md`, `docs/agent-rules.md`

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
- Tanggal 17 September 2026 sebagai **catatan sejarah**, bukan gerbang otomatis.

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
- Upload foto (Cloudinary) dan video (Cloudflare R2).
- Undangan berbasis kode + batas pemakaian.
- History append-only yang tidak pernah dihapus.
- Dashboard admin: KPI, timeline, pengelolaan konten.
- PWA yang bisa diinstal di iPhone 13 dan Android.
- Notifikasi Telegram yang bisa dimatikan.

### 2.2 Di luar v1.0

- Komentar, chat, reaksi emoji.
- Multi-tenant (banyak pasangan dalam satu instalasi).
- Pembayaran.
- Email transaksional.
- Aplikasi mobile native.
- Kompresi video otomatis di browser.

---

## 3. Keputusan Teknis

Keputusan di bawah ini mengikat. Perubahan harus dicatat di `docs/decisions.md`.

| Layer | Keputusan | Alasan |
|---|---|---|
| Framework | Next.js 15 App Router | Routing, server actions, satu repo |
| Bahasa | TypeScript `strict` | Pedoman AI butuh tipe ketat |
| Styling | Tailwind CSS v4 | Konsisten, tanpa file CSS terpisah |
| Database | Neon Postgres (free) | SQL, 0,5 GB, tanpa kartu kredit |
| ORM | Drizzle ORM + drizzle-kit | SQL-first, migrasi versioned, tipe otomatis |
| Auth | Firebase Auth (Google + email link) | Pilihan Ian; terisolasi di `lib/auth/` |
| Foto | Cloudinary (signed upload) | Konversi HEIC ke WebP/AVIF otomatis |
| Video | Cloudflare R2 (presigned PUT) | Egress gratis, 10 GB storage gratis |
| Hosting | Vercel Hobby | Deploy dari GitHub, non-komersial |
| Notifikasi | Telegram Bot via route handler | Gratis, bekerja saat app tertutup |
| Analytics | GA4 + Cloudflare Web Analytics | Kombinasi gratis |
| PWA | Serwist | Offline shell, instalable |

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
| `guest` | Membaca ruangan dengan `min_role = guest`; upload terbatas (kuota 20 file/hari); tidak bisa menghapus |

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

```
/admin → pilih event → pilih room → "Tambah item"

foto     → POST /api/upload/sign            → upload langsung ke Cloudinary
           → simpan { type:'photo', provider:'cloudinary', public_id, width, height }
video    → POST /api/upload/r2/presign      → PUT langsung browser ke R2
           → simpan { type:'video', provider:'r2', url, thumb_url, duration_s }
lagu     → tempel URL Spotify/YouTube       → simpan { type:'song', provider:'spotify' }
teks     → tulis langsung                   → simpan { type:'text', caption }
```

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
/admin/history                     timeline kunjungan
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
| Video ≤ 10 GB total | Cloudflare R2 | presigned PUT browser → R2 | tanpa transformasi; poster dari Cloudinary |
| Video besar/panjang | YouTube unlisted | tempel URL | embed |

### 8.1 Aturan

- Upload **selalu** lewat endpoint server yang memverifikasi sesi + role. Tidak ada unsigned preset.
- Key R2 dibuat server: `events/{eventId}/{uuid}.{ext}` — mencegah path traversal.
- Poster video diambil dari Cloudinary (bukan R2) agar hemat bandwidth.
- R2 butuh CORS: `AllowedOrigins: [domain app]`, `AllowedMethods: [PUT, GET]`, `AllowedHeaders: [*]`.

### 8.2 Rencana pertumbuhan video

Saat ini < 10 GB (batas gratis R2). Jika melewati:
1. Kompres ke 720p H.265 (hemat 60–70%).
2. Pindahkan video panjang ke YouTube unlisted.
3. Cloudflare Stream (berbayar) hanya jika benar-benar perlu.

### 8.3 Setup akun (belum dimiliki)

1. **Cloudinary** — daftar free; catat `cloud_name`, `api_key`, `api_secret`; buat upload preset bertipe **signed**.
2. **Cloudflare R2** — aktifkan R2 (free 10 GB); buat bucket `olu-media`; buat API token S3; hubungkan custom domain.
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

**History tidak pernah dihapus.** Data yang dianggap berisik disembunyikan (`visits.visible = false`), bukan di-`DELETE`.

### 10.2 Aksi yang dicatat

`gate_open`, `gate_toggle`, `login`, `logout`, `room_view`, `connect`, `upload`, `invite_redeem`.

### 10.3 Noise reduction

- `logout` → `visible = false`.
- `room_view` duplikat dalam 60 detik untuk room yang sama oleh user yang sama → tidak dicatat.
- Deduplikasi dilakukan di `lib/visits.ts`, satu pintu.

### 10.4 Statistik

Dihitung on-the-fly dengan SQL, tanpa tabel counter:

```sql
select date_trunc('day', created_at) as day,
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

`scripts/backup.ts` dijalankan GitHub Action harian: dump `visits` + seluruh konten ke JSON/CSV, unggah ke R2. Retensi 90 hari.

---

## 11. Keamanan

| Risiko | Mitigasi |
|---|---|
| Guest membuka ruangan terlarang | Cek `min_role` di repository (server), bukan di komponen |
| Spam upload | Kuota per user per hari; cek role di route handler |
| Secret bocor | `*_SECRET`, `PRIVATE_KEY`, `BOT_TOKEN` hanya di env server (tanpa `NEXT_PUBLIC_`) |
| Path traversal R2 | Key dibuat server, bukan dari nama file client |
| Koneksi Postgres habis | Pooled `DATABASE_URL`, satu instance `db` |
| Backup hilang | Cron harian ke R2 |
| Session dicuri | Cookie `httpOnly`, `secure`, `sameSite=lax`, umur 5 hari |

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

---

## 13. Milestone

| M | Isi | Definisi selesai |
|---|---|---|
| M1 | Scaffold, Tailwind, layout B/C, ambient layer | Halaman kosong responsif di 360 & 1440; `npm run build` hijau |
| M2 | Drizzle schema + migrasi + seed + repository | `npm run db:migrate` jalan; seed menghasilkan 1 event + 4 room |
| M3 | Auth (`lib/auth/`) + middleware + login/invite | Guest bisa masuk via invite; owner bisa masuk |
| M4 | CRUD event/room/item + halaman user | Konten tampil di user dan bisa diedit di admin |
| M5 | Upload Cloudinary + R2 | Foto HEIC dari iPhone tampil di Chrome Android |
| M6 | Visits + dashboard history + statistik | Aksi tercatat; data tidak bisa dihapus dari UI |
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
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=                      # server only
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=                       # server only
R2_BUCKET=olu-media
R2_PUBLIC_BASE=https://media.example.dev
TELEGRAM_BOT_TOKEN=                         # server only
NEXT_PUBLIC_GA_ID=
```

---

## 15. Keputusan Terbuka

Perlu jawaban Ian sebelum atau selama implementasi:

1. Domain: tetap `*.vercel.app` (Rp 0) atau beli domain (~Rp 150 ribu/tahun)?
2. Apakah ruangan "Healing" (surat pribadi) memakai `min_role = editor`?
3. Perlu kompresi video otomatis di browser (tetap Rp 0, tambah ± 1 hari kerja)?
4. Guest boleh upload, atau upload hanya untuk owner/editor?
5. Nama event pertama: tetap "Our Little Universe" atau nama lain?
6. Apakah tanggal 17 September 2026 perlu ditampilkan sebagai bagian cerita di landing?

---

## 16. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Neon autosuspend 5 menit | Request pertama terasa lambat | Terima (± 500 ms), atau ping cron harian |
| Kuota Firebase Auth | — | Gratis tanpa batas praktis untuk 2–20 user |
| Vercel Hobby non-komersial | Situs bisa dinonaktifkan jika dipakai komersial | Pindah ke Cloudflare Pages bila perlu |
| R2 10 GB penuh | Video gagal upload | Kompresi / YouTube / tier berbayar |
| AI menulis di luar pola | Kode berantakan | `docs/agent-rules.md` |
