# Our Little Universe

Ruang memori privat untuk pemilik dan tamu undangan. Next.js 16 App Router, Neon Postgres, Cloudinary, Cloudflare R2, Firebase Auth. Target biaya Rp 0.

Status: **M1 selesai** — scaffold, token tema, landing gate, header keamanan, robots noindex, Vitest, dan CI. Belum ada database, auth, atau konten.

## Dokumentasi

| File | Isi |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Spesifikasi produk, route, UI, milestone, CI/CD |
| [`docs/schema.md`](docs/schema.md) | Skema database, DDL/Drizzle, seed, aturan migrasi |
| [`docs/agent-rules.md`](docs/agent-rules.md) | Kontrak kerja untuk agent dan manusia |
| [`docs/decisions.md`](docs/decisions.md) | Keputusan arsitektur D-001 – D-047 |
| [`docs/manual-setup.md`](docs/manual-setup.md) | Langkah setup yang hanya bisa dilakukan pemilik akun |

Baca `docs/agent-rules.md` sebelum menulis kode. API Next.js mengikuti dokumentasi versi terpasang di `node_modules/next/dist/docs/`, bukan materi dari ingatan.

## Mulai

```bash
npm ci
cp .env.example .env.local   # isi sesuai docs/manual-setup.md §7
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Branch

```
main         ← produksi / CI-CD; hanya PR rilis dari development
development  ← branch kerja harian; tanpa ruleset, tanpa CI
```

Jangan push langsung ke `main`. Rincian di `docs/PRD.md` §17 dan D-047.
