import { loadEnvFile } from "node:process";
import { defineConfig } from "drizzle-kit";

// Next memuat .env.local sendiri; drizzle-kit tidak.
try {
  loadEnvFile(".env.local");
} catch {
  // CI memakai environment dari secrets.
}

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) {
  throw new Error("DATABASE_URL_UNPOOLED belum diisi (lihat docs/manual-setup.md)");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
