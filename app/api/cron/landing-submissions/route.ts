import 'server-only'

import { createStaticAdminClient } from '@/lib/supabase/staticAdminClient'
import { getLandingConfig } from '@/lib/public-landing/config'
import { hasValidCronAuthorization } from '@/lib/public-landing/cronAuth'
import { runLandingOutboxBatch } from '@/lib/public-landing/outboxRunner'
import { recoverNextLandingSubmission } from '@/lib/public-landing/recoveryWorker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export async function GET(request: Request) {
  if (!hasValidCronAuthorization(request)) return json({ error: 'Unauthorized' }, 401)

  const config = getLandingConfig()
  if (!config) return json({ ok: false, error: 'LANDING_NOT_CONFIGURED' }, 503)

  const db = createStaticAdminClient()
  const result = await runLandingOutboxBatch(async () => {
    const outcome = await recoverNextLandingSubmission({ db, config })
    // O runner conta entregas; aqui "entregue" é uma submissão que chegou ao CRM.
    return outcome === 'processed' ? 'delivered' : outcome
  })

  if (result.errors > 0) return json({ ok: false, ...result }, 500)
  return json({ ok: true, ...result })
}
