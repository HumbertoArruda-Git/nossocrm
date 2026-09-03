export const LANDING_OUTBOX_BATCH_SIZE = 10

export type LandingOutboxBatchResult = {
  attempted: number
  delivered: number
  retryable: number
  terminal: number
  leaseLost: number
  empty: boolean
  errors: number
}

export type LandingOutboxDelivery = () => Promise<
  'empty' | 'delivered' | 'failed_retryable' | 'failed_terminal' | 'lease_lost'
>

export async function runLandingOutboxBatch(
  deliverNext: LandingOutboxDelivery,
  batchSize = LANDING_OUTBOX_BATCH_SIZE,
): Promise<LandingOutboxBatchResult> {
  const result: LandingOutboxBatchResult = {
    attempted: 0, delivered: 0, retryable: 0, terminal: 0,
    leaseLost: 0, empty: false, errors: 0,
  }

  for (let index = 0; index < batchSize; index += 1) {
    try {
      const outcome = await deliverNext()
      if (outcome === 'empty') {
        result.empty = true
        break
      }

      result.attempted += 1
      if (outcome === 'delivered') result.delivered += 1
      if (outcome === 'failed_retryable') result.retryable += 1
      if (outcome === 'failed_terminal') result.terminal += 1
      if (outcome === 'lease_lost') result.leaseLost += 1
    } catch {
      result.errors += 1
      break
    }
  }

  return result
}
