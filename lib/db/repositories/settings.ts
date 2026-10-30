import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { settings } from "@/lib/db/schema";

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const [row] = await getDb()
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return (row?.value as T) ?? null;
}
