import { desc, eq } from "drizzle-orm";
import { buildAuditRow, type AuditInput } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { auditLogs, users, type auditEntity } from "@/lib/db/schema";

export type AuditEntity = (typeof auditEntity.enumValues)[number];

/** Audit append-only (PRD §11, D-034). Tidak ada update/delete di sini. */
export async function insertAudit(input: AuditInput) {
  await getDb().insert(auditLogs).values(buildAuditRow(input));
}

export async function listAudit(
  filter: { entity?: AuditEntity | null; offset?: number; limit?: number } = {},
) {
  const limit = filter.limit ?? 50;
  const rows = await getDb()
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      createdAt: auditLogs.createdAt,
      actorName: users.displayName,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .where(filter.entity ? eq(auditLogs.entity, filter.entity) : undefined)
    .orderBy(desc(auditLogs.id))
    .limit(limit + 1)
    .offset(filter.offset ?? 0);

  return { rows: rows.slice(0, limit), hasNext: rows.length > limit };
}
