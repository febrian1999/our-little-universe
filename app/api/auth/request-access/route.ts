import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyIdToken } from "@/lib/auth/firebase-admin";
import {
  createAccessRequest,
  getPendingRequestByEmail,
} from "@/lib/db/repositories/access-requests";
import { getUserByEmail } from "@/lib/db/repositories/users";
import { assertSameOrigin, ForbiddenError } from "@/lib/security/origin";

const bodySchema = z.object({
  idToken: z.string().min(16).max(4096),
  name: z.string().trim().min(2).max(80).optional(),
  message: z.string().trim().max(500).optional(),
});

function failure(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** PRD §5.2: tamu bisa minta akses tanpa undangan; owner memutuskan (§4). */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof ForbiddenError) return failure("forbidden", 403);
    throw error;
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("bad_request", 400);

  let profile;
  try {
    profile = await verifyIdToken(parsed.data.idToken);
  } catch {
    return failure("invalid_token", 401);
  }

  const email = profile.email.toLowerCase();
  if (await getUserByEmail(email)) return failure("already_allowed", 409);
  if (await getPendingRequestByEmail(email)) return failure("already_pending", 409);

  const created = await createAccessRequest(
    {
      email,
      name: parsed.data.name || profile.name || email.split("@")[0],
      message: parsed.data.message || null,
    },
    null,
  );
  if (!created) return failure("already_pending", 409);

  return NextResponse.json({ ok: true });
}
