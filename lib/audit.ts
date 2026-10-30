import type { auditLogs } from "@/lib/db/schema";

type AuditRow = typeof auditLogs.$inferInsert;
type AuditAction = NonNullable<AuditRow["action"]>;
type AuditEntity = NonNullable<AuditRow["entity"]>;

export type AuditInput = {
  actorId: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  chapterId?: string | null;
  before?: unknown;
  after?: unknown;
};

// Kunci yang tidak pernah boleh masuk audit log (schema.md §5, PRD §11).
const SECRET_KEY = /secret|token|password|api[-_]?key|private[-_]?key|authorization/i;

/**
 * Membersihkan payload audit secara rekursif. Nilai rahasia dibuang, bukan
 * disamarkan, supaya tidak ada salinan yang tidak disadari.
 */
export function redactSecrets(value: unknown, depth = 0): unknown {
  if (depth > 6) return null;
  if (Array.isArray(value)) {
    return value.map((v) => redactSecrets(v, depth + 1));
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      if (SECRET_KEY.test(key)) continue;
      out[key] = redactSecrets(v, depth + 1);
    }
    return out;
  }
  return value;
}

/** Bentuk baris `audit_logs` yang siap di-insert (schema.md §8). */
export function buildAuditRow(input: AuditInput): AuditRow {
  return {
    actorId: input.actorId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    chapterId: input.chapterId ?? null,
    before: input.before === undefined ? null : redactSecrets(input.before),
    after: input.after === undefined ? null : redactSecrets(input.after),
  };
}
