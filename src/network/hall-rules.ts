export const NETWORK_HALL_RULES = {
  capacity: 500,
  seatCount: 8,
  idleMs: 2 * 60_000,
  maxLeaseMs: 5 * 60_000,
  cooldownMs: 10 * 60_000,
  slowModeMs: 8_000,
  maxConsecutiveMessages: 2,
  presenceHeartbeatMs: 45_000,
  presenceTtlMs: 2 * 60_000,
  clientQueuePreview: 24,
  clientMessageWindow: 50,
} as const
