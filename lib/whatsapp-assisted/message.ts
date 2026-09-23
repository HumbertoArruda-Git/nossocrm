import { COMMERCIAL_MESSAGE_TEMPLATES } from '@/features/boards/data/commercialMessageTemplates';

const templateText = (id: string) =>
  COMMERCIAL_MESSAGE_TEMPLATES.find((template) => template.id === id)?.text ?? '';

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

/** Without a contact name the greeting just loses it ("Oi, [Nome]." -> "Oi."). */
function fillKnown(text: string, contactName: string, companyName: string): string {
  const named = contactName
    ? text.replaceAll('[Nome]', contactName)
    : text.replace(/,?\s*\[Nome\]/g, '');
  return named.replaceAll('[Empresa]', companyName);
}

export function assistedMessage(
  mode: 'initial_sent' | 'follow_up_sent',
  customFields: Record<string, unknown> | undefined,
  contactName: string,
  companyName: string,
  followUpNumber = 1
): string {
  const initial = customFields?.mensagemInicial;
  // The Prospector's own message is shown as written: the user reviews it before sending.
  if (mode === 'initial_sent' && typeof initial === 'string' && initial.trim()) {
    return fillKnown(initial, contactName, companyName);
  }
  const template = mode === 'initial_sent'
    ? templateText('mensagem-inicial')
    : templateText(followUpNumber >= 2 ? 'follow-up-2' : 'follow-up-1');
  return withoutUnfilledPlaceholders(fillKnown(template, contactName, companyName));
}
