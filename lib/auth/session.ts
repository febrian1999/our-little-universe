import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "__Host-olu_session";
export const SESSION_TTL_SECONDS = 5 * 24 * 60 * 60;

export type SessionPayload = {
  sub: string;
  iat: number;
  exp: number;
  jti: string;
};

function secret(explicit?: string) {
  const value = explicit ?? process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET belum diisi (minimal 32 karakter)");
  }
  return value;
}

function sign(body: string, key: string) {
  return createHmac("sha256", key).update(body).digest("base64url");
}

/** Nilai cookie baru setiap login (mencegah session fixation). */
export function createSessionToken(
  userId: string,
  options: { now?: number; key?: string } = {},
) {
  const key = secret(options.key);
  const iat = Math.floor((options.now ?? Date.now()) / 1000);
  const payload: SessionPayload = {
    sub: userId,
    iat,
    exp: iat + SESSION_TTL_SECONDS,
    jti: randomUUID(),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, key)}`;
}

export function verifySessionToken(
  token: string,
  options: { now?: number; key?: string } = {},
): SessionPayload | null {
  const key = secret(options.key);
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1), "base64url");
  const expected = Buffer.from(sign(body, key), "base64url");
  if (given.length !== expected.length) return null;
  if (!timingSafeEqual(given, expected)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;

  const { sub, iat, exp, jti } = payload as Partial<SessionPayload>;
  if (typeof sub !== "string" || sub.length === 0) return null;
  if (typeof iat !== "number" || typeof exp !== "number") return null;
  if (typeof jti !== "string") return null;

  const now = Math.floor((options.now ?? Date.now()) / 1000);
  if (exp <= now) return null;

  return { sub, iat, exp, jti };
}
