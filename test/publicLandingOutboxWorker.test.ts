import { describe, expect, it, vi } from 'vitest'
import {
  buildLandingAutomationPayload,
  createLandingAutomationTransportFromEnv,
  deliverNextLandingOutboxEvent,
  getLandingAutomationConfig,
  LANDING_OUTBOX_BACKOFF_MS,
  validateLandingAutomationWebhookUrl,
  type LandingOutboxEvent,
} from '@/lib/public-landing/outboxWorker'

const event: LandingOutboxEvent = {
  event_id: '00000000-0000-4000-8000-000000000001', claim_status: 'claimed', event_type: 'landing.lead.processed',
  occurred_at: '2026-09-02T20:00:00.000Z', organization_id: 'org-1',
  submission_id: 'submission-1', contact_id: 'contact-1', deal_id: 'deal-1',
  status: 'processing', processing_token: 'token-1', attempt_count: 1,
}

function db(eventData: LandingOutboxEvent | null, complete = true) {
  const calls: Array<{ name: string; args?: Record<string, unknown> }> = []
  return {
    calls,
    rpc: vi.fn(async (name: string, args?: Record<string, unknown>) => {
      calls.push({ name, args })
      if (name === 'claim_landing_outbox_event') return { data: eventData ? [eventData] : [], error: null }
      if (name === 'complete_landing_outbox_event') return { data: complete, error: null }
      return { data: complete, error: null }
    }),
  }
}

describe('landing outbox delivery worker', () => {
  it('claims, sends only the minimum payload and completes with the fencing token', async () => {
    const database = db(event)
    const transport = vi.fn(async (payload) => ({ ok: true as const, payload }))
    expect(await deliverNextLandingOutboxEvent({ db: database, transport })).toBe('delivered')
    expect(transport).toHaveBeenCalledWith({
      event_id: event.event_id, event_type: event.event_type, occurred_at: event.occurred_at,
      organization_id: event.organization_id, submission_id: event.submission_id,
      contact_id: event.contact_id, deal_id: event.deal_id,
    })
    expect(database.calls[1]).toMatchObject({ name: 'complete_landing_outbox_event', args: { p_event_id: event.event_id, p_processing_token: event.processing_token } })
  })

  it('returns empty when no event is claimable', async () => {
    expect(await deliverNextLandingOutboxEvent({ db: db(null), transport: vi.fn() })).toBe('empty')
  })

  it.each([
    ['timeout', 'TIMEOUT', 'failed_retryable'], ['network', 'NETWORK_ERROR', 'failed_retryable'],
    ['http_408', 'HTTP_408', 'failed_retryable'], ['http_429', 'HTTP_429', 'failed_retryable'],
    ['http_5xx', 'HTTP_5XX', 'failed_retryable'], ['terminal', 'CONFIG_INVALID', 'failed_terminal'],
  ] as const)('classifies %s correctly and fences completion', async (kind, code, expected) => {
    const database = db(event)
    const result = await deliverNextLandingOutboxEvent({
      db: database, now: () => Date.parse('2026-09-02T20:00:00.000Z'),
      transport: vi.fn(async () => ({ ok: false as const, kind, code })),
    })
    expect(result).toBe(expected)
    expect(database.calls[1]).toMatchObject({ name: 'fail_landing_outbox_event', args: {
      p_event_id: event.event_id, p_processing_token: event.processing_token,
      p_error_code: code, p_retryable: expected === 'failed_retryable',
    } })
  })

  it('does not claim completion when the lease was lost', async () => {
    const database = db(event, false)
    expect(await deliverNextLandingOutboxEvent({ db: database, transport: vi.fn(async () => ({ ok: true as const })) })).toBe('lease_lost')
  })

  it('uses deterministic backoff and max-attempt terminal behavior', async () => {
    const fifthAttempt = { ...event, attempt_count: 5 }
    const database = db(fifthAttempt, true)
    const result = await deliverNextLandingOutboxEvent({ db: database, now: () => 0, transport: vi.fn(async () => ({ ok: false as const, kind: 'http_5xx' as const, code: 'HTTP_5XX' })) })
    expect(result).toBe('failed_terminal')
    expect(database.calls[1].args?.p_next_retry_at).toBeNull()
    expect(LANDING_OUTBOX_BACKOFF_MS).toEqual([60_000, 300_000, 900_000, 3_600_000, 21_600_000])
  })

  it('sends the native n8n Header Auth token without changing the minimum payload', async () => {
    const payload = buildLandingAutomationPayload(event)
    const response = new Response('{}', { status: 200 })
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)
    const transport = createLandingAutomationTransport({ url: 'https://example.com/hook', token: 'fake-staging-token' }, { production: true })
    await expect(transport(payload)).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/hook', expect.objectContaining({
      headers: {
        'content-type': 'application/json',
        'X-HGA-Event-Id': event.event_id,
        'X-HGA-Webhook-Token': 'fake-staging-token',
      },
      body: JSON.stringify(payload),
    }))
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('X-HGA-Timestamp')
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('X-HGA-Signature')
    fetchMock.mockRestore()
  })

  it('blocks SSRF destinations and requires HTTPS in production', async () => {
    expect(await validateLandingAutomationWebhookUrl('file:///etc/passwd', { production: true })).toMatchObject({ ok: false, code: 'CONFIG_INVALID' })
    expect(await validateLandingAutomationWebhookUrl('http://1.1.1.1/hook', { production: true })).toMatchObject({ ok: false, code: 'CONFIG_INVALID' })
    expect(await validateLandingAutomationWebhookUrl('https://127.0.0.1/hook', { production: true })).toMatchObject({ ok: false, code: 'DESTINATION_BLOCKED' })
    expect(await validateLandingAutomationWebhookUrl('https://169.254.169.254/latest', { production: true })).toMatchObject({ ok: false, code: 'DESTINATION_BLOCKED' })
  })

  it('does not create a transport configuration when secret or URL is absent', () => {
    expect(getLandingAutomationConfig({ LANDING_AUTOMATION_WEBHOOK_URL: 'https://example.invalid' })).toBeNull()
    expect(getLandingAutomationConfig({ LANDING_AUTOMATION_WEBHOOK_TOKEN: 'fake-token' })).toBeNull()
    expect(getLandingAutomationConfig({ LANDING_AUTOMATION_WEBHOOK_URL: 'https://example.invalid', LANDING_AUTOMATION_WEBHOOK_TOKEN: 'fake-token' })).toEqual({ url: 'https://example.invalid', token: 'fake-token' })
  })

  it('classifies missing automation configuration as terminal without HTTP', async () => {
    const transport = createLandingAutomationTransportFromEnv({})
    await expect(transport(buildLandingAutomationPayload(event))).resolves.toEqual({ ok: false, kind: 'terminal', code: 'CONFIG_INVALID' })
  })
})
