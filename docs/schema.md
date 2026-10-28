# Skema Database — Our Little Universe

**Database:** Neon Postgres (free tier: 0,5 GB, autosuspend 5 menit)
**ORM:** Drizzle ORM + drizzle-kit
**Sumber kebenaran:** `lib/db/schema.ts` — dokumen ini adalah ringkasan dan penjelasan.

Aturan utama: **tidak ada perubahan skema tanpa migrasi Drizzle.** `ALTER TABLE` manual di Neon console dilarang.

---

## 1. Prinsip Desain

1. **Relasional, bukan dokumen.** Semua data terstruktur punya tabel sendiri.
2. **Media tidak pernah disimpan sebagai array.** Satu media = satu baris `items`.
3. **Agregat dihitung dengan SQL**, bukan tabel counter. Tidak ada data denormalisasi yang bisa basi.
4. **History append-only.** Tidak pernah `DELETE`, tidak pernah `UPDATE` isi.
5. **Enum di database**, bukan string bebas.
6. **Semua waktu `timestamptz`**, default `now()`.
7. **Cascade pada konten**, tapi tidak pada history.
8. **`settings` hanya untuk data global** (gate, notifikasi, guardian) — bukan tempat menyimpan relasi.

---

## 2. ERD

```
users ──1:N──▶ invites        (created_by)
users ──1:N──▶ events         (created_by)
events ──1:N──▶ rooms          (on delete cascade)
rooms  ──1:N──▶ items          (on delete cascade)
users  ──1:N──▶ visits         (nullable: guest terhapus, history tetap)
events ──1:N──▶ visits         (nullable)
rooms  ──1:N──▶ visits         (nullable)
settings                        (key-value, tanpa relasi)
```

Catatan: `visits.user_id` memakai `on delete set null`, **bukan** cascade — agar riwayat tetap ada walau user dihapus.

---

## 3. DDL

```sql
-- ============ ENUM ============
create type user_role      as enum ('owner','editor','guest');
create type item_type      as enum ('photo','video','letter','song','text');
create type media_provider as enum ('cloudinary','r2','youtube','spotify','none');
create type visit_action   as enum (
  'gate_open','room_view','login','logout','connect','upload','invite_redeem','gate_toggle'
);

-- ============ USERS ============
create table users (
  id            uuid primary key default gen_random_uuid(),
  firebase_uid  text unique,
  email         text not null unique,
  display_name  text not null,
  photo_url     text,
  role          user_role not null default 'guest',
  is_allowed    boolean not null default false,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

-- ============ INVITES ============
create table invites (
  code        text primary key,
  role        user_role not null default 'guest',
  active      boolean not null default true,
  expires_at  timestamptz,
  max_uses    integer not null default 1,
  uses        integer not null default 0,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ============ EVENTS ============
create table events (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          text not null,
  subtitle       text,
  theme          jsonb not null default '{"primary":"#EC4899","accent":"#2563EB"}',
  hero_public_id text,
  starts_at      timestamptz,
  gate_open      boolean not null default false,
  visibility     text not null default 'members',
  sort_order     integer not null default 0,
  created_by     uuid references users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============ ROOMS ============
create table rooms (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  key             text not null,
  title           text not null,
  icon            text not null default '✨',
  description     text,
  cover_public_id text,
  sort_order      integer not null default 0,
  locked          boolean not null default false,
  min_role        user_role not null default 'guest',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (event_id, key)
);

-- ============ ITEMS ============
create table items (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references rooms(id) on delete cascade,
  type        item_type not null,
  provider    media_provider not null default 'none',
  public_id   text,
  url         text,
  thumb_url   text,
  width       integer,
  height      integer,
  duration_s  integer,
  caption     text,
  taken_at    timestamptz,
  sort_order  integer not null default 0,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============ VISITS (APPEND ONLY) ============
-- Tidak pernah DELETE. Tidak pernah UPDATE isi.
-- Satu-satunya UPDATE yang diizinkan: kolom `visible`.
create table visits (
  id           bigserial primary key,
  user_id      uuid references users(id) on delete set null,
  session_hash text,
  event_id     uuid references events(id) on delete set null,
  room_id      uuid references rooms(id) on delete set null,
  action       visit_action not null,
  path         text,
  user_agent   text,
  visible      boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ============ SETTINGS ============
create table settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ============ INDEX ============
create index visits_created_idx    on visits (created_at desc);
create index visits_action_idx     on visits (action, created_at desc);
create index visits_user_idx       on visits (user_id, created_at desc);
create index visits_visible_idx    on visits (visible, created_at desc);
create index items_room_order_idx  on items (room_id, sort_order);
create index rooms_event_order_idx on rooms (event_id, sort_order);
create index events_slug_idx       on events (slug);
```

---

## 4. Drizzle Schema (`lib/db/schema.ts`)

```ts
import {
  pgTable, pgEnum, uuid, text, timestamp, boolean,
  integer, bigserial, jsonb, index,
} from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['owner', 'editor', 'guest']);
export const itemType = pgEnum('item_type', ['photo', 'video', 'letter', 'song', 'text']);
export const mediaProvider = pgEnum('media_provider', ['cloudinary', 'r2', 'youtube', 'spotify', 'none']);
export const visitAction = pgEnum('visit_action', [
  'gate_open', 'room_view', 'login', 'logout',
  'connect', 'upload', 'invite_redeem', 'gate_toggle',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: text('firebase_uid').unique(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  photoUrl: text('photo_url'),
  role: userRole('role').notNull().default('guest'),
  isAllowed: boolean('is_allowed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

export const invites = pgTable('invites', {
  code: text('code').primaryKey(),
  role: userRole('role').notNull().default('guest'),
  active: boolean('active').notNull().default(true),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  maxUses: integer('max_uses').notNull().default(1),
  uses: integer('uses').notNull().default(0),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    theme: jsonb('theme')
      .$type<{ primary: string; accent: string }>()
      .notNull()
      .default({ primary: '#EC4899', accent: '#2563EB' }),
    heroPublicId: text('hero_public_id'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    gateOpen: boolean('gate_open').notNull().default(false),
    visibility: text('visibility').notNull().default('members'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('events_slug_idx').on(t.slug)],
);

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    title: text('title').notNull(),
    icon: text('icon').notNull().default('✨'),
    description: text('description'),
    coverPublicId: text('cover_public_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    locked: boolean('locked').notNull().default(false),
    minRole: userRole('min_role').notNull().default('guest'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('rooms_event_order_idx').on(t.eventId, t.sortOrder)],
);

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    type: itemType('type').notNull(),
    provider: mediaProvider('provider').notNull().default('none'),
    publicId: text('public_id'),
    url: text('url'),
    thumbUrl: text('thumb_url'),
    width: integer('width'),
    height: integer('height'),
    durationS: integer('duration_s'),
    caption: text('caption'),
    takenAt: timestamp('taken_at', { withTimezone: true }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('items_room_order_idx').on(t.roomId, t.sortOrder)],
);

export const visits = pgTable(
  'visits',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    sessionHash: text('session_hash'),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
    roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
    action: visitAction('action').notNull(),
    path: text('path'),
    userAgent: text('user_agent'),
    visible: boolean('visible').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('visits_created_idx').on(t.createdAt),
    index('visits_action_idx').on(t.action, t.createdAt),
    index('visits_user_idx').on(t.userId, t.createdAt),
  ],
);

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## 5. Kamus Data

### `users`

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | uuid | ✔ | PK, dibuat DB |
| `firebase_uid` | text | — | Unik, diisi saat login pertama |
| `email` | text | ✔ | Unik |
| `display_name` | text | ✔ | Nama tampilan |
| `role` | user_role | ✔ | Default `guest` |
| `is_allowed` | boolean | ✔ | `false` = ditolak walau login berhasil |
| `last_login_at` | timestamptz | — | Diperbarui setiap login |

### `events`

| Kolom | Keterangan |
|---|---|
| `slug` | Unik, lowercase + tanda hubung, dipakai di URL |
| `theme` | `{ primary, accent }` — warna hex |
| `gate_open` | Menentukan landing membuka gate atau tidak |
| `visibility` | `private` (hanya owner/editor) atau `members` (semua login) |

### `rooms`

| Kolom | Keterangan |
|---|---|
| `key` | `home` / `touring` / `healing` / `music`; unik per event |
| `locked` | Terkunci manual, tidak bergantung pada role |
| `min_role` | Role minimum untuk membuka |

### `items`

| Kolom | Keterangan |
|---|---|
| `provider` | `cloudinary` (foto), `r2` (video), `youtube`/`spotify` (embed), `none` (teks) |
| `public_id` | ID Cloudinary, dipakai untuk membentuk URL transformasi |
| `url` | URL final untuk R2 / embed / teks |
| `taken_at` | Tanggal foto/video diambil (opsional, untuk sorting kronologis) |
| `sort_order` | Urutan manual di dalam room |

### `visits`

| Kolom | Keterangan |
|---|---|
| `session_hash` | `sha256(uid + ':' + YYYY-MM-DD)` — hitung unik tanpa menyimpan IP |
| `visible` | `false` = disembunyikan dari UI, **tetap ada di DB** |
| `action` | Enum, lihat §3 |

### `settings`

| Key | Bentuk value |
|---|---|
| `guardian` | `{ name, birthday, lastSeen }` |
| `notifications` | `{ enabled, channel: 'telegram', chatIds: [] }` |
| `features` | `{ guestUpload: boolean, uploadQuotaPerDay: number }` |

---

## 6. Query yang Harus Dilayani

Setiap query di bawah wajib punya index yang mendukung.

| # | Kebutuhan | Query |
|---|---|---|
| 1 | Event by slug | `select * from events where slug = $1` |
| 2 | Room satu event, berurutan | `select * from rooms where event_id = $1 order by sort_order` |
| 3 | Item satu room, paginasi 24 | `select * from items where room_id = $1 order by sort_order limit 24 offset $2` |
| 4 | Status guardian | `select value from settings where key = 'guardian'` |
| 5 | Gate satu event | `select gate_open from events where slug = $1` |
| 6 | 50 visit terakhir | `select * from visits where visible order by created_at desc limit 50` |
| 7 | Statistik 30 hari | agregasi harian (lihat §7) |
| 8 | User by firebase_uid | `select * from users where firebase_uid = $1` |
| 9 | Validasi invite | `select * from invites where code = $1 and active and (expires_at is null or expires_at > now()) and uses < max_uses` |

---

## 7. Query Referensi

```sql
-- Statistik 30 hari
select date_trunc('day', created_at) as day,
       count(*) filter (where action = 'room_view') as views,
       count(distinct session_hash) as uniques
from visits
where created_at > now() - interval '30 days' and visible
group by 1
order by 1 desc;

-- Aktivitas per ruangan
select r.key, count(*) as visits
from visits v
join rooms r on r.id = v.room_id
where v.action = 'room_view' and v.visible
  and v.created_at > now() - interval '30 days'
group by r.key
order by visits desc;

-- Timeline dengan nama user
select v.created_at, v.action, v.path, u.display_name, u.role
from visits v
left join users u on u.id = v.user_id
where v.visible
order by v.created_at desc
limit 50;

-- Redeem invite (transaksional)
begin;
update invites
   set uses = uses + 1
 where code = $1 and active
   and (expires_at is null or expires_at > now())
   and uses < max_uses
returning role;
-- jika rowCount = 0 → rollback
commit;
```

---

## 8. Aturan Penulisan Data

| Aturan | Detail |
|---|---|
| Riwayat append-only | `INSERT` boleh; `DELETE` dilarang; `UPDATE` hanya untuk `visible` |
| Sembunyikan, jangan hapus | Set `visible = false` untuk aksi berisik |
| Media tidak di array | Satu baris `items` per media |
| `updated_at` | Diperbarui di repository, bukan trigger (lebih mudah dilacak) |
| Slug | Regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`, unik |
| Caption | Maks 500 karakter; validasi dengan Zod |
| Upload kuota | Dihitung dari `visits` `action='upload'` hari ini |

---

## 9. Migrasi

```bash
# 1. ubah lib/db/schema.ts
# 2. generate SQL
npx drizzle-kit generate

# 3. review file di drizzle/  ← wajib dibaca manusia/AI, bukan dibiarkan
# 4. jalankan
npx drizzle-kit migrate

# 5. perbarui docs/schema.md
```

Aturan:
- **Jangan pernah** mengedit file di `drizzle/` secara manual.
- Migrasi yang sudah jalan **tidak boleh** diubah isinya; buat migrasi baru.
- Setiap migrasi harus bisa jalan dari database kosong (uji dengan `drizzle-kit migrate` di Neon branch baru).
- Perubahan yang merusak (drop kolom) harus dua tahap: (1) berhenti memakai, (2) drop setelah rilis berikutnya.

---

## 10. Seed

`scripts/seed.ts` membuat:

```
1 event   : our-little-universe
4 rooms   : home, touring, healing, music
8 items   : 2 per room (1 teks + 1 foto placeholder)
2 users   : owner (ian@example.com), guest (demo@example.com)
1 invite  : DEMO2026 (role guest, maxUses 5)
settings  : guardian, notifications, features
```

Seed harus **idempoten**: jalankan berulang tidak menggandakan data (gunakan `on conflict do nothing`).

---

## 11. Backup & Retensi

| Data | Retensi | Metode |
|---|---|---|
| `visits` | **selamanya** | Tidak dihapus; di-dump harian ke R2 |
| `items`, `rooms`, `events` | aktif | Dump harian ke R2 |
| Dump di R2 | 90 hari | Lifecycle rule di bucket |
| User | aktif | Dump harian |

`scripts/backup.ts` dijalankan GitHub Action (cron harian). Format: JSON per tabel + satu CSV untuk `visits`.

---

## 12. Pertumbuhan Jangka Panjang

| Ambang | Tindakan |
|---|---|
| `visits` > 500 ribu baris | Partisi per bulan (`partition by range (created_at)`) |
| `visits` > 5 juta baris | Arsipkan bulan yang lebih lama ke R2 (Parquet), sisakan ringkasan harian |
| `items` > 20 ribu | Tambah paginasi server-side + `limit` wajib di semua query |
| Storage 0,5 GB mendekati batas | Pindahkan kolom teks panjang (`caption`, `description`) ke R2 bila perlu |

Semua tindakan di atas **belum perlu dilakukan sekarang** dan tidak boleh dikerjakan lebih awal.
