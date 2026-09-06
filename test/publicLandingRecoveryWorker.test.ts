import { describe, expect, it, vi } from 'vitest';
import { recoverNextLandingSubmission } from '@/lib/public-landing/recoveryWorker';

/**
 * Antes, uma submissão travada só voltava a andar se o MESMO visitante
 * reenviasse o formulário com a MESMA chave de idempotência — coisa que não
 * acontece, porque ele já leu "recebemos sua mensagem" e fechou a aba. Uma
 * instância que morresse no meio do processamento levava o contato junto,
 * sem erro visível em lugar nenhum.
 */

const config = { organizationId: 'org-1', boardId: 'board-1', stageId: 'stage-1' };

const claimedRow = {
  submission_id: 'submission-1',
  processing_token: 'token-1',
  attempt_count: 2,
  crm_contact_id: null,
  crm_deal_id: null,
  crm_activity_id: null,
  name: 'Marina',
  email: 'marina@bandeirantes.com.br',
  phone: null,
  company_name: 'Bandeirantes Log',
  message: 'Perdemos pedidos no WhatsApp.',
  subject: 'automacao',
  source_page: '/',
};

function fakeDb(claim: unknown, overrides: Record<string, unknown> = {}) {
  const calls: { name: string; args?: Record<string, unknown> }[] = [];
  const db = {
    from: () => {
      const builder: Record<string, unknown> = {};
      Object.assign(builder, {
        update: () => builder, eq: () => builder, select: () => builder,
        maybeSingle: async () => ({ data: { id: 'submission-1' }, error: null }),
      });
      return builder;
    },
    rpc: async (name: string, args?: Record<string, unknown>) => {
      calls.push({ name, args });
      if (name === 'claim_next_landing_submission') return { data: claim, error: null };
      if (name in overrides) return overrides[name] as { data: unknown; error: null };
      return { data: true, error: null };
    },
  };
  return { db: db as never, calls };
}

describe('landing submission recovery worker', () => {
  it('não faz nada quando não há submissão travada', async () => {
    const { db, calls } = fakeDb([]);
    const processCrm = vi.fn();

    expect(await recoverNextLandingSubmission({ db, config, processCrm })).toBe('empty');
    expect(processCrm).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
  });

  it('retoma a submissão de onde ela parou, sem recriar o que já existe', async () => {
    const { db } = fakeDb([{ ...claimedRow, crm_contact_id: 'contact-1', crm_deal_id: 'deal-1' }]);
    const processCrm = vi.fn(async (_db: unknown, input: { contactId: string | null; dealId: string | null }) => {
      expect(input.contactId).toBe('contact-1');
      expect(input.dealId).toBe('deal-1');
      return { contactId: 'contact-1', dealId: 'deal-1', activityId: 'activity-1' };
    });
    const notify = vi.fn(async () => ({ ok: true as const }));

    expect(await recoverNextLandingSubmission({ db, config, processCrm: processCrm as never, notify })).toBe('processed');
    expect(processCrm).toHaveBeenCalledOnce();
  });

  it('avisa o time ao concluir uma submissão que a requisição original não terminou', async () => {
    const { db } = fakeDb([claimedRow]);
    const processCrm = vi.fn(async () => ({ contactId: 'contact-1', dealId: 'deal-1', activityId: 'activity-1' }));
    const notify = vi.fn(async () => ({ ok: true as const }));

    await recoverNextLandingSubmission({ db, config, processCrm: processCrm as never, notify });

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ email: 'marina@bandeirantes.com.br' }));
  });

  it('devolve a posse quando a linha já não tem dados para processar', async () => {
    // A linha acabou de ser reivindicada por este worker. Deixá-la em
    // 'processing' a travaria de novo até o próximo timeout, em ciclo.
    const { db, calls } = fakeDb([{ ...claimedRow, email: null, message: null }]);
    const processCrm = vi.fn();

    expect(await recoverNextLandingSubmission({ db, config, processCrm })).toBe('failed_terminal');
    expect(processCrm).not.toHaveBeenCalled();
    expect(calls[1]).toMatchObject({
      name: 'fail_landing_submission',
      args: { p_processing_token: 'token-1', p_retryable: false },
    });
  });

  it('um assunto desconhecido não derruba a retomada', async () => {
    const { db } = fakeDb([{ ...claimedRow, subject: 'assunto-que-nao-existe-mais' }]);
    const processCrm = vi.fn(async (_db: unknown, input: { subject: string }) => {
      expect(input.subject).toBe('outro');
      return { contactId: 'contact-1', dealId: 'deal-1', activityId: 'activity-1' };
    });
    const notify = vi.fn(async () => ({ ok: true as const }));

    expect(await recoverNextLandingSubmission({ db, config, processCrm: processCrm as never, notify })).toBe('processed');
  });
});
