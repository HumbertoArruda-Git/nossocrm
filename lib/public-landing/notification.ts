import { Resend } from 'resend';

export type LandingNotificationInput = {
  submissionId: string;
  name: string;
  companyName: string | null;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  sourcePage: string;
};

/**
 * O resultado precisa ser explícito porque o aviso ao time é a única coisa que
 * transforma um lead gravado em um lead atendido. Engolir a falha em silêncio,
 * como antes, deixava o contato no CRM sem ninguém saber que ele existia.
 */
export type LandingNotificationResult =
  | { ok: true }
  | { ok: false; retryable: boolean; code: string };

// Erros de conteúdo não melhoram com repetição: reenviar dez vezes um endereço
// inválido só gasta tentativa. Tudo o mais é tratado como transitório.
const TERMINAL_ERROR_NAMES = new Set([
  'validation_error',
  'invalid_parameter',
  'missing_required_field',
  'invalid_from_address',
  'invalid_to_address',
  'restricted_api_key',
]);

function getNotificationConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.LANDING_NOTIFICATION_FROM?.trim();
  const to = process.env.LANDING_NOTIFICATION_TO?.trim();
  if (!apiKey || !from || !to) return null;
  return { apiKey, from, to };
}

export function getLandingNotificationConfigStatus(env: NodeJS.ProcessEnv = process.env) {
  return {
    hasApiKey: Boolean(env.RESEND_API_KEY?.trim()),
    hasFrom: Boolean(env.LANDING_NOTIFICATION_FROM?.trim()),
    hasTo: Boolean(env.LANDING_NOTIFICATION_TO?.trim()),
  };
}

export function buildLandingNotificationText(input: LandingNotificationInput, timestamp = new Date()) {
  return [
    'Novo contato pelo site — HGA Systems',
    '',
    `Nome: ${input.name}`,
    `Empresa: ${input.companyName || 'Não informada'}`,
    `E-mail: ${input.email}`,
    `WhatsApp: ${input.phone || 'Não informado'}`,
    `Assunto: ${input.subject}`,
    `Mensagem: ${input.message}`,
    `Origem: ${input.sourcePage}`,
    `Data/hora: ${timestamp.toISOString()}`,
    `Submission: ${input.submissionId}`,
  ].join('\n');
}

export async function notifyLandingSubmission(input: LandingNotificationInput): Promise<LandingNotificationResult> {
  const config = getNotificationConfig();
  if (!config) {
    // Configuração incompleta é problema de deploy, não de rede: repetir não
    // resolve. A fila marca terminal e o erro fica registrado na submissão.
    console.warn('[landing-notification] skipped: incomplete configuration', getLandingNotificationConfigStatus());
    return { ok: false, retryable: false, code: 'CONFIG_MISSING' };
  }

  try {
    const resend = new Resend(config.apiKey);
    const response = await resend.emails.send(
      {
        from: config.from,
        to: [config.to],
        subject: 'Novo contato pelo site — HGA Systems',
        text: buildLandingNotificationText(input),
      },
      { idempotencyKey: `landing-notification-${input.submissionId}` },
    );

    if (response.error) {
      const code = response.error.name || 'SEND_ERROR';
      console.error('[landing-notification] send failed', { code });
      return { ok: false, retryable: !TERMINAL_ERROR_NAMES.has(code), code };
    }

    console.info('[landing-notification] sent', { provider: 'resend' });
    return { ok: true };
  } catch (error) {
    const code = error instanceof Error ? error.name : 'UNKNOWN_ERROR';
    console.error('[landing-notification] send exception', { code });
    return { ok: false, retryable: true, code };
  }
}
