import { describe, expect, it } from 'vitest'
import { hasValidCronAuthorization } from '@/lib/public-landing/cronAuth'

describe('landing outbox cron authentication', () => {
  it('rejects missing, malformed, incorrect, and query-string credentials', () => {
    expect(hasValidCronAuthorization(new Request('https://example.test'))).toBe(false)
    expect(hasValidCronAuthorization(new Request('https://example.test', { headers: { authorization: 'Basic fake' } }), 'cron-secret')).toBe(false)
    expect(hasValidCronAuthorization(new Request('https://example.test?token=cron-secret'), 'cron-secret')).toBe(false)
    expect(hasValidCronAuthorization(new Request('https://example.test', { headers: { authorization: 'Bearer wrong' } }), 'cron-secret')).toBe(false)
  })

  it('accepts only the exact bearer token and does not return it', () => {
    const response = hasValidCronAuthorization(new Request('https://example.test', { headers: { authorization: 'Bearer cron-secret' } }), 'cron-secret')
    expect(response).toBe(true)
    expect(JSON.stringify(response)).not.toContain('cron-secret')
  })
})
