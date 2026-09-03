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

function getNotificationConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.LANDING_NOTIFICATION_FROM?.trim();
  const to = process.env.LANDING_NOTIFICATION_TO?.trim();
  if (!apiKey || !from || !to) return null;
  return { apiKey, from, to };
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

export async function notifyLandingSubmission(input: LandingNotificationInput): Promise<void> {
  const config = getNotificationConfig();
  if (!config) {
    console.warn('[landing-notification] skipped: incomplete configuration');
    return;
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
      console.error('[landing-notification] send failed', { code: response.error.name || 'SEND_ERROR' });
      return;
    }

    console.info('[landing-notification] sent', { provider: 'resend' });
  } catch (error) {
    console.error('[landing-notification] send exception', {
      code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    });
  }
}
