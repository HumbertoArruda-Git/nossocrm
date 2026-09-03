import { describe, expect, it, vi } from 'vitest';
import { handleLandingSubmission } from '@/lib/public-landing/service';
import { processLandingCrm } from '@/lib/public-landing/crm';

const config = {
  organizationId: '00000000-0000-0000-0000-000000000001',
  boardId: '00000000-0000-0000-0000-000000000002',
  stageId: '00000000-0000-0000-0000-000000000003',
  rateLimitSecret: 'x'.repeat(32),
  rateLimitMax: 5,
  rateLimitWindowMinutes: 15,
};

const payload = {
  nome: 'Pessoa Teste', empresa: '', email: 'pessoa@example.invalid', whatsapp: '',
  assunto: 'crm', mensagem: 'Mensagem de teste válida.', source_page: '/',
};

function request(key = '00000000-0000-4000-8000-000000000001', body = payload) {
  return new Request('http://localhost/api/public/landing-contact', {
    method: 'POST', headers: { 'Idempotency-Key': key, 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

function fakeDb(state: { existing: any; claim?: any; completed?: boolean; failed?: boolean }) {
  return {
    from(table: string) {
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        gte: () => builder,
        insert: (value: any) => { builder.operation = 'insert'; builder.value = value; return builder; },
        update: (value: any) => { builder.operation = 'update'; builder.value = value; return builder; },
        maybeSingle: async () => {
          if (builder.operation === 'insert') {
            state.existing = { id: 'submission-1', status: 'pending', ...valueToSubmission(builder.value) };
            return { data: { id: 'submission-1' }, error: null };
          }
          if (builder.operation === 'update') {
            Object.assign(state.existing, builder.value);
            return { data: { id: state.existing.id }, error: null };
          }
          return { data: state.existing, error: null };
        },
      };
      void table;
      return builder;
    },
    rpc: async (name: string) => {
      if (name === 'claim_landing_submission') return { data: [state.claim ?? { submission_id: 'submission-1', claim_status: 'in_progress', processing_token: null }], error: null };
      if (name === 'complete_landing_submission') {
        if (state.completed) state.existing.status = 'processed';
        return { data: state.completed ?? false, error: null };
      }
      if (name === 'fail_landing_submission') return { data: state.failed ?? true, error: null };
      return { data: null, error: null };
    },
  } as any;
}

function valueToSubmission(value: any) {
  return { name: value.name, email: value.email, phone: value.phone, company_name: value.company_name, message: value.message, subject: value.subject, source_page: value.source_page };
}

function deps(state: any, processCrm = vi.fn()) {
  return {
    getConfig: () => config,
    createDb: () => fakeDb(state),
    rateLimit: vi.fn(async () => ({ allowed: true as const })),
    processCrm,
  };
}

describe('landing submission service', () => {
  it('recovers an activity created before crm_activity_id was persisted', async () => {
    const recoveredDb: any = {
      from(table: string) {
        const builder: any = {
          select: () => builder, eq: () => builder, is: () => builder, ilike: () => builder,
          limit: () => builder, or: () => builder, order: () => builder,
          maybeSingle: async () => {
            if (table === 'crm_companies') return { data: null, error: null };
            if (table === 'contacts') return { data: { id: 'contact-1', name: 'Pessoa Teste', email: payload.email, phone: null }, error: null };
            if (table === 'deals') return { data: { id: 'deal-1' }, error: null };
            if (table === 'activities') return { data: { id: 'activity-existing' }, error: null };
            return { data: null, error: null };
          },
          insert: () => builder, update: () => builder, single: async () => ({ data: { id: table === 'contacts' ? 'contact-1' : 'deal-1' }, error: null }),
        };
        return builder;
      },
    };
    const result = await processLandingCrm(recoveredDb, {
      organizationId: config.organizationId, boardId: config.boardId, stageId: config.stageId,
      submissionId: 'submission-1', contactId: null, dealId: null, activityId: null,
      name: 'Pessoa Teste', email: payload.email, phone: null, companyName: null,
      subject: 'crm', message: payload.mensagem,
    });
    expect(result.activityId).toBe('activity-existing');
  });

  it('completes a new submission and persists CRM progress', async () => {
    const state: any = { existing: null, claim: { submission_id: 'submission-1', claim_status: 'claimed', processing_token: 'token-1', crm_contact_id: null, crm_deal_id: null, crm_activity_id: null }, completed: true };
    const processCrm = vi.fn(async (_db, _input, progress) => {
      await progress('crm_contact_id', 'contact-1'); await progress('crm_deal_id', 'deal-1'); await progress('crm_activity_id', 'activity-1');
      return { contactId: 'contact-1', dealId: 'deal-1', activityId: 'activity-1' };
    });
    const notify = vi.fn(async () => undefined);
    const result = await handleLandingSubmission(request(), { ...deps(state, processCrm), notify });
    expect(result.status).toBe(201);
    expect(state.existing).toMatchObject({ crm_contact_id: 'contact-1', crm_deal_id: 'deal-1', crm_activity_id: 'activity-1' });
    expect(notify).toHaveBeenCalledOnce();
  });

  it('replays processed without rate-limit or CRM calls', async () => {
    const state: any = { existing: { id: 'submission-1', status: 'processed', name: 'Pessoa Teste', email: payload.email, phone: null, company_name: null, message: payload.mensagem, subject: 'crm', source_page: '/' } };
    const rateLimit = vi.fn(); const processCrm = vi.fn();
    const notify = vi.fn();
    const result = await handleLandingSubmission(request(), { ...deps(state, processCrm), rateLimit, notify });
    expect(result.status).toBe(200); expect(rateLimit).not.toHaveBeenCalled(); expect(processCrm).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('mantém sucesso quando a notificação falha', async () => {
    const state: any = { existing: null, claim: { submission_id: 'submission-1', claim_status: 'claimed', processing_token: 'token-1', crm_contact_id: null, crm_deal_id: null, crm_activity_id: null }, completed: true };
    const processCrm = vi.fn(async () => ({ contactId: 'contact-1', dealId: 'deal-1', activityId: 'activity-1' }));
    const notify = vi.fn(async () => { throw new Error('provider unavailable'); });
    const result = await handleLandingSubmission(request(), { ...deps(state, processCrm), notify });
    expect(result.status).toBe(201);
    expect(state.existing.status).toBe('processed');
  });

  it('returns 202 for active processing', async () => {
    const state: any = { existing: { id: 'submission-1', status: 'processing', name: 'Pessoa Teste', email: payload.email, phone: null, company_name: null, message: payload.mensagem, subject: 'crm', source_page: '/' } };
    expect((await handleLandingSubmission(request(), deps(state))).status).toBe(202);
  });

  it('returns 202 and never overwrites after lease loss', async () => {
    const state: any = { existing: null, claim: { submission_id: 'submission-1', claim_status: 'claimed', processing_token: 'stale-token', crm_contact_id: null, crm_deal_id: null, crm_activity_id: null }, completed: false };
    const processCrm = vi.fn(async (_db, _input, progress) => { await progress('crm_contact_id', 'contact-1'); return { contactId: 'contact-1', dealId: 'deal-1', activityId: 'activity-1' }; });
    const result = await handleLandingSubmission(request(), deps(state, processCrm));
    expect(result.status).toBe(202);
  });

  it('resumes after contact and deal failures without recreating persisted IDs', async () => {
    const state: any = { existing: { id: 'submission-1', status: 'failed_retryable', name: 'Pessoa Teste', email: payload.email, phone: null, company_name: null, message: payload.mensagem, subject: 'crm', source_page: '/', crm_contact_id: 'contact-1', crm_deal_id: 'deal-1', crm_activity_id: null }, claim: { submission_id: 'submission-1', claim_status: 'claimed', processing_token: 'token-2', crm_contact_id: 'contact-1', crm_deal_id: 'deal-1', crm_activity_id: null }, completed: true };
    const processCrm = vi.fn(async (_db, input) => { expect(input.contactId).toBe('contact-1'); expect(input.dealId).toBe('deal-1'); return { contactId: 'contact-1', dealId: 'deal-1', activityId: 'activity-1' }; });
    const result = await handleLandingSubmission(request(), deps(state, processCrm));
    expect(result.status).toBe(201); expect(processCrm).toHaveBeenCalledOnce();
  });

  it('handles retryable and terminal states', async () => {
    const base = { id: 'submission-1', name: 'Pessoa Teste', email: payload.email, phone: null, company_name: null, message: payload.mensagem, subject: 'crm', source_page: '/' };
    expect((await handleLandingSubmission(request(), deps({ existing: { ...base, status: 'failed_retryable', next_retry_at: new Date(Date.now() + 60_000).toISOString() }, claim: { submission_id: 'submission-1', claim_status: 'retry_not_due', processing_token: null } }))).status).toBe(409);
    expect((await handleLandingSubmission(request('00000000-0000-4000-8000-000000000002', payload), deps({ existing: { ...base, status: 'failed_terminal' } }))).status).toBe(422);
  });

  it('accepts honeypot silently and does not call CRM', async () => {
    const state: any = { existing: null }; const processCrm = vi.fn();
    const result = await handleLandingSubmission(request('00000000-0000-4000-8000-000000000003', { ...payload, honeypot: 'bot' }), deps(state, processCrm));
    expect(result.status).toBe(202); expect(processCrm).not.toHaveBeenCalled(); expect(state.existing).toBeNull();
  });

  it('returns rate limit response without PII', async () => {
    const state: any = { existing: null }; const result = await handleLandingSubmission(request('00000000-0000-4000-8000-000000000004'), { ...deps(state), rateLimit: vi.fn(async () => ({ allowed: false as const })) });
    expect(result.status).toBe(429); expect(JSON.stringify(result.body)).not.toContain(payload.email); expect(JSON.stringify(result.body)).not.toContain(payload.nome);
  });
});
