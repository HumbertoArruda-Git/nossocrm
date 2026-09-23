import { COMMERCIAL_MESSAGE_TEMPLATES } from '@/features/boards/data/commercialMessageTemplates';

const templateText = (id: string) =>
  COMMERCIAL_MESSAGE_TEMPLATES.find((template) => template.id === id)?.text ?? '';

const SENDER_PLACEHOLDER = /\[\s*seu\s+nome\s*\]/i;
const SENDER_PLACEHOLDERS = /\[\s*seu\s+nome\s*\]/gi;

/**
 * The shared templates keep [placeholders] for manual editing elsewhere. Here nothing fills
 * them, so any sentence that still holds one is dropped instead of reaching the lead.
 */
function withoutUnfilledPlaceholders(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => !/\[[^\]]+\]/.test(sentence))
      .join(' '))
    .filter((paragraph) => paragraph.trim())
    .join('\n\n');
}

/** Contacts created from a confirmed send are named after their number: that is not a name. */
function personName(name: string): string {
  const trimmed = name.trim();
  return /^[\d\s+().-]*$/.test(trimmed) ? '' : trimmed;
}

/** Without a contact name the greeting just loses it ("Oi, [Nome]." -> "Oi."). */
function fillKnown(text: string, contactName: string, companyName: string): string {
  const name = personName(contactName);
  const named = name ? text.replaceAll('[Nome]', name) : text.replace(/,?\s*\[Nome\]/g, '');
  return named.replaceAll('[Empresa]', companyName);
}

/**
 * The Prospector signs some messages with "[seu nome]" in any casing. It becomes the logged-in
 * user's name; without one the marker leaves the line, and a line left empty goes with it.
 */
export function fillSenderName(text: string, senderName: string): string {
  const name = senderName.trim();
  if (name) return text.replace(SENDER_PLACEHOLDERS, name);
  return text
    .split('\n')
    .flatMap((line) => {
      if (!SENDER_PLACEHOLDER.test(line)) return [line];
      const cleaned = line
        .replace(/[ \t]*\[\s*seu\s+nome\s*\][ \t]*,?/gi, ' ')
        .replace(/[ \t]+([,.;:!?])/g, '$1')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/[\s,;:—–-]+$/, '')
        .trim();
      return cleaned ? [cleaned] : [];
    })
    .join('\n');
}

/** A name the user gave their profile; the e-mail is never used as a signature. */
export function senderDisplayName(
  profile?: { first_name?: string | null; last_name?: string | null; nickname?: string | null } | null
): string {
  const fullName = [profile?.first_name, profile?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ');
  return fullName || profile?.nickname?.trim() || '';
}

export function assistedMessage(
  mode: 'initial_sent' | 'follow_up_sent',
  customFields: Record<string, unknown> | undefined,
  contactName: string,
  companyName: string,
  followUpNumber = 1,
  senderName = ''
): string {
  const initial = customFields?.mensagemInicial;
  // The Prospector's own message is shown as written: the user reviews it before sending.
  if (mode === 'initial_sent' && typeof initial === 'string' && initial.trim()) {
    return fillSenderName(fillKnown(initial, contactName, companyName), senderName);
  }
  const template = mode === 'initial_sent'
    ? templateText('mensagem-inicial')
    : templateText(followUpNumber >= 2 ? 'follow-up-2' : 'follow-up-1');
  return withoutUnfilledPlaceholders(fillSenderName(fillKnown(template, contactName, companyName), senderName));
}
