import { z } from 'zod';
import { normalizeEmail, normalizePhone, normalizeText } from '@/lib/public-api/sanitize';
import { LANDING_SUBJECTS } from './config';

const allowedPaths = new Set(['/', '/contato', '/solucoes/crm', '/solucoes/automacao', '/solucoes/diagnostico']);

export const LandingPayloadSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  empresa: z.string().trim().max(160).optional().or(z.literal('')),
  email: z.string().trim().email().max(254),
  whatsapp: z.string().trim().max(40).optional().or(z.literal('')),
  assunto: z.enum(LANDING_SUBJECTS),
  mensagem: z.string().trim().min(5).max(5000),
  source_page: z.string().trim().max(80),
  honeypot: z.string().max(200).optional().or(z.literal('')),
}).strict().superRefine((value, ctx) => {
  if (!allowedPaths.has(value.source_page)) {
    ctx.addIssue({ code: 'custom', path: ['source_page'], message: 'source_page inválido' });
  }
});

export type LandingPayload = z.infer<typeof LandingPayloadSchema>;

export function normalizeLandingPayload(payload: LandingPayload) {
  return {
    name: normalizeText(payload.nome)!,
    companyName: normalizeText(payload.empresa),
    email: normalizeEmail(payload.email)!,
    phone: normalizePhone(payload.whatsapp),
    subject: payload.assunto,
    message: normalizeText(payload.mensagem)!,
    sourcePage: payload.source_page,
    honeypot: payload.honeypot?.trim() ?? '',
  };
}
