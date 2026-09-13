import { randomBytes, createHash } from "crypto";

/**
 * Shared primitive for invite links and magic sign-in links: a random raw
 * token is embedded in the emailed URL, and only its SHA-256 hash is ever
 * persisted. Losing the DB never exposes usable tokens; the raw value is
 * never logged or stored.
 */
export function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const MAGIC_LINK_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const SESSION_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days, sliding
export const SESSION_REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000; // bump at most once/day

export function expiryFromNow(ttlMs: number): Date {
  return new Date(Date.now() + ttlMs);
}

export function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}
