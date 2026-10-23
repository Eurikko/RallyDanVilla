/**
 * RallyNaVila Username Utilities
 * Centralized logic for username validation, normalization, and conversion to
 * the internal Firebase Auth technical email identifier.
 */

export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

/**
 * Normalizes a raw username string by trimming whitespace and converting to lowercase.
 */
export function normalizeUsername(rawUsername: string): string {
  return rawUsername.trim().toLowerCase();
}

/**
 * Validates whether a username matches rules (3-20 characters, letters, numbers, and underscores only).
 */
export function isValidUsername(username: string): boolean {
  const normalized = normalizeUsername(username);
  return USERNAME_REGEX.test(normalized);
}

/**
 * Converts a normalized username to a internal technical email identifier for Firebase Auth.
 * 
 * IMPORTANT: This internal email is strictly for Firebase Auth authentication.
 * It is NEVER shown in the UI, NEVER saved in the public Firestore profile, and NEVER
 * presented to the user.
 */
export function usernameToTechnicalEmail(username: string): string {
  const normalized = normalizeUsername(username);
  return `${normalized}@rallynavila.internal`;
}
