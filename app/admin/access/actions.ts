"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { insertAudit } from "@/lib/db/repositories/audit";
import {
  decideAccessRequest,
  getAccessRequestById,
} from "@/lib/db/repositories/access-requests";
import {
  createInvite,
  getInvite,
  revokeInvite,
  type UserRole,
} from "@/lib/db/repositories/invites";
import {
  countOwners,
  getUserById,
  provisionGuestByEmail,
  revokeUser,
  updateUserRole,
} from "@/lib/db/repositories/users";
import { generateInviteCode, inviteSchema } from "@/lib/validation/access.schema";

const FROM = "/admin/access";

function fail(message: string): never {
  redirect(`${FROM}?error=${encodeURIComponent(message)}`);
}

function ok(message: string): never {
  redirect(`${FROM}?ok=${encodeURIComponent(message)}`);
}

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Data tidak valid";
}

export async function createInviteAction(formData: FormData) {
  const user = await requireRole("owner");
  const parsed = inviteSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? "editor"),
    days: String(formData.get("days") ?? "7"),
  });
  if (!parsed.success) fail(firstIssue(parsed.error));

  const { email, role, days } = parsed.data;

  // Kode acak dengan retry kecil; bentrok kode aktif ditolak index unik.
  let invite: Awaited<ReturnType<typeof createInvite>> | null = null;
  for (let attempt = 0; attempt < 5 && !invite; attempt += 1) {
    const code = generateInviteCode();
    if (await getInvite(code)) continue;
    try {
      invite = await createInvite(
        {
          email: email.toLowerCase() || null,
          role: role as UserRole,
          code,
          expiresAt: new Date(Date.now() + days * 86_400_000),
          maxUses: 1,
        },
        user.id,
      );
    } catch {
      invite = null;
    }
  }
  if (!invite) fail("Gagal membuat kode undangan. Coba lagi.");

  await insertAudit({
    actorId: user.id,
    action: "create",
    entity: "invite",
    entityId: invite.id,
    after: { code: invite.code, email: invite.email, role: invite.role },
  });

  revalidatePath(FROM);
  ok(`Undangan ${invite.code} dibuat`);
}

export async function revokeInviteAction(formData: FormData) {
  const user = await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const row = await revokeInvite(id, user.id);
  if (row) {
    await insertAudit({
      actorId: user.id,
      action: "soft_delete",
      entity: "invite",
      entityId: id,
      before: { code: row.code, email: row.email, role: row.role },
    });
  }
  revalidatePath(FROM);
  ok("Undangan dicabut");
}

export async function decideRequestAction(formData: FormData) {
  const user = await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300);

  if (decision !== "approved" && decision !== "rejected") {
    fail("Keputusan tidak valid");
  }

  const request = await getAccessRequestById(id);
  if (!request || request.status !== "pending") {
    fail("Permintaan tidak ditemukan atau sudah diputuskan");
  }

  const updated = await decideAccessRequest(id, decision, user.id, reason || null);
  if (!updated) fail("Gagal menyimpan keputusan");

  // Approve langsung membuka akses: upsert user role `editor` (PRD §4).
  if (decision === "approved") {
    await provisionGuestByEmail(request.email, request.name, user.id);
  }

  await insertAudit({
    actorId: user.id,
    action: "update",
    entity: "access_request",
    entityId: id,
    before: { status: "pending" },
    after: { status: decision, reason: reason || null },
  });

  revalidatePath(FROM);
  ok(decision === "approved" ? "Akses diberikan" : "Permintaan ditolak");
}

const roleSchema = z.enum(["owner", "editor"]);

export async function updateUserRoleAction(formData: FormData) {
  const actor = await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const parsed = roleSchema.safeParse(String(formData.get("role") ?? ""));
  if (!parsed.success) fail("Role tidak valid");

  const target = await getUserById(id);
  if (!target) fail("Pengguna tidak ditemukan");

  // PRD §4: owner terakhir tidak boleh diturunkan.
  if (target.role === "owner" && parsed.data !== "owner") {
    if ((await countOwners()) <= 1) fail("Owner terakhir tidak bisa diturunkan");
  }

  const after = await updateUserRole(id, parsed.data, actor.id);
  await insertAudit({
    actorId: actor.id,
    action: "update",
    entity: "user",
    entityId: id,
    before: { role: target.role },
    after: { role: after?.role ?? parsed.data },
  });

  revalidatePath(FROM);
  ok(`Role ${target.email} → ${parsed.data}`);
}

export async function revokeUserAction(formData: FormData) {
  const actor = await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const target = await getUserById(id);
  if (!target) fail("Pengguna tidak ditemukan");
  if (target.id === actor.id) fail("Tidak bisa mencabut akses sendiri");
  if (target.role === "owner" && (await countOwners()) <= 1) {
    fail("Owner terakhir tidak bisa dicabut");
  }

  const row = await revokeUser(id, actor.id);
  if (row) {
    await insertAudit({
      actorId: actor.id,
      action: "soft_delete",
      entity: "user",
      entityId: id,
      before: { email: row.email, role: row.role },
    });
  }

  revalidatePath(FROM);
  ok(`Akses ${target.email} dicabut`);
}
