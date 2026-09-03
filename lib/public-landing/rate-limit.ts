import { createHmac } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function hashIdentifier(ip: string, secret: string) {
  return createHmac('sha256', secret).update(ip).digest('hex');
}

export async function enforceLandingRateLimit(
  db: SupabaseClient,
  request: Request,
  config: { rateLimitSecret: string; rateLimitMax: number; rateLimitWindowMinutes: number },
) {
  const identifier = `landing:${hashIdentifier(getClientIp(request), config.rateLimitSecret)}`;
  const since = new Date(Date.now() - config.rateLimitWindowMinutes * 60_000).toISOString();
  const recent = await db
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('endpoint', 'public_landing_contact')
    .gte('created_at', since);

  if (recent.error) throw Object.assign(new Error('rate limit lookup failed'), { code: 'RATE_LIMIT_LOOKUP_FAILED', cause: recent.error });
  if ((recent.count ?? 0) >= config.rateLimitMax) return { allowed: false } as const;

  const inserted = await db.from('rate_limits').insert({ identifier, endpoint: 'public_landing_contact' });
  if (inserted.error) throw Object.assign(new Error('rate limit write failed'), { code: 'RATE_LIMIT_WRITE_FAILED', cause: inserted.error });
  return { allowed: true } as const;
}
