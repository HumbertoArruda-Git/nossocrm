import 'server-only'

import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export const LANDING_OUTBOX_MAX_ATTEMPTS = 5
export const LANDING_OUTBOX_BACKOFF_MS = [60_000, 300_000, 900_000, 3_600_000, 21_600_000] as const

export type LandingOutboxEvent = {
  event_id: string
  claim_status: 'claimed' | 'in_progress' | 'delivered' | 'retry_not_due' | 'terminal_failure' | 'unavailable'
  event_type: string
  occurred_at: string
  organization_id: string
  submission_id: string
  contact_id: string
  deal_id: string
  status: 'processing'
  processing_token: string
  attempt_count: number
}

export type LandingAutomationPayload = {
  event_id: string
  event_type: string
  occurred_at: string
  organization_id: string
  submission_id: string
  contact_id: string
  deal_id: string
}

export type LandingTransportResult =
  | { ok: true; message?: string }
  | { ok: false; kind: 'timeout' | 'network' | 'http_408' | 'http_429' | 'http_5xx' | 'terminal'; code: string }

export type LandingOutboxDb = {
  rpc: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>
}

export function buildLandingAutomationPayload(event: LandingOutboxEvent): LandingAutomationPayload {
  return {
    event_id: event.event_id, event_type: event.event_type, occurred_at: event.occurred_at,
    organization_id: event.organization_id, submission_id: event.submission_id,
    contact_id: event.contact_id, deal_id: event.deal_id,
  }
}

function unsafeIp(address: string): boolean {
  if (isIP(address) === 4) {
    const octets = address.split('.').map(Number)
    const [a, b] = octets
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
  }
  const normalized = address.toLowerCase()
  if (normalized.startsWith('::ffff:')) return unsafeIp(normalized.slice('::ffff:'.length))
  return normalized === '::' || normalized === '::1' || normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb') ||
    normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.includes('::ffff:10.') ||
    normalized.includes('::ffff:127.') || normalized.includes('::ffff:192.168.')
}

export async function validateLandingAutomationWebhookUrl(rawUrl: string, options: { production?: boolean } = {}): Promise<{ ok: true; url: URL } | { ok: false; code: 'CONFIG_INVALID' | 'DESTINATION_BLOCKED' }> {
  let url: URL
  try { url = new URL(rawUrl) } catch { return { ok: false, code: 'CONFIG_INVALID' } }
  if (!['https:', ...(options.production ? [] : ['http:'])].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    return { ok: false, code: 'CONFIG_INVALID' }
  }
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || url.hostname === 'metadata.google.internal') return { ok: false, code: 'DESTINATION_BLOCKED' }
  try {
    const addresses = isIP(url.hostname) ? [url.hostname] : (await lookup(url.hostname, { all: true })).map(result => result.address)
    if (!addresses.length || addresses.some(unsafeIp)) return { ok: false, code: 'DESTINATION_BLOCKED' }
  } catch { return { ok: false, code: 'DESTINATION_BLOCKED' } }
  return { ok: true, url }
}

export function getLandingAutomationConfig(env: NodeJS.ProcessEnv = process.env): { url: string; token: string } | null {
  const url = env.LANDING_AUTOMATION_WEBHOOK_URL?.trim()
  const token = env.LANDING_AUTOMATION_WEBHOOK_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function createLandingAutomationTransport(config: { url: string; token: string }, options: { production?: boolean; timeoutMs?: number } = {}) {
  return async (payload: LandingAutomationPayload): Promise<LandingTransportResult> => {
    const checked = await validateLandingAutomationWebhookUrl(config.url, { production: options.production })
    if (!checked.ok) return { ok: false, kind: 'terminal', code: checked.code }
    const rawBody = JSON.stringify(payload)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8_000)
    try {
      const response = await fetch(checked.url, { method: 'POST', headers: {
        'content-type': 'application/json', 'X-HGA-Event-Id': payload.event_id,
        'X-HGA-Webhook-Token': config.token,
      }, body: rawBody, signal: controller.signal })
      if (response.ok) return { ok: true }
      if (response.status === 408) return { ok: false, kind: 'http_408', code: 'HTTP_408' }
      if (response.status === 429) return { ok: false, kind: 'http_429', code: 'HTTP_429' }
      if (response.status >= 500) return { ok: false, kind: 'http_5xx', code: 'HTTP_5XX' }
      return { ok: false, kind: 'terminal', code: 'PROTOCOL_INVALID' }
    } catch (error) {
      return { ok: false, kind: error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'network', code: error instanceof DOMException && error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR' }
    } finally { clearTimeout(timeout) }
  }
}

export function createLandingAutomationTransportFromEnv(env: NodeJS.ProcessEnv = process.env, options: { production?: boolean; timeoutMs?: number } = {}) {
  const config = getLandingAutomationConfig(env)
  if (!config) return async (): Promise<LandingTransportResult> => ({ ok: false, kind: 'terminal', code: 'CONFIG_INVALID' })
  return createLandingAutomationTransport(config, options)
}

export async function deliverNextLandingOutboxEvent(input: {
  db: LandingOutboxDb
  transport: (payload: LandingAutomationPayload) => Promise<LandingTransportResult>
  now?: () => number
}): Promise<'empty' | 'delivered' | 'failed_retryable' | 'failed_terminal' | 'lease_lost'> {
  const claimed = await input.db.rpc('claim_landing_outbox_event', {})
  if (claimed.error) throw new Error('Landing outbox claim failed')
  const event = (Array.isArray(claimed.data) ? claimed.data[0] : claimed.data) as LandingOutboxEvent | undefined
  if (!event) return 'empty'
  if (event.claim_status !== 'claimed') return 'empty'
  const payload = buildLandingAutomationPayload(event)
  const result = await input.transport(payload)
  if (result.ok) {
    const completed = await input.db.rpc('complete_landing_outbox_event', { p_event_id: event.event_id, p_processing_token: event.processing_token })
    return completed.error ? 'lease_lost' : completed.data === true ? 'delivered' : 'lease_lost'
  }
  const retryable = result.kind !== 'terminal'
  const nextRetryAt = retryable && event.attempt_count < LANDING_OUTBOX_MAX_ATTEMPTS
    ? new Date((input.now?.() ?? Date.now()) + LANDING_OUTBOX_BACKOFF_MS[Math.min(event.attempt_count - 1, LANDING_OUTBOX_BACKOFF_MS.length - 1)]).toISOString()
    : null
  const failed = await input.db.rpc('fail_landing_outbox_event', { p_event_id: event.event_id, p_processing_token: event.processing_token, p_error_code: result.code, p_retryable: retryable, p_next_retry_at: nextRetryAt })
  if (failed.error) return 'lease_lost'
  return failed.data === true ? (retryable && event.attempt_count < LANDING_OUTBOX_MAX_ATTEMPTS ? 'failed_retryable' : 'failed_terminal') : 'lease_lost'
}
