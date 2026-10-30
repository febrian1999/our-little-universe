import { sql } from "drizzle-orm";
import {
  bigserial,
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["owner", "editor", "guest"]);
export const itemType = pgEnum("item_type", ["photo", "video", "song", "text"]);
export const mediaProvider = pgEnum("media_provider", [
  "cloudinary",
  "r2",
  "youtube",
  "spotify",
  "none",
]);
export const roomKind = pgEnum("room_kind", ["feed", "playlist"]);
export const visitAction = pgEnum("visit_action", [
  "gate_open",
  "room_view",
  "login",
  "logout",
  "connect",
  "upload",
  "invite_redeem",
  "gate_toggle",
]);
export const auditAction = pgEnum("audit_action", [
  "create",
  "update",
  "soft_delete",
  "restore",
]);
export const auditEntity = pgEnum("audit_entity", [
  "chapter",
  "room",
  "item",
  "playlist",
  "invite",
  "user",
  "setting",
]);

// --- helper kolom audit -------------------------------------------------
const stamped = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: uuid("updated_by").references((): AnyPgColumn => users.id, {
    onDelete: "set null",
  }),
});

const auditable = () => ({
  ...stamped(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: uuid("deleted_by").references((): AnyPgColumn => users.id, {
    onDelete: "set null",
  }),
});
// ------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firebaseUid: text("firebase_uid"),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    photoUrl: text("photo_url"),
    role: userRole("role").notNull().default("guest"),
    isAllowed: boolean("is_allowed").notNull().default(false),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...auditable(),
  },
  (t) => [
    uniqueIndex("users_email_active_idx")
      .on(t.email)
      .where(sql`deleted_at is null`),
    uniqueIndex("users_firebase_uid_active_idx")
      .on(t.firebaseUid)
      .where(sql`deleted_at is null`),
  ],
);

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    role: userRole("role").notNull().default("guest"),
    active: boolean("active").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    maxUses: integer("max_uses").notNull().default(1),
    uses: integer("uses").notNull().default(0),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...auditable(),
  },
  (t) => [
    uniqueIndex("invites_code_active_idx")
      .on(t.code)
      .where(sql`deleted_at is null`),
  ],
);

export const chapters = pgTable(
  "chapters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    theme: jsonb("theme")
      .$type<{ primary: string; accent: string }>()
      .notNull()
      .default({ primary: "#EC4899", accent: "#2563EB" }),
    heroPublicId: text("hero_public_id"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    gateOpen: boolean("gate_open").notNull().default(false),
    visibility: text("visibility").notNull().default("members"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...auditable(),
  },
  (t) => [
    uniqueIndex("chapters_slug_active_idx")
      .on(t.slug)
      .where(sql`deleted_at is null`),
  ],
);

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id),
    key: text("key").notNull(),
    title: text("title").notNull(),
    icon: text("icon").notNull().default("✨"),
    description: text("description"),
    coverPublicId: text("cover_public_id"),
    kind: roomKind("kind").notNull().default("feed"),
    sortOrder: integer("sort_order").notNull().default(0),
    locked: boolean("locked").notNull().default(false),
    minRole: userRole("min_role").notNull().default("guest"),
    ...auditable(),
  },
  (t) => [
    index("rooms_chapter_order_idx").on(t.chapterId, t.sortOrder),
    uniqueIndex("rooms_chapter_key_active_idx")
      .on(t.chapterId, t.key)
      .where(sql`deleted_at is null`),
  ],
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id),
    type: itemType("type").notNull(),
    provider: mediaProvider("provider").notNull().default("none"),
    publicId: text("public_id"),
    url: text("url"),
    thumbUrl: text("thumb_url"),
    width: integer("width"),
    height: integer("height"),
    durationS: integer("duration_s"),
    songProvider: mediaProvider("song_provider").notNull().default("none"),
    songUrl: text("song_url"),
    songTitle: text("song_title"),
    songStartS: integer("song_start_s"),
    caption: text("caption"),
    takenAt: timestamp("taken_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...auditable(),
  },
  (t) => [index("items_room_order_idx").on(t.roomId, t.sortOrder)],
);

export const playlists = pgTable(
  "playlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id),
    provider: mediaProvider("provider").notNull().default("spotify"),
    url: text("url").notNull(),
    title: text("title").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...auditable(),
  },
  (t) => [
    index("playlists_room_order_idx").on(t.roomId, t.sortOrder),
    uniqueIndex("playlists_room_url_active_idx")
      .on(t.roomId, t.url)
      .where(sql`deleted_at is null`),
  ],
);

export const visits = pgTable(
  "visits",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sessionHash: text("session_hash"),
    chapterId: uuid("chapter_id").references(() => chapters.id, {
      onDelete: "set null",
    }),
    roomId: uuid("room_id").references(() => rooms.id, {
      onDelete: "set null",
    }),
    action: visitAction("action").notNull(),
    path: text("path"),
    userAgent: text("user_agent"),
    visible: boolean("visible").notNull().default(true),
    ...stamped(),
  },
  (t) => [
    index("visits_created_idx").on(t.createdAt),
    index("visits_action_idx").on(t.action, t.createdAt),
    index("visits_user_idx").on(t.userId, t.createdAt),
    index("visits_chapter_idx").on(t.chapterId, t.createdAt),
    index("visits_visible_idx").on(t.visible, t.createdAt),
  ],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  ...stamped(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: auditAction("action").notNull(),
    entity: auditEntity("entity").notNull(),
    entityId: text("entity_id").notNull(),
    chapterId: uuid("chapter_id").references(() => chapters.id, {
      onDelete: "set null",
    }),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_logs_created_idx").on(t.createdAt),
    index("audit_logs_entity_idx").on(t.entity, t.entityId, t.createdAt),
    index("audit_logs_actor_idx").on(t.actorId, t.createdAt),
  ],
);
