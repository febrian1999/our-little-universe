import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invites, type userRole } from "@/lib/db/schema";
import type { AuthProfile } from "./users";

export type UserRole = (typeof userRole.enumValues)[number];

/** Undangan aktif, belum kedaluwarsa, dan masih punya sisa pakai. */
export async function getInvite(code: string) {
  const [row] = await getDb()
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.code, code),
        isNull(invites.deletedAt),
        eq(invites.active, true),
      ),
    )
    .limit(1);
  if (!row) return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;
  if (row.uses >= row.maxUses) return null;
  return row;
}

export type RedeemedUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};

/**
 * Klaim undangan dalam satu statement (Neon HTTP tidak punya transaksi
 * interaktif). Cek kuota, kenaikan `uses`, upsert user, dan catatan
 * `invite_redeem` terjadi atomik. `null` = undangan tidak valid.
 */
export async function redeemInvite(
  code: string,
  profile: AuthProfile,
): Promise<RedeemedUser | null> {
  const result = await getDb().execute(sql`
    with valid as (
      select id, role from invites
      where code = ${code}
        and deleted_at is null
        and active = true
        and (expires_at is null or expires_at > now())
        and uses < max_uses
      for update
    ),
    bumped as (
      update invites i
      set uses = i.uses + 1, updated_at = now()
      from valid v
      where i.id = v.id
      returning v.role as role
    ),
    upserted as (
      insert into users (
        firebase_uid, email, display_name, photo_url, role, is_allowed, last_login_at
      )
      select
        ${profile.firebaseUid}, ${profile.email}, ${profile.name},
        ${profile.photoUrl}, b.role, true, now()
      from bumped b
      on conflict (email) where deleted_at is null
      do update set
        firebase_uid = coalesce(users.firebase_uid, excluded.firebase_uid),
        display_name = coalesce(nullif(users.display_name, ''), excluded.display_name),
        photo_url = coalesce(excluded.photo_url, users.photo_url),
        role = case when users.role = 'owner' then users.role else excluded.role end,
        is_allowed = true,
        last_login_at = now(),
        updated_at = now()
      returning id, email, display_name, role
    ),
    logged as (
      insert into visits (user_id, action, path)
      select id, 'invite_redeem', '/invite/[redacted]' from upserted
    )
    select id, email, display_name, role from upserted
  `);

  const row = result.rows[0] as
    | { id: string; email: string; display_name: string; role: UserRole }
    | undefined;
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  };
}
