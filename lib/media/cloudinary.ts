import { createHash, randomUUID } from "node:crypto";
import {
  CLOUDINARY_ALLOWED_FORMATS,
  PHOTO_MAX_BYTES,
} from "./photo-limits.ts";

export { CLOUDINARY_ALLOWED_FORMATS, PHOTO_MAX_BYTES };

/** Signature Cloudinary: parameter diurutkan alfabetis + api_secret. */
export function cloudinarySignature(
  params: Record<string, string | number>,
  secret: string,
) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${secret}`).digest("hex");
}

export type PhotoUploadTicket = {
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
  signature: string;
  params: Record<string, string | number>;
};

/**
 * Tiket upload foto: folder dan public_id dibuat server, `overwrite` mati.
 * `max_file_size` tidak ikut ditandatangani (Cloudinary tidak memasukkannya ke
 * string to sign), jadi batas ukuran dijaga di browser sebelum unggah.
 */
export function buildPhotoUploadTicket(
  chapterId: string,
  now = Date.now(),
): PhotoUploadTicket {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !secret) {
    throw new Error("Cloudinary belum diisi (docs/manual-setup.md §3)");
  }

  const params: Record<string, string | number> = {
    allowed_formats: CLOUDINARY_ALLOWED_FORMATS.join(","),
    folder: `olu/${chapterId}`,
    overwrite: "false",
    public_id: randomUUID(),
    timestamp: Math.floor(now / 1000),
  };

  return {
    cloudName,
    apiKey,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    signature: cloudinarySignature(params, secret),
    params,
  };
}
