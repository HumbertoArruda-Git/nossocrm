import 'server-only'

import { createStaticAdminClient } from '@/lib/supabase/staticAdminClient'
import { getLandingConfig } from '@/lib/public-landing/config'
import { hasValidCronAuthorization } from '@/lib/public-landing/cronAuth'
import { runLandingOutboxBatch } from '@/lib/public-landing/outboxRunner'
import { notifyLandingSubmission } from '@/lib/public-landing/notification'
import { deliverNextLandingNotification } from '@/lib/public-landing/notificationQueue'

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
  const result = await runLandingOutboxBatch(() =>
    deliverNextLandingNotification({
      db,
      organizationId: config.organizationId,
      notify: notifyLandingSubmission,
    }),
  )

  if (result.errors > 0) return json({ ok: false, ...result }, 500)
  return json({ ok: true, ...result })
}
