import { describe, expect, it } from "vitest";
import { chapterSchema, toChapterInput } from "./chapter.schema";
import { itemSchema, toItemInput } from "./item.schema";
import { playlistSchema, toPlaylistInput } from "./playlist.schema";
import { roomSchema, toRoomInput } from "./room.schema";

describe("chapterSchema", () => {
  it("menerima slug valid dan mengubah tanggal", () => {
    const parsed = chapterSchema.parse({
      slug: "anniversary-1",
      title: "Anniversary",
      subtitle: "",
      startsAt: "2026-10-31",
    });
    expect(toChapterInput(parsed)).toEqual({
      slug: "anniversary-1",
      title: "Anniversary",
      subtitle: null,
      startsAt: new Date("2026-10-31"),
    });
  });

  it("menolak slug dengan huruf besar dan field asing", () => {
    expect(
      chapterSchema.safeParse({ slug: "Anniversary", title: "x" }).success,
    ).toBe(false);
    expect(
      chapterSchema.safeParse({ slug: "ok", title: "x", gateOpen: true }).success,
    ).toBe(false);
  });
});

describe("roomSchema", () => {
  it("default ikon dan jenis feed", () => {
    const parsed = roomSchema.parse({ key: "touring", title: "Touring" });
    expect(toRoomInput(parsed)).toMatchObject({
      icon: "✨",
      kind: "feed",
      description: null,
      sortOrder: 0,
    });
  });

  it("menolak key tidak valid", () => {
    expect(roomSchema.safeParse({ key: "Touring Room", title: "x" }).success).toBe(
      false,
    );
  });
});

describe("playlistSchema", () => {
  it("membuang parameter si dari tautan Spotify", () => {
    const input = toPlaylistInput(
      playlistSchema.parse({
        url: "https://open.spotify.com/playlist/7KAtx1ihS4vdjVcdI5pJb0?si=abc",
        title: "Malam",
        sortOrder: "2",
      }),
    );
    expect(input?.url).toBe(
      "https://open.spotify.com/playlist/7KAtx1ihS4vdjVcdI5pJb0",
    );
    expect(input?.sortOrder).toBe(2);
  });

  it("mengembalikan null untuk tautan bukan playlist", () => {
    expect(
      toPlaylistInput(
        playlistSchema.parse({ url: "https://evil.com/x", title: "Malam" }),
      ),
    ).toBeNull();
  });
});

describe("itemSchema", () => {
  it("foto wajib punya publicId hasil unggah", () => {
    const result = itemSchema.safeParse({ type: "photo" });
    expect(result.success).toBe(false);
  });

  it("video hanya menerima YouTube", () => {
    expect(
      itemSchema.safeParse({ type: "video", url: "https://vimeo.com/1" }).success,
    ).toBe(false);
    const ok = itemSchema.parse({
      type: "video",
      url: "https://youtu.be/dQw4w9WgXcQ",
    });
    expect(toItemInput(ok)).toMatchObject({ provider: "youtube" });
  });

  it("lagu tempelan menentukan provider dan angka kosong jadi null", () => {
    const ok = itemSchema.parse({
      type: "text",
      caption: "Halo",
      songUrl: "https://open.spotify.com/track/7KAtx1ihS4vdjVcdI5pJb0",
      songStartS: "",
      width: "",
    });
    expect(toItemInput(ok)).toMatchObject({
      songProvider: "spotify",
      songStartS: null,
      width: null,
      provider: "none",
    });
  });

  it("menolak lagu tempelan dari host lain", () => {
    expect(
      itemSchema.safeParse({ type: "text", songUrl: "https://evil.com/lagu" })
        .success,
    ).toBe(false);
  });
});
