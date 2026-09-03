import { describe, expect, it, vi } from 'vitest'
import { runLandingOutboxBatch } from '@/lib/public-landing/outboxRunner'

describe('landing outbox runner batch', () => {
  it('returns empty without attempting delivery when there are no events', async () => {
    const deliverNext = vi.fn(async () => 'empty' as const)
    await expect(runLandingOutboxBatch(deliverNext)).resolves.toEqual({
      attempted: 0, delivered: 0, retryable: 0, terminal: 0,
      leaseLost: 0, empty: true, errors: 0,
    })
    expect(deliverNext).toHaveBeenCalledTimes(1)
  })

  it('processes outcomes sequentially and stops at empty', async () => {
    const order: number[] = []
    let call = 0
    const deliverNext = vi.fn(async () => {
      const current = call++
      order.push(current)
      if (current === 0) await Promise.resolve()
      return current === 2 ? 'empty' as const : current === 0 ? 'delivered' as const : 'failed_retryable' as const
    })
    await expect(runLandingOutboxBatch(deliverNext)).resolves.toMatchObject({
      attempted: 2, delivered: 1, retryable: 1, empty: true, errors: 0,
    })
    expect(order).toEqual([0, 1, 2])
  })

  it('uses a fixed maximum of ten deliveries', async () => {
    const deliverNext = vi.fn(async () => 'delivered' as const)
    const result = await runLandingOutboxBatch(deliverNext)
    expect(result).toMatchObject({ attempted: 10, delivered: 10, empty: false })
    expect(deliverNext).toHaveBeenCalledTimes(10)
  })

  it('counts terminal and lease-lost outcomes without parallelism', async () => {
    const deliverNext = vi.fn()
      .mockResolvedValueOnce('failed_terminal' as const)
      .mockResolvedValueOnce('lease_lost' as const)
      .mockResolvedValueOnce('empty' as const)
    await expect(runLandingOutboxBatch(deliverNext)).resolves.toMatchObject({
      attempted: 2, terminal: 1, leaseLost: 1, empty: true, errors: 0,
    })
  })

  it('stops and reports an unexpected runner error without exposing details', async () => {
    const deliverNext = vi.fn(async () => { throw new Error('secret-value') })
    await expect(runLandingOutboxBatch(deliverNext)).resolves.toEqual({
      attempted: 0, delivered: 0, retryable: 0, terminal: 0,
      leaseLost: 0, empty: false, errors: 1,
    })
  })
})
