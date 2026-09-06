import { createHmac } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export const LANDING_RATE_LIMIT_ENDPOINT = 'public_landing_contact';

export function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function hashIdentifier(ip: string, secret: string) {
  return createHmac('sha256', secret).update(ip).digest('hex');
}

/**
 * Contar e registrar são a MESMA operação, e por isso vivem dentro de uma única
 * função no banco. Feitas em duas chamadas, como antes, duas requisições
 * simultâneas leem a mesma contagem e ambas passam — o limite vira uma sugestão
 * para quem dispara em paralelo, que é justamente o comportamento de um abuso.
 */
export async function enforceLandingRateLimit(
  db: SupabaseClient,
  request: Request,
  config: { rateLimitSecret: string; rateLimitMax: number; rateLimitWindowMinutes: number },
) {
  const identifier = `landing:${hashIdentifier(getClientIp(request), config.rateLimitSecret)}`;
  const consumed = await db.rpc('consume_rate_limit', {
    p_identifier: identifier,
    p_endpoint: LANDING_RATE_LIMIT_ENDPOINT,
    p_max: config.rateLimitMax,
    p_window_minutes: config.rateLimitWindowMinutes,
  });

  if (consumed.error) throw Object.assign(new Error('rate limit check failed'), { code: 'RATE_LIMIT_LOOKUP_FAILED', cause: consumed.error });
  return { allowed: consumed.data === true };
}
