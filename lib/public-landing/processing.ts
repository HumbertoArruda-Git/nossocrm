import type { SupabaseClient } from '@supabase/supabase-js';
import type { LandingSubject } from './config';
import { processLandingCrm } from './crm';
import { notifyLandingSubmission } from './notification';
import { recordLandingNotificationResult } from './notificationQueue';

/**
 * O que acontece com uma submissão DEPOIS de reivindicada mora aqui, e não no
 * handler HTTP, porque agora há dois caminhos que chegam a este ponto: a
 * requisição do visitante e o worker que retoma submissões travadas. Se cada um
 * tivesse a sua cópia da sequência (CRM → conclusão → aviso), elas divergiriam
 * — e a divergência apareceria justamente no caminho que ninguém observa.
 */

/** Espelha o default de `claim_landing_submission`. Mudou lá, muda aqui. */
export const LANDING_PROCESSING_TIMEOUT_MS = 10 * 60_000;

export type LandingProcessingConfig = {
  organizationId: string;
  boardId: string;
  stageId: string;
};

export type LandingClaimedSubmission = {
  submissionId: string;
  processingToken: string;
  contactId: string | null;
  dealId: string | null;
  activityId: string | null;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  subject: LandingSubject;
  message: string;
  sourcePage: string;
};

export type LandingProcessingResult =
  | { outcome: 'processed' }
  | { outcome: 'lease_lost' }
  | { outcome: 'failed_retryable' | 'failed_terminal'; errorCode: string };

export function isRetryableProcessingError(error: unknown) {
  const code = String((error as { code?: unknown })?.code ?? '');
  const causeCode = String(((error as { cause?: { code?: unknown } })?.cause)?.code ?? '');
  if (['23503', '23514', '22P02'].includes(causeCode)) return false;
  return code.includes('CRM_') || code.includes('LOOKUP_FAILED') || code.includes('TEMPORARY') || code.includes('TIMEOUT') || code.includes('UNAVAILABLE') || code.includes('SUPABASE') || code.includes('PROGRESS_UPDATE') || code.includes('CLAIM_FAILED') || code.includes('COMPLETE_FAILED');
}

async function updateProgress(
  db: SupabaseClient,
  id: string,
  token: string,
  field: 'crm_contact_id' | 'crm_deal_id' | 'crm_activity_id',
  value: string,
) {
  const result = await db.from('landing_submissions').update({ [field]: value }).eq('id', id).eq('status', 'processing').eq('processing_token', token).select('id').maybeSingle();
  if (result.error) throw Object.assign(new Error('progress update failed'), { code: 'PROGRESS_UPDATE_FAILED', cause: result.error });
  if (!result.data) throw Object.assign(new Error('lease lost'), { code: 'LEASE_LOST' });
}

export async function runClaimedLandingSubmission(input: {
  db: SupabaseClient;
  config: LandingProcessingConfig;
  claimed: LandingClaimedSubmission;
  processCrm?: typeof processLandingCrm;
  notify?: typeof notifyLandingSubmission;
}): Promise<LandingProcessingResult> {
  const { db, config, claimed } = input;
  const processCrm = input.processCrm ?? processLandingCrm;
  const notify = input.notify ?? notifyLandingSubmission;
  const token = claimed.processingToken;

  try {
    const crm = await processCrm(db, {
      organizationId: config.organizationId,
      boardId: config.boardId,
      stageId: config.stageId,
      submissionId: claimed.submissionId,
      contactId: claimed.contactId,
      dealId: claimed.dealId,
      activityId: claimed.activityId,
      name: claimed.name,
      email: claimed.email,
      phone: claimed.phone,
      companyName: claimed.companyName,
      subject: claimed.subject,
      message: claimed.message,
    }, async (field, value) => updateProgress(db, claimed.submissionId, token, field, value));

    const completed = await db.rpc('complete_landing_submission', {
      p_submission_id: claimed.submissionId,
      p_processing_token: token,
      p_crm_contact_id: crm.contactId,
      p_crm_deal_id: crm.dealId,
      p_crm_activity_id: crm.activityId,
      p_response_code: 201,
    });
    if (completed.error) throw Object.assign(new Error('complete failed'), { code: 'COMPLETE_FAILED', cause: completed.error });
    if (!completed.data) return { outcome: 'lease_lost' };

    // O aviso é tentado aqui porque este é o caminho rápido — o time recebe o
    // e-mail em segundos. O resultado, porém, é gravado: se falhar, a submissão
    // fica na fila de notificação e o worker do cron continua tentando.
    //
    // O try é separado de propósito. Neste ponto a submissão JÁ está gravada
    // como processada, e o lead já está no CRM: nada que aconteça com o e-mail
    // pode reverter isso ou fazer a requisição parecer ter falhado.
    try {
      const notified = await notify({
        submissionId: claimed.submissionId,
        name: claimed.name,
        companyName: claimed.companyName,
        email: claimed.email,
        phone: claimed.phone,
        subject: claimed.subject,
        message: claimed.message,
        sourcePage: claimed.sourcePage,
      });
      await recordLandingNotificationResult(db, claimed.submissionId, notified);
    } catch (error) {
      console.error('[landing-notification] inline attempt failed', {
        code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
      });
    }

    return { outcome: 'processed' };
  } catch (error) {
    if (String((error as { code?: unknown })?.code) === 'LEASE_LOST') return { outcome: 'lease_lost' };
    const errorCode = String((error as { code?: unknown })?.code ?? 'CRM_PROCESSING_FAILED');
    const retryable = isRetryableProcessingError(error);
    const failed = await db.rpc('fail_landing_submission', {
      p_submission_id: claimed.submissionId,
      p_processing_token: token,
      p_error_code: errorCode,
      p_retryable: retryable,
      p_next_retry_at: retryable ? new Date(Date.now() + 5 * 60_000).toISOString() : null,
    });
    if (failed.error || !failed.data) return { outcome: 'lease_lost' };
    return { outcome: retryable ? 'failed_retryable' : 'failed_terminal', errorCode };
  }
}
