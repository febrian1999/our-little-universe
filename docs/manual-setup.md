# Setup Manual

Langkah yang **hanya bisa dikerjakan pemilik akun** lewat dashboard penyedia. Agent tidak bisa membuat akun, mengambil kredensial, atau mengubah setelan GitHub.

Rujukan: `docs/PRD.md` §14 dan §17, `docs/decisions.md` D-038, D-040, D-045, D-047.

Status terakhir diperiksa: 2026-10-29.

| Item | Nilai |
|---|---|
| `main` | `7dbd84d` |
| `development` | `5abb4e4` |
| `.github/` | belum ada |
| `.env.local` | belum ada |

---

## 0. Urutan pengerjaan

1. GitHub: hapus branch lama, atur metode merge
2. Neon: buat database + branch `preview`
3. GitHub: tambah secrets Actions
4. Workflow CI di-commit dan dijalankan sekali sampai job `verify` terdaftar
5. GitHub: aktifkan ruleset `main` dengan `verify` sebagai required check
6. Cloudinary, R2, Firebase, Vercel
7. `.env.local` lokal

Langkah 5 harus setelah langkah 4. GitHub menolak `required_status_checks` bila nama check `verify` belum pernah muncul, dan ruleset yang aktif lebih dulu akan mengunci PR pertama.

---

## 1. GitHub

### 1.1 Hapus branch lama

Sudah ter-merge, aman dihapus:

- [x] `docs/anti-penyalahgunaan`
- [x] `docs/framework-readonly`
- [x] `docs/chapter-playlist-map`
- [x] `docs/next16-conventions`

Lewat **Branches** → ikon tempat sampah, atau:

```bash
git push origin --delete docs/anti-penyalahgunaan
git push origin --delete docs/framework-readonly
git push origin --delete docs/chapter-playlist-map
git push origin --delete docs/next16-conventions
```

Setelah itu bersihkan referensi lokal: `git fetch --prune`.

### 1.2 Metode merge

**Settings → General → Pull Requests**

- [ ] Centang **Allow squash merging**, jadikan satu-satunya metode
- [ ] Matikan **Allow merge commits**
- [ ] Matikan **Allow rebase merging**
- [ ] Centang **Automatically delete head branches**
- [ ] Centang **Always suggest updating pull request branches**

### 1.3 Ruleset `main`

**Settings → Rules → Rulesets → New ruleset → New branch ruleset**

- [ ] Name: `main`
- [ ] Enforcement status: **Active**
- [ ] Bypass list: **kosong** (admin pun tunduk)
- [ ] Target branches → Add target → **Include by pattern** → `main`

Branch rules:

- [ ] **Restrict deletions**
- [ ] **Block force pushes**
- [ ] **Require a pull request before merging**
  - Required approvals: **0**
  - [ ] Require conversation resolution before merging
- [ ] **Require status checks to pass**
  - [ ] Add checks → `verify`
  - [ ] Require branches to be up to date before merging

`development` **tidak** dibuatkan ruleset (D-047). Branch itu boleh di-push bebas sebagai backup pekerjaan.

### 1.4 Batasi PR ke `main` hanya dari `development`

Tidak ada setelan native GitHub untuk ini, jadi dijaga secara proses (D-047). Bila nanti ingin ditegakkan otomatis, tambahkan job CI yang gagal ketika `base.ref == main` dan `head.ref != development`.

- [ ] Putuskan apakah perlu penegakan otomatis

### 1.5 Environment `production`

**Settings → Environments → New environment**

- [ ] Nama `production`
- [ ] Required reviewers: akun Anda
- [ ] Deployment branches: hanya `main`

Dipakai workflow `migrate.yml` dan `backup.yml` agar migrasi tidak jalan tanpa persetujuan.

### 1.6 Secrets Actions

**Settings → Secrets and variables → Actions → New repository secret**

- [ ] `DATABASE_URL` — Neon pooled, untuk CI
- [ ] `DATABASE_URL_UNPOOLED` — Neon direct, untuk migrasi
- [ ] `R2_ACCOUNT_ID`
- [ ] `R2_ACCESS_KEY_ID`
- [ ] `R2_SECRET_ACCESS_KEY`
- [ ] `R2_BUCKET`

`NEXT_PUBLIC_*` diisi dummy saat CI, jadi tidak perlu secret.

### 1.7 Verifikasi

- [ ] Push langsung ke `main` ditolak
- [ ] PR ke `main` menunggu check `verify`
- [ ] PR yang check-nya merah tidak bisa di-merge

---

## 2. Neon (Postgres)

- [ ] Daftar di neon.tech, region **Singapore**
- [ ] Buat project, simpan password
- [ ] Branch `main` untuk produksi
- [ ] Branch `preview` untuk PR dan Vercel Preview (D-038)
- [ ] Salin connection string **pooled** (host mengandung `-pooler`) → `DATABASE_URL`
- [ ] Salin connection string **direct** → `DATABASE_URL_UNPOOLED`

Pooler Neon memakai PgBouncer dan tidak andal untuk DDL. Semua migrasi, seed, dan backup memakai koneksi langsung.

---

## 3. Cloudinary (foto)

- [ ] Daftar akun gratis
- [ ] Catat **cloud name**
- [ ] Buat **API key + secret** (Settings → API Keys)
- [ ] Jangan membuat unsigned upload preset; semua upload harus signed dari server
- [ ] Opsional: buat folder `olu/` sebagai default

Variabel: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

---

## 4. Cloudflare R2 (video & backup)

- [ ] Aktifkan R2 pada akun Cloudflare
- [ ] Buat bucket `olu-media`, region **APAC**
- [ ] Buat **R2 API Token** dengan akses object read/write ke bucket itu
- [ ] Catat `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- [ ] Aktifkan **Public Development URL** → `R2_PUBLIC_BASE`
- [ ] Set **CORS policy** bucket: izinkan `GET` dan `HEAD` dari domain Vercel
- [ ] Catat kuota gratis 10 GB; video 500 MB tanpa kompresi akan cepat penuh

Tidak ada penghapusan file dari aplikasi. Pembersihan hanya manual dari dashboard.

---

## 5. Firebase (login owner)

- [ ] Buat project Firebase
- [ ] Authentication → Sign-in method → aktifkan **Email/Password** (dan Google bila perlu)
- [ ] Project settings → Your apps → Web app → salin config:
  - [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
  - [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] Service accounts → Generate new private key:
  - [ ] `FIREBASE_CLIENT_EMAIL`
  - [ ] `FIREBASE_PRIVATE_KEY` (escape `\n` menjadi `\\n` di env)
- [ ] Authentication → Settings → Authorized domains → tambahkan domain Vercel
- [ ] Pastikan `OWNER_EMAIL` sama dengan email owner pertama

---

## 6. Vercel

- [ ] Import repo `febrian1999/our-little-universe`
- [ ] **Production Branch = `main`** (Settings → Git)
- [ ] Preview deployment untuk semua branch lain
- [ ] Aktifkan **Vercel Authentication** untuk Preview; repo publik, preview tidak boleh terbuka
- [ ] Environment variables per-scope:
  - [ ] Production → Neon `main`, Cloudinary, R2, Firebase, `SESSION_SECRET` produksi
  - [ ] Preview → Neon `preview`, `SESSION_SECRET` berbeda
- [ ] `SESSION_SECRET` minimal 32 byte acak, contoh `openssl rand -base64 32`
- [ ] Pastikan tidak ada deployment produksi selain dari merge ke `main`
- [ ] Push ke `development` tetap memicu preview build; aktifkan **Ignored Build Step** bila kuota build menjadi masalah

---

## 7. Lokal

- [ ] Buat `.env.local` di root repo (sudah di-ignore)
- [ ] Isi variabel berikut (PRD §14):

```
DATABASE_URL=
DATABASE_URL_UNPOOLED=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
SESSION_SECRET=
OWNER_EMAIL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=olu-media
R2_PUBLIC_BASE=
TELEGRAM_BOT_TOKEN=
NEXT_PUBLIC_GA_ID=
```

- [ ] Pastikan `.env.local` tidak pernah ter-commit (`git status` bersih)

---

## 8. Opsional (M6–M7)

- [ ] Bot Telegram via `@BotFather` → `TELEGRAM_BOT_TOKEN` + chat ID owner
- [ ] GA4 property → `NEXT_PUBLIC_GA_ID`; situs noindex, hanya untuk statistik internal
- [ ] Aktifkan 2FA pada GitHub, Vercel, Cloudflare, Neon, Firebase (D-040)

---

## 9. Bukan tugas manual

Dikerjakan di repo:

- `.env.example`
- Pin versi dependency persis dan script `typecheck`, `test`, `test:run`, `test:coverage`, `db:*`
- `next.config.ts`: `poweredByHeader: false`, `images.remotePatterns`, `dangerouslyAllowSVG: false`
- `.github/workflows/ci.yml`, `migrate.yml`, `backup.yml`
- `.github/rulesets/main.json` sebagai dokumentasi konfigurasi
- `proxy.ts`, `app/robots.ts`, `lib/security/headers.ts`
- `app/globals.css` token tema, gate page M1
- Hapus lima SVG template di `public/`
