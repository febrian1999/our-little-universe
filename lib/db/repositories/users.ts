import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getUserByFirebaseUid(firebaseUid: string) {
  const [row] = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.firebaseUid, firebaseUid), isNull(users.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function getUserByEmail(email: string) {
  const [row] = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);
  return row ?? null;
}
