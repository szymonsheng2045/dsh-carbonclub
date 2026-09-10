/** Bounded serial verification: includes the running task in the budget. */
export class BoundedSerialQueue {
  private tail = Promise.resolve()
  private pendingCount = 0
  constructor(readonly capacity = 64) {
    if (!Number.isSafeInteger(capacity) || capacity < 1) throw new Error('Invalid queue capacity')
  }
  get pending(): number { return this.pendingCount }
  enqueue(task: () => Promise<void>): boolean {
    if (this.pendingCount >= this.capacity) return false
    this.pendingCount += 1
    this.tail = this.tail.then(task).catch(() => {}).finally(() => { this.pendingCount -= 1 })
    return true
  }
  async drained(): Promise<void> { await this.tail }
}

/** Abort even when the remote sends no further bytes; checking inside a read
 * loop alone cannot expire a silent peer. Always clear the watchdog on exit. */
export async function withStreamDeadline<T>(stream: { abort(error: Error): void }, action: () => Promise<T>, timeoutMs = 10_000): Promise<T> {
  const timer = setTimeout(() => { stream.abort(new Error('Room sync deadline exceeded')) }, timeoutMs)
  timer.unref()
  try { return await action() } finally { clearTimeout(timer) }
}
