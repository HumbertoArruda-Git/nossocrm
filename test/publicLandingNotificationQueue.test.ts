import { describe, expect, it, vi } from 'vitest';
import {
  deliverNextLandingNotification,
  recordLandingNotificationResult,
  type LandingNotificationQueueDb,
} from '@/lib/public-landing/notificationQueue';

/**
 * O aviso ao time é a única coisa que transforma um lead gravado num lead
 * atendido. Antes, uma falha do provedor virava linha de log e ninguém ficava
 * sabendo: o contato existia no CRM e a equipe não tinha como saber disso.
 * A fila existe para que a falha tenha consequência — uma nova tentativa.
 */

const claimedRow = {
  submission_id: 'submission-1',
  attempt_count: 1,
  name: 'Marina',
  email: 'marina@bandeirantes.com.br',
  phone: null,
  company_name: 'Bandeirantes Log',
  message: 'Perdemos pedidos no WhatsApp.',
  subject: 'automacao',
  source_page: '/',
};

function fakeDb(claim: unknown) {
  const calls: { name: string; args?: Record<string, unknown> }[] = [];
  const db: LandingNotificationQueueDb = {
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === 'claim_landing_notification') return { data: claim, error: null };
      return { data: true, error: null };
    },
  };
  return { db, calls };
}

describe('landing notification queue', () => {
  it('não faz nada quando não há aviso pendente', async () => {
    const { db, calls } = fakeDb([]);
    const notify = vi.fn();

    expect(await deliverNextLandingNotification({ db, organizationId: 'org-1', notify })).toBe('empty');
    expect(notify).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
  });

  it('marca como notificada quando o envio dá certo', async () => {
    const { db, calls } = fakeDb([claimedRow]);
    const notify = vi.fn(async () => ({ ok: true as const }));

    expect(await deliverNextLandingNotification({ db, organizationId: 'org-1', notify })).toBe('delivered');
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({
      submissionId: 'submission-1', email: 'marina@bandeirantes.com.br', name: 'Marina',
    }));
    expect(calls.map((call) => call.name)).toEqual(['claim_landing_notification', 'complete_landing_notification']);
  });

  it('devolve a falha ao banco para que a próxima tentativa aconteça', async () => {
    const { db, calls } = fakeDb([claimedRow]);
    const notify = vi.fn(async () => ({ ok: false as const, retryable: true, code: 'NETWORK_ERROR' }));

    expect(await deliverNextLandingNotification({ db, organizationId: 'org-1', notify })).toBe('failed_retryable');
    expect(calls[1]).toEqual({
      name: 'fail_landing_notification',
      args: { p_submission_id: 'submission-1', p_error_code: 'NETWORK_ERROR', p_retryable: true },
    });
  });

  it('encerra a fila quando os dados já foram anonimizados', async () => {
    // Notificar sem e-mail e sem mensagem seria mandar um aviso vazio, e a linha
    // voltaria à fila para sempre. Aqui ela sai de circulação de vez.
    const { db, calls } = fakeDb([{ ...claimedRow, email: null, message: null }]);
    const notify = vi.fn();

    expect(await deliverNextLandingNotification({ db, organizationId: 'org-1', notify })).toBe('failed_terminal');
    expect(notify).not.toHaveBeenCalled();
    expect(calls[1]?.args).toMatchObject({ p_retryable: false, p_error_code: 'PAYLOAD_UNAVAILABLE' });
  });

  it('registra sucesso e falha pelo mesmo caminho usado na requisição do visitante', async () => {
    const { db, calls } = fakeDb([]);

    await recordLandingNotificationResult(db, 'submission-9', { ok: true });
    await recordLandingNotificationResult(db, 'submission-9', { ok: false, retryable: false, code: 'CONFIG_MISSING' });

    expect(calls.map((call) => call.name)).toEqual(['complete_landing_notification', 'fail_landing_notification']);
  });
});
