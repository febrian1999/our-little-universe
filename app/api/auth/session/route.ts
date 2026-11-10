import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyIdToken } from "@/lib/auth/firebase-admin";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";
import { getPrimaryChapter } from "@/lib/db/repositories/chapters";
import { redeemInvite } from "@/lib/db/repositories/invites";
import { provisionUser } from "@/lib/db/repositories/users";
import { recordVisit } from "@/lib/visits";
import { assertSameOrigin, ForbiddenError } from "@/lib/security/origin";
import { safeNextPath } from "@/lib/security/paths";

const bodySchema = z.object({
  idToken: z.string().min(16).max(4096),
  next: z.string().max(512).optional(),
  invite: z.string().min(1).max(64).optional(),
});

function failure(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

async function defaultNext() {
  const chapter = await getPrimaryChapter();
  return chapter ? `/${chapter.slug}` : "/";
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof ForbiddenError) return failure("forbidden", 403);
    throw error;
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("bad_request", 400);

  const { idToken, invite } = parsed.data;

  let profile;
  try {
    profile = await verifyIdToken(idToken);
  } catch {
    return failure("invalid_token", 401);
  }

  let userId: string;
  if (invite) {
    const redeemed = await redeemInvite(invite.trim().toUpperCase(), profile);
    if (!redeemed) return failure("invalid_invite", 400);
    userId = redeemed.id;
  } else {
    const provisioned = await provisionUser(profile);
    if (!provisioned.isAllowed) return failure("not_allowed", 403);
    userId = provisioned.id;
  }

  const redirectTo = safeNextPath(parsed.data.next) ?? (await defaultNext());

  await recordVisit({ userId, action: "login", path: "/login" });

  const response = NextResponse.json({ ok: true, redirectTo });
  response.cookies.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof ForbiddenError) return failure("forbidden", 403);
    throw error;
  }

  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  const payload = token ? verifySessionToken(token) : null;
  if (payload) {
    await recordVisit({ userId: payload.sub, action: "logout", path: "/" });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
