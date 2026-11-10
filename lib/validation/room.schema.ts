import { z } from "zod";

export const roomSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1)
      .max(48)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Key hanya huruf kecil, angka, dan tanda hubung"),
    title: z.string().trim().min(1).max(120),
    icon: z.string().trim().min(1).max(8).default("✨"),
    description: z.string().trim().max(200).default(""),
    kind: z.enum(["feed", "playlist"]).default("feed"),
    sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  })
  .strict();

export type RoomFields = z.infer<typeof roomSchema>;

export function toRoomInput(fields: RoomFields) {
  return {
    key: fields.key,
    title: fields.title,
    icon: fields.icon,
    description: fields.description || null,
    kind: fields.kind,
    sortOrder: fields.sortOrder,
  };
}
