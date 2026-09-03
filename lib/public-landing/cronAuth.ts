import { timingSafeEqual } from 'node:crypto'

export function hasValidCronAuthorization(request: Request, expectedSecret = process.env.CRON_SECRET): boolean {
  const provided = request.headers.get('authorization') ?? ''
  if (!expectedSecret || !provided.startsWith('Bearer ')) return false

  const token = provided.slice('Bearer '.length).trim()
  const expectedBuffer = Buffer.from(expectedSecret, 'utf8')
  const providedBuffer = Buffer.from(token, 'utf8')
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer)
}
