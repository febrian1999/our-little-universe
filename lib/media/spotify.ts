import { canonicalSpotifyPlaylist } from "@/lib/security/urls";

const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;

/** Embed playlist dibentuk server dari ID, bukan dari URL mentah (PRD §8.1). */
export function spotifyPlaylistEmbed(url: string): string | null {
  const playlist = canonicalSpotifyPlaylist(url);
  if (!playlist) return null;
  return `https://open.spotify.com/embed/playlist/${playlist.id}`;
}

/** Embed lagu tempelan: track atau episode Spotify. */
export function spotifyTrackEmbed(
  url: string,
  startS?: number | null,
): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "open.spotify.com") {
    return null;
  }

  const match = /^\/(track|episode)\/([A-Za-z0-9]{22})\/?$/.exec(parsed.pathname);
  if (!match || !SPOTIFY_ID.test(match[2])) return null;

  const base = `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  return startS && startS > 0 ? `${base}?t=${startS}` : base;
}
