import { describe, expect, it } from 'vitest';
import { LandingPayloadSchema } from '@/lib/public-landing/validation';

const validPayload = {
  nome: 'Pessoa Teste',
  empresa: 'Empresa Teste',
  email: 'pessoa@example.invalid',
  whatsapp: '+55 11 99999-0000',
  assunto: 'crm',
  mensagem: 'Gostaria de conhecer o CRM.',
  source_page: '/solucoes/crm',
};

describe('LandingPayloadSchema', () => {
  it('accepts the controlled public form payload', () => {
    expect(LandingPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it('accepts the silent honeypot field', () => {
    expect(LandingPayloadSchema.safeParse({ ...validPayload, honeypot: 'filled-by-bot' }).success).toBe(true);
  });

  it('rejects arbitrary subject values and unknown fields', () => {
    expect(LandingPayloadSchema.safeParse({ ...validPayload, assunto: 'free text' }).success).toBe(false);
    expect(LandingPayloadSchema.safeParse({ ...validPayload, extra: 'unexpected' }).success).toBe(false);
  });

  it('rejects absolute URLs, query strings and fragments as source_page', () => {
    for (const source_page of ['https://example.com/', '/solucoes/crm?email=x', '/solucoes/crm#contact']) {
      expect(LandingPayloadSchema.safeParse({ ...validPayload, source_page }).success).toBe(false);
    }
  });

  it('enforces field size and message requirements', () => {
    expect(LandingPayloadSchema.safeParse({ ...validPayload, nome: 'x' }).success).toBe(false);
    expect(LandingPayloadSchema.safeParse({ ...validPayload, mensagem: 'x' }).success).toBe(false);
    expect(LandingPayloadSchema.safeParse({ ...validPayload, mensagem: 'x'.repeat(5001) }).success).toBe(false);
  });
});
