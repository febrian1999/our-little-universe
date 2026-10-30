import { describe, expect, it } from "vitest";
import {
  SONG_HOSTS,
  canonicalSpotifyPlaylist,
  isAllowedHttpsUrl,
} from "./urls";

describe("canonicalSpotifyPlaylist", () => {
  it("menerima URL valid dan membuang ?si=", () => {
    const r = canonicalSpotifyPlaylist(
      "https://open.spotify.com/playlist/7KAtx1ihS4vdjVcdI5pJb0?si=4580714424e24050",
    );
    expect(r).toEqual({
      id: "7KAtx1ihS4vdjVcdI5pJb0",
      url: "https://open.spotify.com/playlist/7KAtx1ihS4vdjVcdI5pJb0",
    });
  });

  it("menerima tanpa query dan dengan trailing slash", () => {
    expect(canonicalSpotifyPlaylist("https://open.spotify.com/playlist/7KAtx1ihS4vdjVcdI5pJb0")).not.toBeNull();
    expect(canonicalSpotifyPlaylist("https://open.spotify.com/playlist/7KAtx1ihS4vdjVcdI5pJb0/")).not.toBeNull();
  });

  it("menolak path salah", () => {
    expect(canonicalSpotifyPlaylist("https://open.spotify.com/track/7KAtx1ihS4vdjVcdI5pJb0")).toBeNull();
    expect(canonicalSpotifyPlaylist("https://open.spotify.com/playlist/short")).toBeNull();
  });

  it("menolak non-https dan host lain", () => {
    expect(canonicalSpotifyPlaylist("http://open.spotify.com/playlist/7KAtx1ihS4vdjVcdI5pJb0")).toBeNull();
    expect(canonicalSpotifyPlaylist("https://evil.com/playlist/7KAtx1ihS4vdjVcdI5pJb0")).toBeNull();
  });

  it("menolak input bukan URL", () => {
    expect(canonicalSpotifyPlaylist("bukan url")).toBeNull();
    expect(canonicalSpotifyPlaylist("")).toBeNull();
  });
});

describe("isAllowedHttpsUrl", () => {
  it("menerima host allowlist via https", () => {
    expect(isAllowedHttpsUrl("https://open.spotify.com/x", SONG_HOSTS)).not.toBeNull();
    expect(isAllowedHttpsUrl("https://youtu.be/abc", SONG_HOSTS)).not.toBeNull();
  });

  it("menolak http dan host lain", () => {
    expect(isAllowedHttpsUrl("http://open.spotify.com/x", SONG_HOSTS)).toBeNull();
    expect(isAllowedHttpsUrl("https://evil.com/x", SONG_HOSTS)).toBeNull();
  });
});
