import { z } from "zod";

const isoDate = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), {
    message: "Tanggal tidak valid",
  });

export const chapterSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
    title: z.string().trim().min(1).max(120),
    subtitle: z.string().trim().max(200).default(""),
    startsAt: isoDate.default(""),
  })
  .strict();

export type ChapterFields = z.infer<typeof chapterSchema>;

/** Pemetaan eksplisit ke kolom (PRD §18.2). */
export function toChapterInput(fields: ChapterFields) {
  return {
    slug: fields.slug,
    title: fields.title,
    subtitle: fields.subtitle || null,
    startsAt: fields.startsAt ? new Date(fields.startsAt) : null,
  };
}
