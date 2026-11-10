import { loadEnvFile } from "node:process";
import { neon } from "@neondatabase/serverless";
import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as s from "../lib/db/schema.ts";
import { canonicalSpotifyPlaylist } from "../lib/security/urls.ts";

try {
  loadEnvFile(".env.local");
} catch {
  // CI memakai environment dari secrets.
}

if (process.env.NODE_ENV === "production") {
  throw new Error("Seed menolak jalan di production (PRD §18.5)");
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_UNPOOLED belum diisi");

const db = drizzle(neon(url), { schema: s });

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? "firdausfebrian666@gmail.com";
const CHAPTER_SLUG = "our-little-universe";

const PLAYLISTS = [
  {
    title: "Our Little Universe",
    raw: "https://open.spotify.com/playlist/7KAtx1ihS4vdjVcdI5pJb0?si=4580714424e24050",
    mood: "princess",
  },
  {
    title: "Teman Menulis",
    raw: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    mood: "midnight",
  },
  {
    title: "Echa's Daily Playlist",
    raw: "https://open.spotify.com/playlist/6Q9nQactoasvya7zQmy4PK",
    mood: "comfort",
  },
  {
    title: "Coffee & Study",
    raw: "https://open.spotify.com/playlist/4lscWbdYDo6g4f7sNbCXSO",
    mood: "coffee",
  },
];

/** Kamus mood (D-060). Satu playlist merujuk satu mood lewat `mood_id`. */
const MOODS = [
  { key: "princess", label: "Soft Princess", emoji: "🌸", sortOrder: 0 },
  { key: "coffee", label: "Coffee Date", emoji: "☕", sortOrder: 1 },
  { key: "midnight", label: "Midnight Ride", emoji: "🌙", sortOrder: 2 },
  { key: "comfort", label: "Comfort Songs", emoji: "🤍", sortOrder: 3 },
];

async function seedUsers() {
  await db
    .insert(s.users)
    .values({
      email: OWNER_EMAIL,
      displayName: "Ian",
      role: "owner",
      isAllowed: true,
    })
    .onConflictDoNothing();

  await db
    .insert(s.users)
    .values({
      email: "demo@example.com",
      displayName: "Tamu Demo",
      role: "guest",
      isAllowed: true,
    })
    .onConflictDoNothing();

  const [owner] = await db
    .select()
    .from(s.users)
    .where(eq(s.users.email, OWNER_EMAIL))
    .limit(1);
  if (!owner) throw new Error("user owner gagal dibuat");
  return owner;
}

async function seedChapter(ownerId: string) {
  await db
    .insert(s.chapters)
    .values({
      slug: CHAPTER_SLUG,
      title: "Our Little Universe",
      subtitle: "Bab pertama, dan yang berikutnya",
      createdBy: ownerId,
      updatedBy: ownerId,
      startsAt: new Date("2026-09-17T00:00:00Z"),
    })
    .onConflictDoNothing();

  const [chapter] = await db
    .select()
    .from(s.chapters)
    .where(eq(s.chapters.slug, CHAPTER_SLUG))
    .limit(1);
  if (!chapter) throw new Error("chapter gagal dibuat");
  return chapter;
}

async function seedRooms(chapterId: string, ownerId: string) {
  const rows = [
    {
      key: "touring",
      title: "Touring",
      icon: "🛤️",
      description: "Jalan-jalan kecil yang kita simpan.",
      kind: "feed" as const,
      sortOrder: 0,
    },
    {
      key: "healing",
      title: "Healing",
      icon: "🌿",
      description: "Tempat untuk bernapas sebentar.",
      kind: "feed" as const,
      sortOrder: 1,
    },
    {
      key: "music",
      title: "Music",
      icon: "🎵",
      description: "Playlist yang menemani cerita.",
      kind: "playlist" as const,
      sortOrder: 2,
    },
  ];

  for (const row of rows) {
    await db
      .insert(s.rooms)
      .values({ ...row, chapterId, updatedBy: ownerId })
      .onConflictDoNothing();
  }

  return db.select().from(s.rooms).where(eq(s.rooms.chapterId, chapterId));
}

async function seedItems(roomsList: Awaited<ReturnType<typeof seedRooms>>, ownerId: string) {
  const drafts = [
    {
      key: "touring",
      values: [
        { type: "text" as const, caption: "Perjalanan pertama kita dimulai dari sini." },
        {
          type: "photo" as const,
          provider: "cloudinary" as const,
          publicId: "olu/seed/touring",
          caption: "Foto placeholder touring.",
        },
      ],
    },
    {
      key: "healing",
      values: [
        { type: "text" as const, caption: "Tidak apa-apa berhenti sebentar." },
        {
          type: "photo" as const,
          provider: "cloudinary" as const,
          publicId: "olu/seed/healing",
          caption: "Foto placeholder healing.",
        },
      ],
    },
  ];

  for (const draft of drafts) {
    const room = roomsList.find((r) => r.key === draft.key);
    if (!room) continue;
    const existing = await db
      .select({ id: s.items.id })
      .from(s.items)
      .where(eq(s.items.roomId, room.id))
      .limit(1);
    if (existing.length > 0) continue;

    await db.insert(s.items).values(
      draft.values.map((v, i) => ({
        ...v,
        roomId: room.id,
        sortOrder: i,
        createdBy: ownerId,
        updatedBy: ownerId,
      })),
    );
  }
}

async function seedMoods(ownerId: string) {
  for (const mood of MOODS) {
    await db
      .insert(s.playlistMoods)
      .values({ ...mood, updatedBy: ownerId })
      .onConflictDoNothing();
  }
  return db.select().from(s.playlistMoods).where(isNull(s.playlistMoods.deletedAt));
}

async function seedPlaylists(
  roomsList: Awaited<ReturnType<typeof seedRooms>>,
  moodsList: Awaited<ReturnType<typeof seedMoods>>,
) {
  const room = roomsList.find((r) => r.key === "music");
  if (!room) return;

  const moodIdByKey = new Map(moodsList.map((mood) => [mood.key, mood.id]));

  for (const [i, p] of PLAYLISTS.entries()) {
    const canonical = canonicalSpotifyPlaylist(p.raw);
    if (!canonical) throw new Error(`URL playlist tidak valid: ${p.raw}`);
    const moodId = moodIdByKey.get(p.mood) ?? null;

    // onConflictDoNothing: playlist lama tidak ditimpa; mood lama diisi lewat UPDATE.
    const inserted = await db
      .insert(s.playlists)
      .values({
        roomId: room.id,
        url: canonical.url,
        title: p.title,
        sortOrder: i,
        moodId,
      })
      .onConflictDoNothing()
      .returning({ id: s.playlists.id });

    if (inserted.length === 0 && moodId) {
      await db
        .update(s.playlists)
        .set({ moodId })
        .where(
          and(
            eq(s.playlists.roomId, room.id),
            eq(s.playlists.url, canonical.url),
            isNull(s.playlists.moodId),
          ),
        );
    }
  }
}

async function seedSettingsAndInvite(ownerId: string) {
  await db
    .insert(s.settings)
    .values([
      {
        key: "guardian",
        value: { name: null, birthday: null, lastSeen: null },
        updatedBy: ownerId,
      },
      {
        key: "notifications",
        value: { enabled: false, chatIds: [] },
        updatedBy: ownerId,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(s.invites)
    .values({
      code: "DEMO2026",
      role: "guest",
      maxUses: 5,
      createdBy: ownerId,
      updatedBy: ownerId,
    })
    .onConflictDoNothing();
}

async function main() {
  const owner = await seedUsers();
  const chapter = await seedChapter(owner.id);
  const roomsList = await seedRooms(chapter.id, owner.id);
  await seedItems(roomsList, owner.id);
  const moodsList = await seedMoods(owner.id);
  await seedPlaylists(roomsList, moodsList);
  await seedSettingsAndInvite(owner.id);

  console.log(
    `seed selesai: 1 chapter, ${roomsList.length} room, ${MOODS.length} mood, ${PLAYLISTS.length} playlist, invite DEMO2026`,
  );
}

await main();
process.exit(0);
