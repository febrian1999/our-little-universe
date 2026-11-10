import { z } from "zod";

export const accessRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    message: z.string().trim().max(500).default(""),
  })
  .strict();

export const inviteSchema = z
  .object({
    email: z.string().trim().max(200).default(""),
    role: z.enum(["owner", "editor"]).default("editor"),
    days: z.coerce.number().int().min(1).max(365).default(7),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Email tidak valid",
      });
    }
  });

/** Kode undangan: 8 karakter alfanumerik huruf besar, tanpa karakter rancu. */
export function generateInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}
