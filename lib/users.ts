import type { AppUser } from "@/types";

let cached: AppUser[] | null = null;

/**
 * APP_USERS_BASE64 is a base64-encoded JSON array of
 * {email, passwordHash, role, clientSlug?, name?}.
 *
 * Base64 is used (rather than raw JSON) because bcrypt hashes contain `$`
 * characters that Next.js's .env loader interprets as variable
 * interpolation (e.g. `$2b$10$...` gets `$2b` and `$10` silently stripped),
 * corrupting the hash. Build the value with `npm run build-app-users`.
 */
export function getAppUsers(): AppUser[] {
  if (cached) return cached;

  const raw = process.env.APP_USERS_BASE64;
  if (!raw) {
    throw new Error(
      "APP_USERS_BASE64 env var is not set. See .env.example for how to generate it."
    );
  }

  cached = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as AppUser[];
  return cached;
}
