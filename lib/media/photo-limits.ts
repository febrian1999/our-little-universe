/** Batas unggah foto. Dipakai server (sign) dan browser (pra-cek). */
export const PHOTO_MAX_BYTES = 25 * 1024 * 1024;

/** PRD §18.6: format allowlist, tanpa svg/html/js. */
export const CLOUDINARY_ALLOWED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
] as const;
