import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type DB = NeonHttpDatabase<typeof schema>;

// ponytail: lazy supaya modul aman di-import saat build (env mungkin belum ada).
let cached: DB | null = null;

export function getDb(): DB {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL belum diisi (lihat docs/manual-setup.md)");
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}
