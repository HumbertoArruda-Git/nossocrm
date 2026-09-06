import { describe, expect, it } from 'vitest';
import { enforceLandingRateLimit, getClientIp } from '@/lib/public-landing/rate-limit';

const config = { rateLimitSecret: 'x'.repeat(32), rateLimitMax: 5, rateLimitWindowMinutes: 15 };

function request(headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/public/landing-contact', { method: 'POST', headers });
}

function fakeDb(allowed: boolean | null, error: { message: string } | null = null) {
  const calls: { name: string; args?: Record<string, unknown> }[] = [];
  const db = {
    rpc: async (name: string, args?: Record<string, unknown>) => {
      calls.push({ name, args });
      return { data: allowed, error };
    },
  };
  return { db: db as never, calls };
}

describe('landing rate limit', () => {
  it('contar e registrar acontecem numa chamada só', async () => {
    // Em duas chamadas, requisições simultâneas liam a mesma contagem e todas
    // passavam: o limite virava sugestão para quem dispara em paralelo.
    const { db, calls } = fakeDb(true);

    expect(await enforceLandingRateLimit(db, request({ 'x-forwarded-for': '203.0.113.7' }), config)).toEqual({ allowed: true });
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe('consume_rate_limit');
    expect(calls[0].args).toMatchObject({
      p_endpoint: 'public_landing_contact', p_max: 5, p_window_minutes: 15,
    });
  });

  it('bloqueia quando o banco recusa o consumo', async () => {
    const { db } = fakeDb(false);
    expect(await enforceLandingRateLimit(db, request(), config)).toEqual({ allowed: false });
  });

  it('o identificador nunca carrega o IP em claro', async () => {
    const { db, calls } = fakeDb(true);
    await enforceLandingRateLimit(db, request({ 'x-forwarded-for': '203.0.113.7' }), config);

    const identifier = String(calls[0].args?.p_identifier);
    expect(identifier.startsWith('landing:')).toBe(true);
    expect(identifier).not.toContain('203.0.113.7');
  });

  it('a mesma origem produz o mesmo identificador, e origens diferentes não colidem', async () => {
    const first = fakeDb(true);
    const second = fakeDb(true);
    const third = fakeDb(true);

    await enforceLandingRateLimit(first.db, request({ 'x-forwarded-for': '203.0.113.7' }), config);
    await enforceLandingRateLimit(second.db, request({ 'x-forwarded-for': '203.0.113.7' }), config);
    await enforceLandingRateLimit(third.db, request({ 'x-forwarded-for': '198.51.100.4' }), config);

    expect(first.calls[0].args?.p_identifier).toBe(second.calls[0].args?.p_identifier);
    expect(first.calls[0].args?.p_identifier).not.toBe(third.calls[0].args?.p_identifier);
  });

  it('erro do banco vira exceção, e não uma liberação silenciosa', async () => {
    const { db } = fakeDb(null, { message: 'boom' });
    await expect(enforceLandingRateLimit(db, request(), config)).rejects.toThrow();
  });

  it('lê o IP do primeiro salto do x-forwarded-for', async () => {
    expect(getClientIp(request({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18' }))).toBe('203.0.113.7');
    expect(getClientIp(request({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4');
    expect(getClientIp(request())).toBe('unknown');
  });
});
