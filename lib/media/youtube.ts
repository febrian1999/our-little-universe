const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Menerima youtu.be, /watch?v=, /embed/, dan /shorts/. */
export function youtubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;

  const host = parsed.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    return YOUTUBE_ID.test(id) ? id : null;
  }
  if (host !== "youtube.com" && host !== "m.youtube.com") return null;

  if (parsed.pathname === "/watch") {
    const id = parsed.searchParams.get("v") ?? "";
    return YOUTUBE_ID.test(id) ? id : null;
  }

  const match = /^\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})/.exec(parsed.pathname);
  return match ? match[1] : null;
}

export function youtubeEmbedUrl(
  url: string,
  startS?: number | null,
): string | null {
  const id = youtubeId(url);
  if (!id) return null;
  const start = startS && startS > 0 ? `?start=${startS}` : "";
  return `https://www.youtube.com/embed/${id}${start}`;
}
