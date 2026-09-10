import { describe, expect, it, vi } from 'vitest'
import { BoundedSerialQueue, withStreamDeadline } from '../src/network/resource-budget.js'

describe('network resource budgets', () => {
  it('admits only 64 pending tasks from a burst and recovers after failures', async () => {
    const queue = new BoundedSerialQueue(64)
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    const accepted = Array.from({ length: 2000 }, () => queue.enqueue(async () => { await gate; throw new Error('bad signature') })).filter(Boolean)
    expect(accepted).toHaveLength(64)
    expect(queue.pending).toBe(64)
    release()
    await queue.drained()
    expect(queue.pending).toBe(0)
    let processed = false
    expect(queue.enqueue(async () => { processed = true })).toBe(true)
    await queue.drained()
    expect(processed).toBe(true)
  })
  it('expires a completely silent stream without needing another chunk', async () => {
    vi.useFakeTimers()
    try {
      let rejectRead!: (error: Error) => void
      const blockedRead = new Promise<void>((_, reject) => { rejectRead = reject })
      const abort = vi.fn((error: Error) => rejectRead(error))
      const finished = withStreamDeadline({ abort }, () => blockedRead)
      const assertion = expect(finished).rejects.toThrow('deadline')
      await vi.advanceTimersByTimeAsync(10001)
      await assertion
      expect(abort).toHaveBeenCalledTimes(1)
      expect(vi.getTimerCount()).toBe(0)
    } finally { vi.useRealTimers() }
  })
  it('clears the timer on normal completion or a handler error', async () => {
    vi.useFakeTimers()
    try {
      const abort = vi.fn()
      await withStreamDeadline({ abort }, async () => undefined)
      await expect(withStreamDeadline({ abort }, async () => { throw Error('invalid') })).rejects.toThrow('invalid')
      await vi.advanceTimersByTimeAsync(10001)
      expect(abort).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
    } finally { vi.useRealTimers() }
  })
})
