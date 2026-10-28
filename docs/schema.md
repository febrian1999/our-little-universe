# Skema Database — Our Little Universe

**Database:** Neon Postgres (free tier: 0,5 GB, autosuspend 5 menit)
**ORM:** Drizzle ORM + drizzle-kit
**Sumber kebenaran:** `lib/db/schema.ts` — dokumen ini adalah ringkasan dan penjelasan.
**Update terakhir:** 2026-10-28

Aturan utama: **tidak ada perubahan skema tanpa migrasi Drizzle.** `ALTER TABLE` manual di Neon console dilarang. **Tidak ada `DELETE`** — semua penghapusan adalah soft delete.

---

## 1. Prinsip Desain

1. **Relasional, bukan dokumen.** Semua data terstruktur punya tabel sendiri.
2. **Media tidak pernah disimpan sebagai array.** Satu media = satu baris `items`.
3. **Agregat dihitung dengan SQL**, bukan tabel counter. Tidak ada data denormalisasi yang bisa basi.
4. **History append-only.** Tidak pernah `DELETE`, tidak pernah `UPDATE` isi.
5. **Soft delete, bukan cascade.** Tidak ada hard delete di aplikasi; baris diberi `deleted_at`.
6. **Enum di database**, bukan string bebas.
7. **Semua waktu `timestamptz`**, default `now()`.
8. **Kolom audit wajib** di setiap tabel: `created_at`, `updated_at`, `updated_by`, ditambah `deleted_at`, `deleted_by` pada tabel yang bisa dihapus. Pengecualian append-only: `audit_logs` hanya punya `created_at`.
9. **`settings` hanya untuk data global** (gate, notifikasi, guardian) — bukan tempat menyimpan relasi.
10. **Setiap mutasi data dicatat** ke `audit_logs` (append-only), terpisah dari `visits` yang mencatat kunjungan.

---

## 2. ERD

```
users ──1:N──▶ invites        (created_by)
users ──1:N──▶ events         (created_by)
events ──1:N──▶ rooms          (soft delete, bukan cascade)
rooms  ──1:N──▶ items          (soft delete, bukan cascade)
users  ──1:N──▶ visits         (nullable: guest terhapus, history tetap)
events ──1:N──▶ visits         (nullable)
rooms  ──1:N──▶ visits         (nullable)
users  ──1:N──▶ audit_logs     (actor, nullable)
events ──1:N──▶ audit_logs     (nullable)
settings                        (key-value, tanpa relasi)
```

Catatan: FK memakai `on delete set null` sebagai jaring pengaman level database. Aplikasi tidak pernah menjalankannya karena tidak ada hard delete.

---

## 3. DDL

```sql
-- ============ ENUM ============
create type user_role      as enum ('owner','editor','guest');
create type item_type      as enum ('photo','video','song','text');
create type media_provider as enum ('cloudinary','r2','youtube','spotify','none');
create type visit_action   as enum (
  'gate_open','room_view','login','logout','connect','upload','invite_redeem','gate_toggle'
);
create type audit_action   as enum ('create','update','soft_delete','restore');
create type audit_entity   as enum ('event','room','item','invite','user','setting');

-- ============ USERS ============
create table users (
  id            uuid primary key default gen_random_uuid(),
  firebase_uid  text,
  email         text not null,
  display_name  text not null,
  photo_url     text,
  role          user_role not null default 'guest',
  is_allowed    boolean not null default false,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references users(id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references users(id) on delete set null
);

-- ============ INVITES ============
create table invites (
  id          uuid primary key default gen_random_uuid(),
  code        text not null,
  role        user_role not null default 'guest',
  active      boolean not null default true,
  expires_at  timestamptz,
  max_uses    integer not null default 1,
  uses        integer not null default 0,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id) on delete set null,
  deleted_at  timestamptz,
  deleted_by  uuid references users(id) on delete set null
);

-- ============ EVENTS ============
create table events (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null,
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
  updated_at     timestamptz not null default now(),
  updated_by     uuid references users(id) on delete set null,
  deleted_at     timestamptz,
  deleted_by     uuid references users(id) on delete set null
);

-- ============ ROOMS ============
create table rooms (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id),
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
  updated_by      uuid references users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid references users(id) on delete set null
);

-- ============ ITEMS ============
create table items (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references rooms(id),
  type          item_type not null,
  provider      media_provider not null default 'none',
  public_id     text,
  url           text,
  thumb_url     text,
  width         integer,
  height        integer,
  duration_s    integer,
  song_provider media_provider not null default 'none',
  song_url      text,
  song_title    text,
  song_start_s  integer,
  caption       text,
  taken_at      timestamptz,
  sort_order    integer not null default 0,
  created_by    uuid references users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references users(id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references users(id) on delete set null
);

-- ============ VISITS (APPEND ONLY) ============
-- Tidak pernah DELETE. Tidak pernah UPDATE isi.
-- Satu-satunya UPDATE yang diizinkan: kolom `visible`.
-- Tidak punya deleted_at / deleted_by: history tidak bisa dihapus.
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
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references users(id) on delete set null
);

-- ============ SETTINGS ============
-- Key-value global. Baris tidak pernah dihapus, jadi tanpa kolom deleted_*.
create table settings (
  key        text primary key,
  value      jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references users(id) on delete set null
);

-- ============ AUDIT LOGS (APPEND ONLY) ============
-- Mencatat setiap perubahan data. Tidak pernah UPDATE, tidak pernah DELETE.
-- Tanpa deleted_at/deleted_by: log tidak bisa dihapus dari aplikasi.
create table audit_logs (
  id         bigserial primary key,
  actor_id   uuid references users(id) on delete set null,
  action     audit_action not null,
  entity     audit_entity not null,
  entity_id  text not null,              -- uuid entitas, atau key untuk settings
  event_id   uuid references events(id) on delete set null,
  before     jsonb,
  after      jsonb,
  created_at timestamptz not null default now()
);

-- ============ INDEX ============
create index visits_created_idx    on visits (created_at desc);
create index visits_action_idx     on visits (action, created_at desc);
create index visits_user_idx       on visits (user_id, created_at desc);
create index visits_visible_idx    on visits (visible, created_at desc);
create index items_room_order_idx  on items (room_id, sort_order);
create index rooms_event_order_idx on rooms (event_id, sort_order);
create index audit_logs_created_idx on audit_logs (created_at desc);
create index audit_logs_entity_idx  on audit_logs (entity, entity_id, created_at desc);
create index audit_logs_actor_idx   on audit_logs (actor_id, created_at desc);

-- Unique hanya untuk baris aktif (soft delete membuat nilai bisa dipakai ulang)
create unique index users_email_active_idx on users (email)
  where deleted_at is null;
create unique index users_firebase_uid_active_idx on users (firebase_uid)
  where deleted_at is null;
create unique index invites_code_active_idx on invites (code)
  where deleted_at is null;
create unique index events_slug_active_idx on events (slug)
  where deleted_at is null;
create unique index rooms_event_key_active_idx on rooms (event_id, key)
  where deleted_at is null;
```

### 3.1 Catatan enum

- `item_type` **tidak punya** `letter`. Semua tulisan memakai `text`.
- `song` adalah item berdiri sendiri untuk room Music: lagu ada di `provider` + `url`.
- Item bertipe lain boleh punya **satu lagu tempelan** di `song_provider`, `song_url`, `song_title`, `song_start_s`.
- `audit_logs` append-only, jadi **tidak** punya `updated_at`, `updated_by`, `deleted_at`, `deleted_by`. Ini pengecualian eksplisit dari aturan kolom audit (D-034).

---

## 4. Drizzle Schema (`lib/db/schema.ts`)

```ts
import { sql } from 'drizzle-orm';
import {
  pgTable, pgEnum, uuid, text, timestamp, boolean,
  integer, bigserial, jsonb, index, uniqueIndex,
} from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['owner', 'editor', 'guest']);
export const itemType = pgEnum('item_type', ['photo', 'video', 'song', 'text']);
export const mediaProvider = pgEnum('media_provider', [
  'cloudinary', 'r2', 'youtube', 'spotify', 'none',
]);
export const visitAction = pgEnum('visit_action', [
  'gate_open', 'room_view', 'login', 'logout',
  'connect', 'upload', 'invite_redeem', 'gate_toggle',
]);
export const auditAction = pgEnum('audit_action', [
  'create', 'update', 'soft_delete', 'restore',
]);
export const auditEntity = pgEnum('audit_entity', [
  'event', 'room', 'item', 'invite', 'user', 'setting',
]);

// --- helper kolom audit -------------------------------------------------
const stamped = () => ({
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
});

const auditable = () => ({
  ...stamped(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
});
// ------------------------------------------------------------------------

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: text('firebase_uid'),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  photoUrl: text('photo_url'),
  role: userRole('role').notNull().default('guest'),
  isAllowed: boolean('is_allowed').notNull().default(false),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...auditable(),
});

export const invites = pgTable(
  'invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    role: userRole('role').notNull().default('guest'),
    active: boolean('active').notNull().default(true),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    maxUses: integer('max_uses').notNull().default(1),
    uses: integer('uses').notNull().default(0),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...auditable(),
  },
  (t) => [
    uniqueIndex('invites_code_active_idx').on(t.code).where(sql`deleted_at is null`),
  ],
);

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
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
    ...auditable(),
  },
  (t) => [
    uniqueIndex('events_slug_active_idx').on(t.slug).where(sql`deleted_at is null`),
  ],
);

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id),
    key: text('key').notNull(),
    title: text('title').notNull(),
    icon: text('icon').notNull().default('✨'),
    description: text('description'),
    coverPublicId: text('cover_public_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    locked: boolean('locked').notNull().default(false),
    minRole: userRole('min_role').notNull().default('guest'),
    ...auditable(),
  },
  (t) => [
    index('rooms_event_order_idx').on(t.eventId, t.sortOrder),
    uniqueIndex('rooms_event_key_active_idx')
      .on(t.eventId, t.key)
      .where(sql`deleted_at is null`),
  ],
);

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id),
    type: itemType('type').notNull(),
    provider: mediaProvider('provider').notNull().default('none'),
    publicId: text('public_id'),
    url: text('url'),
    thumbUrl: text('thumb_url'),
    width: integer('width'),
    height: integer('height'),
    durationS: integer('duration_s'),
    songProvider: mediaProvider('song_provider').notNull().default('none'),
    songUrl: text('song_url'),
    songTitle: text('song_title'),
    songStartS: integer('song_start_s'),
    caption: text('caption'),
    takenAt: timestamp('taken_at', { withTimezone: true }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...auditable(),
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
    ...stamped(),
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
  ...stamped(),
});

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: auditAction('action').notNull(),
    entity: auditEntity('entity').notNull(),
    entityId: text('entity_id').notNull(),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
    before: jsonb('before'),
    after: jsonb('after'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_logs_created_idx').on(t.createdAt),
    index('audit_logs_entity_idx').on(t.entity, t.entityId, t.createdAt),
    index('audit_logs_actor_idx').on(t.actorId, t.createdAt),
  ],
);
```

`users` merujuk dirinya sendiri lewat `updated_by`/`deleted_by`; callback `references` bersifat lazy sehingga aman.

---

## 5. Kamus Data

### Konvensi kolom audit

| Kolom | Tipe | Keterangan |
|---|---|---|
| `created_at` | timestamptz | Default `now()`, tidak pernah diubah |
| `updated_at` | timestamptz | Diperbarui repository setiap `UPDATE` |
| `updated_by` | uuid | User yang terakhir mengubah; `null` untuk proses sistem/seed |
| `deleted_at` | timestamptz | `null` = aktif; terisi = soft delete |
| `deleted_by` | uuid | User yang menghapus |

### `users`

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | uuid | ✔ | PK, dibuat DB |
| `firebase_uid` | text | — | Unik di antara baris aktif, diisi saat login pertama |
| `email` | text | ✔ | Unik di antara baris aktif |
| `display_name` | text | ✔ | Nama tampilan |
| `role` | user_role | ✔ | Default `guest` |
| `is_allowed` | boolean | ✔ | `false` = ditolak walau login berhasil |
| `last_login_at` | timestamptz | — | Diperbarui setiap login |

### `invites`

| Kolom | Keterangan |
|---|---|
| `id` | PK uuid; `code` bukan PK agar kode bisa dipakai ulang setelah dihapus |
| `code` | 8 karakter base32 tanpa `0/O`, `1/I`; unik di antara baris aktif |
| `uses`, `max_uses` | Pembatas pemakaian |

### `events`

| Kolom | Keterangan |
|---|---|
| `slug` | Unik di antara baris aktif; lowercase + tanda hubung |
| `theme` | `{ primary, accent }` — warna hex |
| `gate_open` | Menentukan landing membuka gate atau tidak |
| `visibility` | `private` (hanya owner/editor) atau `members` (semua login) |
| `starts_at` | Data tanggal; tidak dirender di UI |

### `rooms`

| Kolom | Keterangan |
|---|---|
| `key` | `home` / `touring` / `healing` / `music`; unik per event di antara baris aktif |
| `locked` | Terkunci manual, tidak bergantung pada role |
| `min_role` | Role minimum untuk membuka; semua room default `guest` |

### `items`

| Kolom | Keterangan |
|---|---|
| `type` | `photo` / `video` / `song` / `text` |
| `provider` | `cloudinary` (foto), `r2` (video), `youtube`/`spotify` (embed), `none` (teks) |
| `public_id` | ID Cloudinary, dipakai untuk membentuk URL transformasi |
| `url` | URL final untuk R2 / embed / teks |
| `thumb_url` | Poster video hasil frame pertama (Cloudinary) |
| `song_provider` | Provider lagu tempelan; `none` = tidak ada lagu |
| `song_url` | URL Spotify/YouTube lagu tempelan |
| `song_title` | Judul lagu, maks 200 karakter |
| `song_start_s` | Detik mulai pemutaran; `null` = dari awal |
| `taken_at` | Tanggal foto/video diambil (opsional) |
| `sort_order` | Urutan manual di dalam room |

Untuk `type = 'song'`, lagu disimpan di `provider`/`url` dan `song_*` dibiarkan `none`. `song_*` hanya dipakai item non-lagu.

### `visits`

| Kolom | Keterangan |
|---|---|
| `session_hash` | `sha256(uid + ':' + YYYY-MM-DD)` — hitung unik tanpa menyimpan IP |
| `visible` | `false` = disembunyikan dari UI, **tetap ada di DB** |
| `action` | Enum, lihat §3 |

### `settings`

| Key | Bentuk value |
|---|---|
| `guardian` | `{ name, birthday, lastSeen }` — global, bukan per event |
| `notifications` | `{ enabled, channel: 'telegram', chatIds: [] }` |

Key `features` tidak dipakai. Izin upload ditentukan oleh role (`owner`/`editor`), bukan flag.

### `audit_logs`

| Kolom | Keterangan |
|---|---|
| `actor_id` | user yang melakukan perubahan; `null` untuk seed/backup/sistem |
| `action` | `create` / `update` / `soft_delete` / `restore` |
| `entity` | jenis entitas yang berubah |
| `entity_id` | uuid entitas, atau key untuk `settings` (kolom `text`) |
| `event_id` | cakupan event untuk filter dashboard; `null` untuk perubahan level user/settings |
| `before` | snapshot JSON kolom sebelum perubahan; `null` saat `create` |
| `after` | snapshot JSON sesudah perubahan; `null` saat `soft_delete` |
| `created_at` | waktu kejadian |

Aturan:
- Tidak pernah `UPDATE`, tidak pernah `DELETE`.
- Ditulis **dalam transaksi yang sama** dengan mutasi, lewat `lib/audit.ts`.
- Jangan mencatat secret. Untuk `settings`, catat key dan field non-rahasia saja.
- `users.last_login_at` tidak dicatat agar log tidak penuh noise.

---

## 6. Query yang Harus Dilayani

Semua query baca **wajib** menambahkan `deleted_at is null` pada tabel yang punya kolom itu. Setiap query di bawah punya index pendukung.

| # | Kebutuhan | Query |
|---|---|---|
| 1 | Event by slug | `select * from events where slug = $1 and deleted_at is null` |
| 2 | Room satu event, berurutan | `select * from rooms where event_id = $1 and deleted_at is null order by sort_order` |
| 3 | Item satu room, paginasi 24 | `select * from items where room_id = $1 and deleted_at is null order by sort_order limit 24 offset $2` |
| 4 | Status guardian | `select value from settings where key = 'guardian'` |
| 5 | Gate satu event | `select gate_open from events where slug = $1 and deleted_at is null` |
| 6 | 50 visit terakhir | `select * from visits where visible order by created_at desc limit 50` |
| 7 | Statistik 30 hari | agregasi harian (lihat §7) |
| 8 | User by firebase_uid | `select * from users where firebase_uid = $1 and deleted_at is null` |
| 9 | Validasi invite | `select * from invites where code = $1 and deleted_at is null and active and (expires_at is null or expires_at > now()) and uses < max_uses` |
| 10 | Event utama untuk gate landing | `select * from events where deleted_at is null order by sort_order, created_at limit 1` |
| 11 | Log satu entitas | `select * from audit_logs where entity = $1 and entity_id = $2 order by created_at desc limit 50` |
| 12 | Log terbaru untuk dashboard | `select * from audit_logs order by created_at desc limit 50` |

---

## 7. Query Referensi

Waktu ditampilkan dan diagregasi dalam **`Asia/Jakarta`** (keputusan D-016).

```sql
-- Statistik 30 hari
select date_trunc('day', created_at at time zone 'Asia/Jakarta') as day,
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
   set uses = uses + 1,
       updated_at = now()
 where code = $1 and deleted_at is null and active
   and (expires_at is null or expires_at > now())
   and uses < max_uses
returning id, role;
-- jika rowCount = 0 → rollback
commit;

-- Soft delete item + audit, satu transaksi
begin;
update items
   set deleted_at = now(), deleted_by = $2, updated_at = now(), updated_by = $2
 where id = $1 and deleted_at is null
returning *;

insert into audit_logs (actor_id, action, entity, entity_id, event_id, before, after)
values ($2, 'soft_delete', 'item', $1, $3, $4::jsonb, null);
commit;

-- Log terbaru
select l.created_at, l.action, l.entity, l.entity_id, u.display_name
from audit_logs l
left join users u on u.id = l.actor_id
order by l.created_at desc
limit 50;
```

---

## 8. Aturan Penulisan Data

| Aturan | Detail |
|---|---|
| Tidak ada hard delete | `DELETE` dilarang di seluruh aplikasi. Gunakan `softDelete*` di repository |
| Soft delete | `UPDATE ... SET deleted_at = now(), deleted_by = $user, updated_at = now(), updated_by = $user` |
| Riwayat append-only | `visits`: `INSERT` boleh; `DELETE` dilarang; `UPDATE` hanya untuk `visible`, `updated_at`, `updated_by` |
| Sembunyikan, jangan hapus | Set `visible = false` untuk aksi berisik |
| Pulihkan | `deleted_at = null`, `deleted_by = null`; hanya lewat SQL manual oleh Ian, tidak ada UI di v1 |
| Media tidak di array | Satu baris `items` per media |
| `updated_at`/`updated_by` | Diperbarui di repository, bukan trigger |
| Slug | Regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`, unik di antara baris aktif |
| Caption | Maks 500 karakter; validasi dengan Zod |
| Lagu tempelan | Maks satu per item; `song_url` wajib host `open.spotify.com` atau `youtube.com`/`youtu.be` |
| Upload | Hanya `owner`/`editor`; maks 500 MB per file video, dicek di server |
| File media saat item dihapus | **Tidak** dihapus dari Cloudinary/R2 (keputusan D-018) |
| Audit log | Setiap `create`/`update`/`soft_delete`/`restore` menulis `audit_logs` dalam transaksi yang sama, lewat `lib/audit.ts` |
| Audit tidak diubah | `audit_logs` append-only: dilarang `UPDATE` dan `DELETE` |

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
- Perubahan yang merusak (drop kolom) harus dua tahap: (1) berhenti memakai, (2) drop setelah rilis berikutnya. Ini satu-satunya pengecualian aturan soft delete.
- Migrasi menambah kolom audit baru: beri default agar baris lama valid, lalu `updated_by`/`deleted_by` boleh `null`.

---

## 10. Seed

`scripts/seed.ts` membuat:

```
1 event   : our-little-universe
4 rooms   : home, touring, healing, music
8 items   : 2 per room (1 teks + 1 foto placeholder)
2 users   : owner (firdausfebrian666@gmail.com), guest (demo@example.com)
1 invite  : DEMO2026 (role guest, maxUses 5)
settings  : guardian, notifications
audit_logs: kosong (seed tidak menulis audit; actor_id null untuk operasi sistem)
```

Seed harus **idempoten**. Karena unique index bersifat partial, `on conflict` wajib menyertakan predikatnya:

```sql
insert into users (email, display_name, role, is_allowed)
values ('firdausfebrian666@gmail.com', 'Ian', 'owner', true)
on conflict (email) where deleted_at is null do nothing;
```

---

## 11. Backup & Retensi

| Data | Retensi | Metode |
|---|---|---|
| `visits` | **selamanya** | Tidak dihapus; di-dump harian ke R2 |
| `audit_logs` | **selamanya** | Tidak dihapus; di-dump harian ke R2 |
| `items`, `rooms`, `events` | aktif + terhapus | Dump harian ke R2, **termasuk baris soft-deleted** |
| Dump di R2 | 90 hari | Lifecycle rule di bucket |
| User | aktif + terhapus | Dump harian |

`scripts/backup.ts` dijalankan GitHub Action (cron harian). Format: JSON per tabel + satu CSV untuk `visits`. File media **tidak** ikut di-dump; yang dijamin hanya baris database.

---

## 12. Pertumbuhan Jangka Panjang

| Ambang | Tindakan |
|---|---|
| `visits` > 500 ribu baris | Partisi per bulan (`partition by range (created_at)`) |
| `visits` > 5 juta baris | Arsipkan bulan yang lebih lama ke R2 (Parquet), sisakan ringkasan harian |
| `audit_logs` > 1 juta baris | Arsipkan periode lama ke R2, sisakan 90 hari terakhir di database |
| `items` > 20 ribu | Tambah paginasi server-side + `limit` wajib di semua query |
| Soft-deleted `items` menumpuk | Arsipkan baris lama ke R2 lalu hapus manual — keputusan Ian, bukan otomatis |
| Storage 0,5 GB mendekati batas | Pindahkan kolom teks panjang (`caption`, `description`) ke R2 bila perlu |

Semua tindakan di atas **belum perlu dilakukan sekarang** dan tidak boleh dikerjakan lebih awal.
