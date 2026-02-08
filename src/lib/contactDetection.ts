/**
 * Detects potential contact information in a message.
 * Returns true if phone numbers, emails, or social handles are found.
 * Does NOT block — just signals for a gentle tooltip.
 */

const PHONE_REGEX = /(\+?\d[\d\s\-().]{7,}\d)/;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const SOCIAL_REGEX = /(?:@[\w.]{3,}|(?:instagram|facebook|telegram|whatsapp|viber|tiktok)[\s.:/@]*[\w.]+)/i;
const URL_REGEX = /https?:\/\/[^\s]+/i;

export function containsContactInfo(text: string): boolean {
  return (
    PHONE_REGEX.test(text) ||
    EMAIL_REGEX.test(text) ||
    SOCIAL_REGEX.test(text) ||
    URL_REGEX.test(text)
  );
}

export function getContactWarning(): string {
  return "💡 For your safety and support, we recommend booking through the app. In-app bookings include verified trainers, reviews, and payment protection.";
}
