import 'server-only'

import { createStaticAdminClient } from '@/lib/supabase/staticAdminClient'
import {
  createLandingAutomationTransportFromEnv,
  deliverNextLandingOutboxEvent,
  type LandingOutboxDb,
} from '@/lib/public-landing/outboxWorker'
import { runLandingOutboxBatch } from '@/lib/public-landing/outboxRunner'
import { hasValidCronAuthorization } from '@/lib/public-landing/cronAuth'

export const maxDuration = 60

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export async function GET(request: Request) {
  if (!hasValidCronAuthorization(request)) return json({ error: 'Unauthorized' }, 401)

  const db = createStaticAdminClient() as unknown as LandingOutboxDb
  const transport = createLandingAutomationTransportFromEnv(process.env, { production: true })
  const result = await runLandingOutboxBatch(() => deliverNextLandingOutboxEvent({ db, transport }))

  if (result.errors > 0) return json({ ok: false, ...result }, 500)
  return json({ ok: true, ...result })
}
