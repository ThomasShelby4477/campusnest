/**
 * Text sanitization utilities.
 *
 * These are used to strip HTML before storing user/admin-supplied text in the
 * database (notification bodies, removal reasons, rejection reasons, etc.).
 *
 * Even though our current UI renders notification bodies as plain text, stored
 * HTML would become a stored XSS vector if the rendering ever changes.
 * Defense-in-depth: strip it at write time so it is never in the DB.
 */

/**
 * Strip all HTML tags and leading/trailing whitespace from a string.
 * HTML entities are left encoded (safe for plain-text rendering).
 *
 * @param input     The raw user/admin supplied string
 * @param maxLength Maximum character length after stripping (default 500)
 */
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (input === null || input === undefined) return ''

  return String(input)
    // Remove all HTML tags (including self-closing and malformed tags)
    .replace(/<[^>]*>/g, '')
    // Collapse multiple whitespace/newlines into a single space
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

/**
 * Sanitize a notification body — shorthand with 300-char cap appropriate
 * for push notifications and in-app notification banners.
 */
export function sanitizeNotificationBody(input: unknown): string {
  return sanitizeText(input, 300)
}

/**
 * Sanitize a reason string (rejection/removal reason) with a 1000-char cap.
 */
export function sanitizeReason(input: unknown): string {
  return sanitizeText(input, 1000)
}
