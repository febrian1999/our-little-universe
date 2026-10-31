import { buildAuditRow, type AuditInput } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

/** Audit append-only (PRD §11, D-034). Tidak ada update/delete di sini. */
export async function insertAudit(input: AuditInput) {
  await getDb().insert(auditLogs).values(buildAuditRow(input));
}
