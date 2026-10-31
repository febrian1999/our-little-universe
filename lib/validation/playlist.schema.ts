import { z } from "zod";
import { canonicalSpotifyPlaylist } from "@/lib/security/urls";

export const playlistSchema = z
  .object({
    url: z.string().trim().min(1).max(300),
    title: z.string().trim().min(1).max(120),
    sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  })
  .strict();

export type PlaylistFields = z.infer<typeof playlistSchema>;

/** URL di-kanonikkan tanpa `?si=` sebelum disimpan (PRD §8.1). */
export function toPlaylistInput(
  fields: PlaylistFields,
): { url: string; title: string; sortOrder: number } | null {
  const canonical = canonicalSpotifyPlaylist(fields.url);
  if (!canonical) return null;
  return { url: canonical.url, title: fields.title, sortOrder: fields.sortOrder };
}
