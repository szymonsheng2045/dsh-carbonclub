import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { RoomEventLedger } from '../lib/index.js'

function presence(index, action, sequence, issuedAt, joinedAt) {
  const origin = `capacity-peer-${index.toString().padStart(4, '0')}`
  const avatarCid = `sha256:${index.toString(16).padStart(64, '0')}`
  const avatarUrl = `data:image/webp;base64,${Buffer.alloc(8 * 1024, index % 251).toString('base64')}`
  return {
    version: 1,
    roomId: 'hall',
    eventId: `capacity-${index}-${sequence}-${issuedAt}`,
    origin,
    sequence,
    issuedAt,
    publicKey: 'capacity-fixture',
    signature: 'capacity-fixture',
    kind: 'hall.presence',
    payload: {
      action,
      joinedAt,
      ...(action === 'join' ? { profile: { name: `peer-${index}`, avatarCid, avatarUrl }, admission: { epoch: 0, nonce: 0 } } : {}),
    },
  }
}

const ledger = new RoomEventLedger()
const base = Date.now() - 5_000
const heapBefore = process.memoryUsage().heapUsed
const acceptStarted = performance.now()

for (let index = 0; index < 501; index += 1) ledger.accept(presence(index, 'join', 1, base + index, base + index))
for (let cycle = 0; cycle < 4; cycle += 1) {
  for (let index = 0; index < 500; index += 1) ledger.accept(presence(index, 'heartbeat', cycle + 2, base + 1_000 + cycle * 500 + index, base + index))
}

const acceptMs = performance.now() - acceptStarted
const snapshotStarted = performance.now()
const snapshot = ledger.snapshot(base + 4_000, 'capacity-peer-0499')
const snapshotMs = performance.now() - snapshotStarted
const syncEvents = ledger.eventsForSync(1_300, base + 4_000)
const snapshotBytes = Buffer.byteLength(JSON.stringify(snapshot))
const syncBytes = Buffer.byteLength(JSON.stringify({ version: 1, topic: '/dsh-human-buffer/room/hall/0.5.0', events: syncEvents }))
const heapGrowthMiB = (process.memoryUsage().heapUsed - heapBefore) / (1024 * 1024)

assert.equal(snapshot.capacity, 500)
assert.equal(snapshot.participantCount, 500)
assert.equal(snapshot.queueCount, 492)
assert.equal(snapshot.queue.length, 24)
assert.equal(snapshot.localQueuePosition, 492)
assert.ok(snapshotBytes < 128 * 1024, `compact browser snapshot is ${snapshotBytes} bytes`)
assert.ok(syncEvents.length <= 1_201, `sync event count is ${syncEvents.length}`)
assert.ok(syncBytes < 8 * 1024 * 1024, `sync snapshot is ${syncBytes} bytes`)
assert.ok(acceptMs < 5_000, `event ingestion took ${acceptMs.toFixed(1)} ms`)
assert.ok(snapshotMs < 500, `snapshot derivation took ${snapshotMs.toFixed(1)} ms`)

console.log(JSON.stringify({
  ok: true,
  simulatedParticipants: 501,
  admittedParticipants: snapshot.participantCount,
  speakingSeats: snapshot.seats.filter(Boolean).length,
  queueCount: snapshot.queueCount,
  browserQueuePreview: snapshot.queue.length,
  syncEvents: syncEvents.length,
  snapshotBytes,
  syncBytes,
  acceptMs: Number(acceptMs.toFixed(1)),
  snapshotMs: Number(snapshotMs.toFixed(1)),
  heapGrowthMiB: Number(heapGrowthMiB.toFixed(1)),
}, null, 2))
