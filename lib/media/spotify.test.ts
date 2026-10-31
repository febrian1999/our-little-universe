import { describe, expect, it } from "vitest";
import { spotifyPlaylistEmbed, spotifyTrackEmbed } from "./spotify";

describe("spotifyPlaylistEmbed", () => {
  it("membentuk embed dari ID, bukan URL mentah", () => {
    expect(
      spotifyPlaylistEmbed(
        "https://open.spotify.com/playlist/7KAtx1ihS4vdjVcdI5pJb0?si=abc",
      ),
    ).toBe("https://open.spotify.com/embed/playlist/7KAtx1ihS4vdjVcdI5pJb0");
  });

  it("menolak URL bukan playlist", () => {
    expect(
      spotifyPlaylistEmbed("https://open.spotify.com/track/7KAtx1ihS4vdjVcdI5pJb0"),
    ).toBeNull();
    expect(spotifyPlaylistEmbed("https://evil.com/playlist/7KAtx1ihS4vdjVcdI5pJb0")).toBeNull();
  });
});

describe("spotifyTrackEmbed", () => {
  it("menerima track dan episode", () => {
    expect(
      spotifyTrackEmbed("https://open.spotify.com/track/7KAtx1ihS4vdjVcdI5pJb0"),
    ).toBe("https://open.spotify.com/embed/track/7KAtx1ihS4vdjVcdI5pJb0");
    expect(
      spotifyTrackEmbed("https://open.spotify.com/episode/7KAtx1ihS4vdjVcdI5pJb0"),
    ).toBe("https://open.spotify.com/embed/episode/7KAtx1ihS4vdjVcdI5pJb0");
  });

  it("menambahkan detik mulai bila ada", () => {
    expect(
      spotifyTrackEmbed(
        "https://open.spotify.com/track/7KAtx1ihS4vdjVcdI5pJb0",
        42,
      ),
    ).toContain("?t=42");
  });

  it("menolak playlist, http, dan host lain", () => {
    expect(
      spotifyTrackEmbed("https://open.spotify.com/playlist/7KAtx1ihS4vdjVcdI5pJb0"),
    ).toBeNull();
    expect(
      spotifyTrackEmbed("http://open.spotify.com/track/7KAtx1ihS4vdjVcdI5pJb0"),
    ).toBeNull();
    expect(
      spotifyTrackEmbed("https://evil.com/track/7KAtx1ihS4vdjVcdI5pJb0"),
    ).toBeNull();
  });
});
