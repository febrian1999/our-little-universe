/**
 * Loader Cloudinary untuk `next/image` (PRD §8.1): media tidak pernah
 * diproksikan lewat domain aplikasi, jadi optimizer Next dilewati.
 */
export function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (/^https?:\/\//.test(src)) return src;

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return src;

  const transform = ["f_auto", `q_${quality ?? "auto"}`, `w_${width}`].join(",");
  return `https://res.cloudinary.com/${cloud}/image/upload/${transform}/${src}`;
}
