import { z } from "zod";
import { youtubeId } from "@/lib/media/youtube";
import { SONG_HOSTS, isAllowedHttpsUrl } from "@/lib/security/urls";

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce.number().int().min(0).max(20000).optional(),
);
const isoDate = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), {
    message: "Tanggal tidak valid",
  });

export const itemSchema = z
  .object({
    type: z.enum(["photo", "video", "song", "text"]),
    caption: z.string().trim().max(2000).default(""),
    takenAt: isoDate.default(""),
    publicId: z.string().trim().max(300).default(""),
    url: z.string().trim().max(500).default(""),
    width: optionalNumber,
    height: optionalNumber,
    songUrl: z.string().trim().max(500).default(""),
    songTitle: z.string().trim().max(200).default(""),
    songStartS: optionalNumber,
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.type === "photo" && value.publicId === "") {
      ctx.addIssue({
        code: "custom",
        path: ["publicId"],
        message: "Foto harus diunggah dulu ke Cloudinary",
      });
    }
    if (value.type === "video" && !youtubeId(value.url)) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "Video hanya menerima tautan YouTube",
      });
    }
    if (value.type === "song" && !isAllowedHttpsUrl(value.url, SONG_HOSTS)) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "Lagu hanya menerima tautan Spotify atau YouTube",
      });
    }
    if (value.songUrl !== "" && !isAllowedHttpsUrl(value.songUrl, SONG_HOSTS)) {
      ctx.addIssue({
        code: "custom",
        path: ["songUrl"],
        message: "Lagu tempelan hanya menerima tautan Spotify atau YouTube",
      });
    }
  });

export type ItemFields = z.infer<typeof itemSchema>;

function providerFor(type: ItemFields["type"], url: string) {
  if (type === "photo") return "cloudinary" as const;
  if (type === "video") return "youtube" as const;
  if (type === "song") {
    return url.includes("open.spotify.com") ? ("spotify" as const) : ("youtube" as const);
  }
  return "none" as const;
}

export function toItemInput(fields: ItemFields) {
  const hasSong = fields.songUrl !== "";
  return {
    type: fields.type,
    provider: providerFor(fields.type, fields.url),
    publicId: fields.publicId || null,
    url: fields.url || null,
    thumbUrl: null,
    width: fields.width ?? null,
    height: fields.height ?? null,
    caption: fields.caption || null,
    takenAt: fields.takenAt ? new Date(fields.takenAt) : null,
    sortOrder: fields.sortOrder,
    songProvider: hasSong
      ? fields.songUrl.includes("open.spotify.com")
        ? ("spotify" as const)
        : ("youtube" as const)
      : ("none" as const),
    songUrl: fields.songUrl || null,
    songTitle: fields.songTitle || null,
    songStartS: fields.songStartS ?? null,
  };
}
