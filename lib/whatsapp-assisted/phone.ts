import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { isE164, normalizePhoneE164 } from '@/lib/phone';

/** The generic normalizer preserves doubtful input for editing; sending must be stricter. */
export function validatedWhatsAppPhone(input?: string | null): string | null {
  const normalized = normalizePhoneE164(input);
  if (!isE164(normalized)) return null;
  const parsed = parsePhoneNumberFromString(normalized);
  if (!parsed?.isValid()) return null;
  if (parsed.country === 'BR' && !/^55\d{10,11}$/.test(parsed.number.slice(1))) return null;
  return parsed.number.slice(1);
}

export function whatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
