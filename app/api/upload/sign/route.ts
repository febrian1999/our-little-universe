import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, hasMinRole } from "@/lib/auth";
import { buildPhotoUploadTicket } from "@/lib/media/cloudinary";
import { ForbiddenError, assertSameOrigin } from "@/lib/security/origin";

const bodySchema = z.object({ chapterId: z.uuid() }).strict();

/** Tiket upload foto bertanda tangan (PRD §5.4). Guest ditolak di server. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Origin tidak cocok" }, { status: 403 });
    }
    throw error;
  }

  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  if (!hasMinRole(user.role, "editor")) {
    return NextResponse.json({ error: "Hanya editor" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "chapterId tidak valid" }, { status: 400 });
  }

  try {
    return NextResponse.json(buildPhotoUploadTicket(parsed.data.chapterId));
  } catch {
    return NextResponse.json(
      { error: "Cloudinary belum dikonfigurasi" },
      { status: 503 },
    );
  }
}
