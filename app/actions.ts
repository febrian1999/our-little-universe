"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { safeNextPath } from "@/lib/security/paths";
import { recordVisit } from "@/lib/visits";

/**
 * Tombol "Buka Gerbang" di landing: mencatat `gate_open` sebelum masuk
 * (PRD §10.2). Redirect tetap ke path internal yang sudah divalidasi.
 */
export async function openGateAction(formData: FormData) {
  const next = safeNextPath(formData.get("next")) ?? "/login";
  const user = await getSession();

  await recordVisit({
    userId: user?.id ?? null,
    action: "gate_open",
    path: next.split("?")[0],
  });

  redirect(next);
}
