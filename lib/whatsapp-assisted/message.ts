import { COMMERCIAL_MESSAGE_TEMPLATES } from '@/features/boards/data/commercialMessageTemplates';

export function assistedMessage(
  mode: 'initial_sent' | 'follow_up_sent',
  customFields: Record<string, unknown> | undefined,
  contactName: string,
  companyName: string
): string {
  const initial = customFields?.mensagemInicial;
  const source = mode === 'initial_sent'
    ? (typeof initial === 'string' && initial.trim()) || COMMERCIAL_MESSAGE_TEMPLATES[0].text
    : COMMERCIAL_MESSAGE_TEMPLATES[1].text;
  return source.replaceAll('[Nome]', contactName || 'contato')
    .replaceAll('[Empresa]', companyName);
}
