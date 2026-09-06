import type { SupabaseClient } from '@supabase/supabase-js';
import { createStaticAdminClient } from '@/lib/supabase/server';
import { getLandingConfig } from './config';
import { enforceLandingRateLimit } from './rate-limit';
import { LandingPayloadSchema, normalizeLandingPayload } from './validation';
import { processLandingCrm } from './crm';
import { notifyLandingSubmission } from './notification';
import { LANDING_PROCESSING_TIMEOUT_MS, runClaimedLandingSubmission } from './processing';

type LandingConfig = NonNullable<ReturnType<typeof getLandingConfig>>;
type LandingDependencies = {
  createDb?: () => SupabaseClient;
  getConfig?: () => LandingConfig | null;
  rateLimit?: typeof enforceLandingRateLimit;
  processCrm?: typeof processLandingCrm;
  notify?: typeof notifyLandingSubmission;
  now?: () => number;
};

type SubmissionRow = {
  id: string;
  status: string;
  processing_token: string | null;
  processing_started_at: string | null;
  attempt_count: number;
  next_retry_at: string | null;
  crm_contact_id: string | null;
  crm_deal_id: string | null;
  crm_activity_id: string | null;
  response_code: number | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  message?: string | null;
  subject?: string | null;
  source_page?: string | null;
};

function publicError(code: string, status: number) {
  return { body: { ok: false, error: 'Não foi possível processar a solicitação.', code }, status };
}

/**
 * "Está processando" só é uma resposta honesta enquanto alguém de fato estiver
 * processando. Uma execução que morreu no meio deixa a linha em `processing`
 * para sempre; responder 202 a ela era prometer um contato que ninguém ia
 * retomar. Passada a posse, a requisição segue e a reivindica de volta.
 */
function isLeaseAlive(row: SubmissionRow, now: number) {
  if (!row.processing_started_at) return false;
  const startedAt = Date.parse(row.processing_started_at);
  return Number.isFinite(startedAt) && now - startedAt < LANDING_PROCESSING_TIMEOUT_MS;
}

async function getSubmission(db: SupabaseClient, key: string, organizationId: string) {
  const result = await db.from('landing_submissions').select('id,status,processing_token,processing_started_at,attempt_count,next_retry_at,crm_contact_id,crm_deal_id,crm_activity_id,response_code,name,email,phone,company_name,message,subject,source_page').eq('idempotency_key', key).eq('organization_id', organizationId).maybeSingle();
  if (result.error) throw Object.assign(new Error('submission lookup failed'), { code: 'SUBMISSION_LOOKUP_FAILED', cause: result.error });
  return result.data as SubmissionRow | null;
}

async function claim(db: SupabaseClient, key: string) {
  const result = await db.rpc('claim_landing_submission', { p_idempotency_key: key });
  if (result.error) throw Object.assign(new Error('claim failed'), { code: 'CLAIM_FAILED', cause: result.error });
  return (result.data?.[0] ?? null) as (SubmissionRow & { submission_id: string; claim_status: string }) | null;
}

export async function handleLandingSubmission(request: Request, dependencies: LandingDependencies = {}) {
  const config = (dependencies.getConfig ?? getLandingConfig)();
  if (!config) return publicError('LANDING_NOT_CONFIGURED', 503);

  const key = request.headers.get('Idempotency-Key')?.trim() ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) return publicError('IDEMPOTENCY_KEY_INVALID', 400);

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 64_000) return publicError('PAYLOAD_TOO_LARGE', 413);
  const body = await request.json().catch(() => null);
  const parsed = LandingPayloadSchema.safeParse(body);
  if (!parsed.success) return publicError('VALIDATION_ERROR', 422);

  const input = normalizeLandingPayload(parsed.data);
  const db = (dependencies.createDb ?? createStaticAdminClient)();
  const applyRateLimit = dependencies.rateLimit ?? enforceLandingRateLimit;
  const now = dependencies.now ?? Date.now;

  // Replay/active state is checked before counting a legitimate retry against the limit.
  const existing = await getSubmission(db, key, config.organizationId).catch(() => null);
  if (existing && (
    existing.name !== input.name || existing.email !== input.email || existing.phone !== input.phone ||
    existing.company_name !== input.companyName || existing.message !== input.message ||
    existing.subject !== input.subject || existing.source_page !== input.sourcePage
  )) return publicError('IDEMPOTENCY_KEY_REUSED', 409);
  if (existing?.status === 'processed') return { body: { ok: true, message: 'Recebido.' }, status: 200 };
  if (existing?.status === 'processing' && isLeaseAlive(existing, now())) return { body: { ok: true, message: 'Recebido.' }, status: 202 };
  if (existing?.status === 'failed_terminal') return publicError('SUBMISSION_TERMINAL_FAILURE', 422);

  const limited = await applyRateLimit(db, request, config).catch(() => null);
  if (!limited) return publicError('RATE_LIMIT_UNAVAILABLE', 503);
  if (!limited.allowed) return publicError('RATE_LIMITED', 429);

  // Honeypot remains intentionally indistinguishable from an accepted submission.
  if (input.honeypot) return { body: { ok: true, message: 'Recebido.' }, status: 202 };

  if (!existing) {
    const inserted = await db.from('landing_submissions').insert({
      idempotency_key: key,
      organization_id: config.organizationId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      company_name: input.companyName,
      message: input.message,
      subject: input.subject,
      source_page: input.sourcePage,
    }).select('id').maybeSingle();
    if (inserted.error && inserted.error.code !== '23505') return publicError('PERSISTENCE_FAILED', 503);
  }

  const claimed = await claim(db, key);
  if (!claimed) return publicError('CLAIM_FAILED', 503);
  if (claimed.claim_status === 'processed') return { body: { ok: true, message: 'Recebido.' }, status: 200 };
  if (claimed.claim_status === 'in_progress') return { body: { ok: true, message: 'Recebido.' }, status: 202 };
  if (claimed.claim_status === 'retry_not_due') return publicError('RETRY_NOT_DUE', 409);
  if (claimed.claim_status === 'terminal_failure') return publicError('SUBMISSION_TERMINAL_FAILURE', 422);
  if (claimed.claim_status !== 'claimed' || !claimed.processing_token) return publicError('CLAIM_FAILED', 503);

  const result = await runClaimedLandingSubmission({
    db,
    config,
    processCrm: dependencies.processCrm,
    notify: dependencies.notify,
    claimed: {
      submissionId: claimed.submission_id,
      processingToken: claimed.processing_token,
      contactId: claimed.crm_contact_id,
      dealId: claimed.crm_deal_id,
      activityId: claimed.crm_activity_id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      companyName: input.companyName,
      subject: input.subject,
      message: input.message,
      sourcePage: input.sourcePage,
    },
  });

  if (result.outcome === 'processed') return { body: { ok: true, message: 'Recebido.' }, status: 201 };
  if (result.outcome === 'lease_lost') return publicError('LEASE_LOST', 202);
  if (result.outcome === 'failed_retryable') return publicError('TEMPORARY_FAILURE', 503);
  return publicError('PROCESSING_FAILED', 422);
}
