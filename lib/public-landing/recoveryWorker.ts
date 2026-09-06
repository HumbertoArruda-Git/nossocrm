import type { SupabaseClient } from '@supabase/supabase-js';
import { LANDING_SUBJECTS, type LandingSubject } from './config';
import type { processLandingCrm } from './crm';
import type { notifyLandingSubmission } from './notification';
import { runClaimedLandingSubmission, type LandingProcessingConfig } from './processing';

/**
 * Retoma submissões que ficaram para trás.
 *
 * Antes, a única coisa capaz de destravar uma submissão era o próprio visitante
 * reenviando o formulário com a mesma chave de idempotência — algo que não
 * acontece, porque ele já leu "recebemos sua mensagem" e fechou a aba. Uma
 * instância que morresse no meio do processamento levava o contato junto.
 */
export type LandingRecoveryOutcome =
  | 'empty'
  | 'processed'
  | 'failed_retryable'
  | 'failed_terminal'
  | 'lease_lost';

type ClaimedRow = {
  submission_id: string;
  processing_token: string;
  attempt_count: number;
  crm_contact_id: string | null;
  crm_deal_id: string | null;
  crm_activity_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  message: string | null;
  subject: string | null;
  source_page: string | null;
};

function toSubject(value: string | null): LandingSubject {
  return (LANDING_SUBJECTS as readonly string[]).includes(value ?? '')
    ? (value as LandingSubject)
    : 'outro';
}

export async function recoverNextLandingSubmission(input: {
  db: SupabaseClient;
  config: LandingProcessingConfig;
  processCrm?: typeof processLandingCrm;
  notify?: typeof notifyLandingSubmission;
}): Promise<LandingRecoveryOutcome> {
  const claimed = await input.db.rpc('claim_next_landing_submission', {
    p_organization_id: input.config.organizationId,
  });
  if (claimed.error) throw new Error('Landing submission recovery claim failed');

  const row = (Array.isArray(claimed.data) ? claimed.data[0] : claimed.data) as ClaimedRow | undefined;
  if (!row?.submission_id || !row.processing_token) return 'empty';

  // Sem nome, e-mail e mensagem não há o que processar — e a linha está agora
  // com a posse nas mãos deste worker. Marcar terminal a devolve; deixá-la
  // "processing" a travaria de novo até o próximo timeout, em ciclo.
  if (!row.name || !row.email || !row.message) {
    await input.db.rpc('fail_landing_submission', {
      p_submission_id: row.submission_id,
      p_processing_token: row.processing_token,
      p_error_code: 'PAYLOAD_UNAVAILABLE',
      p_retryable: false,
      p_next_retry_at: null,
    });
    return 'failed_terminal';
  }

  const result = await runClaimedLandingSubmission({
    db: input.db,
    config: input.config,
    processCrm: input.processCrm,
    notify: input.notify,
    claimed: {
      submissionId: row.submission_id,
      processingToken: row.processing_token,
      contactId: row.crm_contact_id,
      dealId: row.crm_deal_id,
      activityId: row.crm_activity_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      companyName: row.company_name,
      subject: toSubject(row.subject),
      message: row.message,
      sourcePage: row.source_page ?? '/',
    },
  });

  return result.outcome;
}
