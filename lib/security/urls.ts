/**
 * Validasi dan kanonikalisasi URL media (PRD §18.4, §8.3).
 * Embed dibentuk di server dari ID tervalidasi, bukan dari URL mentah.
 */

export type SpotifyPlaylist = { id: string; url: string };

/** Menerima URL playlist Spotify apa pun, mengembalikan bentuk kanonik tanpa `?si=`. */
export function canonicalSpotifyPlaylist(input: string): SpotifyPlaylist | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (u.hostname !== "open.spotify.com") return null;
  const m = /^\/playlist\/([A-Za-z0-9]{22})\/?$/.exec(u.pathname);
  if (!m) return null;
  return { id: m[1], url: `https://open.spotify.com/playlist/${m[1]}` };
}

/** Host yang diizinkan untuk URL lagu/media dari user. */
export const SONG_HOSTS = ["open.spotify.com", "youtube.com", "youtu.be"];

/** Memastikan URL https dengan host persis pada allowlist. */
export function isAllowedHttpsUrl(
  input: string,
  hosts: readonly string[],
): URL | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  return hosts.includes(u.hostname) ? u : null;
}
