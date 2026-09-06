import type { LandingNotificationInput, LandingNotificationResult } from './notification';

/**
 * O aviso ao time deixou de ser um efeito colateral do envio e virou estado
 * persistido: cada submissão processada carrega se já foi notificada, quantas
 * tentativas houve, qual foi o último erro e quando é a próxima tentativa.
 *
 * A requisição do visitante continua tentando notificar na hora — é o caminho
 * rápido, e ele resolve o caso normal. O que mudou é que a falha dele não é
 * mais o fim da linha: a linha fica na fila e o worker do cron insiste.
 */
// PromiseLike, e não Promise: o builder do Supabase é um thenable, não uma
// Promise completa. Exigir Promise obrigaria um cast em todo ponto de uso.
export type LandingNotificationQueueDb = {
  rpc: (name: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
};

type ClaimedNotification = {
  submission_id: string;
  attempt_count: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  message: string | null;
  subject: string | null;
  source_page: string | null;
};

export type LandingNotificationOutcome =
  | 'empty'
  | 'delivered'
  | 'failed_retryable'
  | 'failed_terminal';

export async function recordLandingNotificationResult(
  db: LandingNotificationQueueDb,
  submissionId: string,
  result: LandingNotificationResult,
): Promise<void> {
  if (result.ok) {
    await db.rpc('complete_landing_notification', { p_submission_id: submissionId });
    return;
  }
  await db.rpc('fail_landing_notification', {
    p_submission_id: submissionId,
    p_error_code: result.code,
    p_retryable: result.retryable,
  });
}

export async function deliverNextLandingNotification(input: {
  db: LandingNotificationQueueDb;
  organizationId: string;
  notify: (payload: LandingNotificationInput) => Promise<LandingNotificationResult>;
}): Promise<LandingNotificationOutcome> {
  const claimed = await input.db.rpc('claim_landing_notification', {
    p_organization_id: input.organizationId,
  });
  if (claimed.error) throw new Error('Landing notification claim failed');

  const row = (Array.isArray(claimed.data) ? claimed.data[0] : claimed.data) as ClaimedNotification | undefined;
  if (!row?.submission_id) return 'empty';

  // A submissão só entra na fila com PII intacta, mas o worker não confia nisso:
  // notificar sem e-mail e sem mensagem seria mandar um aviso vazio ao time.
  if (!row.email || !row.message) {
    await recordLandingNotificationResult(input.db, row.submission_id, {
      ok: false, retryable: false, code: 'PAYLOAD_UNAVAILABLE',
    });
    return 'failed_terminal';
  }

  const result = await input.notify({
    submissionId: row.submission_id,
    name: row.name ?? 'Sem nome',
    companyName: row.company_name,
    email: row.email,
    phone: row.phone,
    subject: row.subject ?? 'outro',
    message: row.message,
    sourcePage: row.source_page ?? '/',
  });

  await recordLandingNotificationResult(input.db, row.submission_id, result);
  if (result.ok) return 'delivered';
  return result.retryable ? 'failed_retryable' : 'failed_terminal';
}
