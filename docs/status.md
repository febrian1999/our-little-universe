# Status Proyek — Our Little Universe

Snapshot kondisi repo. **Perbarui file ini setiap milestone selesai**, sebelum push.
Jangan tulis rencana di sini — rencana ada di `docs/PRD.md` §13.

Terakhir diperbarui: **2026-10-31**, commit `38fc9fd` (`development`).

---

## 1. Cabang

| Cabang | Peran | Aturan |
|---|---|---|
| `development` | kerja harian | boleh commit langsung, tanpa ruleset & tanpa CI |
| `main` | produksi + CI/CD | **PR saja**, required check `verify`. Jangan push langsung |

Milestone dikerjakan di `feat/mN-<nama>`, lalu `git merge --squash` ke `development`, push, hapus cabang.
Satu milestone jalan setelah pemilik memberi izin.

---

## 2. Milestone

| # | Isi | Status | Commit |
|---|---|---|---|
| M1 | scaffold, header keamanan, konfigurasi | selesai | — |
| M2 | skema, migrasi, seed, repository | selesai | — |
| M3 | auth sesi, login, invite, `proxy.ts` | selesai | — |
| M4 | admin CRUD chapter/room/item/playlist + audit | selesai | `14caf2b` |
| M5 | upload foto Cloudinary (tiket tanda tangan) | selesai | ikut `14caf2b` |
| M6 | dashboard, statistik 14 hari, history kunjungan/perubahan | selesai | `976a6aa` |
| M7 | toggle gerbang (owner) + pencatatan `gate_open` | selesai | `5d5bc02` |
| M8 | PWA installable, CSP mengikat, skip link | selesai | `38fc9fd` |
| — | `/admin/media` (galeri media read-only) | **belum** | — |
| — | `/admin/access` (undangan + role) | **belum** | — |
| — | deploy Vercel + PR `development` → `main` | **belum** | — |

---

## 3. Yang sudah dibuktikan (jangan diragukan lagi)

Diuji pada `next start` lokal dengan permintaan HTTP sungguhan, bukan hanya baca kode.

| Area | Bukti |
|---|---|
| Upload foto | tiket `/api/upload/sign` → 204 tanpa sesi, 403 guest, 200 editor; upload Cloudinary nyata 200 `image/png` |
| Server action | dipanggil dengan body multipart berisi `$ACTION_ID_<id>` (lihat §6), hasil 303 + baris DB |
| Gerbang | `gate_toggle` + `audit_logs` `true→false`/`false→true`; landing berubah tanpa redeploy |
| `gate_open` | 2 baris, path `/login`; `next=https://evil.com` ditolak `safeNextPath` → `/login` |
| History | `/admin/history` menampilkan `gate_toggle` dan `gate_open` |
| CSP | header penuh terkirim di `/login` dan `/admin` |
| PWA | `/sw.js`, `/manifest.webmanifest`, `/icons/icon-192.png`, `/icons/icon-512.png`, `/apple-icon.png` → 200; `rel="manifest"` + `apple-touch-icon` ada di HTML |
| Mutu | `typecheck` hijau, `lint` 0 warning, `test:run` **73 lulus / 16 file**, `next build` exit **0** |

---

## 4. Yang belum terbukti (jangan ditulis "sudah beres")

| Hal | Kenapa |
|---|---|
| Lighthouse ≥ 90 | tidak ada Chrome di mesin pengembangan |
| "CSP tanpa pelanggaran" | hanya header yang diperiksa; console browser belum dilihat |
| Login Google setelah CSP aktif | belum diuji ulang; `connect-src`/`frame-src` sudah memuat domain Firebase |
| Install PWA di iPhone 13 / Android | butuh perangkat |
| Editor tidak bisa toggle/role | DB baru punya satu user `owner`; butuh undangan dipakai dulu |
| `api/upload/r2/presign`, `scripts/backup.ts` | kredensial R2 belum ada, jadi belum dibuat |
| Deploy Vercel | pernah gagal `invalid-api-key`; env produksi + redeploy belum dicoba |
| `gh` CLI | tidak terpasang; PR dibuka manual lewat web GitHub |

---

## 5. Penyimpangan sadar dari PRD

| Hal | Kondisi nyata | Rujukan |
|---|---|---|
| Notifikasi Telegram | tidak dibuat atas permintaan pemilik | D-055 |
| CSP | tanpa nonce (tidak kompatibel PPR/Cache Components) | D-056 |
| PWA | service worker tanpa cache offline | D-057 |
| Hapus chapter/room/item/playlist | **owner saja**, padahal PRD §4 baris 166 menyebut owner **dan** editor | belum diputuskan |
| Cloudflare R2 | ditunda; video hanya lewat URL YouTube | D-046 |

---

## 6. Jebakan yang sudah memakan waktu (baca sebelum debug)

1. **Server action butuh `$ACTION_ID_`.** Kirim `Next-Action: <id>` saja → `500` `Connection closed` (digest `3329550248`). Pakai body `FormData` dengan field `$ACTION_ID_<id>` + field form lain, header `Origin` harus cocok, lalu `redirect: "manual"`.
2. **ID action dicari di build, bukan kode.** `.next/server/app/**/server-reference-manifest.json`, cari `exportedName`, ambil key-nya.
3. **`next build`/`next start` harus lewat** `node node_modules/next/dist/bin/next …`.
4. **Halaman yang pakai `new Date()`/sesi di luar `<Suspense>`** butuh `await connection()` atau `export const instant = false`; `/admin/**` sudah di level layout.
5. **`notFound()` di dalam `<Suspense>`** menghasilkan HTTP 200 dengan UI 404.
6. **PowerShell 5.1**: pakai `curl.exe`, hindari `node -e` dengan kutip bersarang, dan edit dokumen lewat tool edit agar UTF-8 tidak rusak.

---

## 7. Perintah pemeriksaan

```powershell
npm run typecheck
npm run lint
npm run test:run
node node_modules/next/dist/bin/next build
node node_modules/next/dist/bin/next start -p 3120   # lalu curl ke 127.0.0.1:3120
```

Keempat perintah pertama harus hijau sebelum push.
