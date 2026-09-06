import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildLandingNotificationText, notifyLandingSubmission } from '@/lib/public-landing/notification';

const mocks = vi.hoisted(() => ({ resendSend: vi.fn() }));
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mocks.resendSend };
  },
}));

const input = {
  submissionId: 'submission-1', name: 'Pessoa Teste', companyName: 'Empresa Teste',
  email: 'pessoa@example.invalid', phone: '+5511999999999', subject: 'crm',
  message: 'Mensagem de teste.', sourcePage: '/',
};

afterEach(() => {
  mocks.resendSend.mockReset();
  vi.unstubAllEnvs();
});

describe('landing notification', () => {
  it('monta conteúdo operacional sem campos sensíveis', () => {
    const text = buildLandingNotificationText(input, new Date('2026-01-01T00:00:00.000Z'));
    expect(text).toContain('Pessoa Teste');
    expect(text).toContain('Mensagem de teste.');
    expect(text).toContain('Submission: submission-1');
    expect(text).not.toContain('processing_token');
    expect(text).not.toContain('rate-limit');
    expect(text).not.toContain('RESEND_API_KEY');
  });

  it('usa a idempotência oficial do SDK Resend', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    vi.stubEnv('LANDING_NOTIFICATION_FROM', 'staging@hgasystems.com.br');
    vi.stubEnv('LANDING_NOTIFICATION_TO', 'hgasystems.comercial@gmail.com');
    mocks.resendSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    await notifyLandingSubmission(input);

    expect(mocks.resendSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['hgasystems.comercial@gmail.com'] }),
      { idempotencyKey: 'landing-notification-submission-1' },
    );
  });

  it('não lança, e devolve um resultado que diz se vale a pena repetir', async () => {
    // Sem configuração não adianta insistir: é problema de deploy, e uma fila
    // que repete para sempre esconde o defeito em vez de expô-lo.
    const missingConfig = await notifyLandingSubmission(input);
    expect(missingConfig).toEqual({ ok: false, retryable: false, code: 'CONFIG_MISSING' });

    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    vi.stubEnv('LANDING_NOTIFICATION_FROM', 'staging@hgasystems.com.br');
    vi.stubEnv('LANDING_NOTIFICATION_TO', 'hgasystems.comercial@gmail.com');
    mocks.resendSend.mockRejectedValue(new Error('secret should not be logged'));
    const exception = await notifyLandingSubmission(input);
    expect(exception).toMatchObject({ ok: false, retryable: true });
    expect(JSON.stringify(exception)).not.toContain('secret should not be logged');
  });

  it('não repete erro de conteúdo, que nenhuma tentativa conserta', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    vi.stubEnv('LANDING_NOTIFICATION_FROM', 'staging@hgasystems.com.br');
    vi.stubEnv('LANDING_NOTIFICATION_TO', 'hgasystems.comercial@gmail.com');
    mocks.resendSend.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'bad address' } });

    expect(await notifyLandingSubmission(input)).toEqual({ ok: false, retryable: false, code: 'validation_error' });
  });
});
