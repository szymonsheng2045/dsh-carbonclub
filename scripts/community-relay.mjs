import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { createLibp2p } from 'libp2p'
import { privateKeyFromProtobuf, privateKeyToProtobuf, generateKeyPair } from '@libp2p/crypto/keys'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { tcp } from '@libp2p/tcp'
import { identify } from '@libp2p/identify'
import { gossipsub } from '@libp2p/gossipsub'
import { circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { HALL_SYNC_PROTOCOL, HALL_TOPIC, RoomEventLedger, verifyRoomEvent } from '../lib/relay-runtime.js'

const keyFile = resolve(process.env.CARBON_RELAY_KEY_FILE ?? './data/carbon-relay.key')
const listen = (process.env.CARBON_RELAY_LISTEN ?? '/ip4/0.0.0.0/tcp/9090/ws').split(',').map(value => value.trim()).filter(Boolean)
const announce = (process.env.CARBON_RELAY_ANNOUNCE ?? '').split(',').map(value => value.trim()).filter(Boolean)
const maxReservations = Math.min(1_000, Math.max(1, Number(process.env.CARBON_RELAY_MAX_RESERVATIONS ?? 600)))
const maxConnections = Math.min(2_000, Math.max(maxReservations + 64, Number(process.env.CARBON_RELAY_MAX_CONNECTIONS ?? 1_200)))
const maxSyncBytes = 8 * 1024 * 1024
const decoder = new TextDecoder()
const encoder = new TextEncoder()
const ledger = new RoomEventLedger()
const syncWindows = new Map()
const inboundWindows = new Map()
let pendingVerifications = 0

async function loadKey() {
  try { return privateKeyFromProtobuf(Buffer.from(await readFile(keyFile, 'utf8'), 'base64')) } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') throw error
    const key = await generateKeyPair('Ed25519')
    await mkdir(dirname(keyFile), { recursive: true })
    await writeFile(keyFile, Buffer.from(privateKeyToProtobuf(key)).toString('base64'), { mode: 0o600 })
    await chmod(keyFile, 0o600)
    return key
  }
}

const node = await createLibp2p({
  privateKey: await loadKey(),
  addresses: { listen, ...(announce.length === 0 ? {} : { announce }) },
  transports: [tcp(), webSockets()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  connectionManager: { maxConnections, maxIncomingPendingConnections: 128, inboundConnectionThreshold: 128 },
  services: {
    identify: identify(),
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true, emitSelf: false, doPX: true, D: 256, Dlo: 128, Dhi: 600, Dout: 64 }),
    relay: circuitRelayServer({
      reservations: {
        maxReservations, reservationTtl: 60 * 60 * 1_000,
        defaultDurationLimit: 10 * 60 * 1_000, defaultDataLimit: 16n * 1024n * 1024n,
      },
      maxInboundHopStreams: 512, maxOutboundHopStreams: 512, maxOutboundStopStreams: 1_024,
    }),
  },
})

node.services.pubsub.subscribe(HALL_TOPIC)
node.services.pubsub.addEventListener('message', event => {
  if (event.detail.topic !== HALL_TOPIC || event.detail.data.byteLength > 48_000 || pendingVerifications >= 256) return
  const origin = event.detail.type === 'signed' ? event.detail.from.toString() : ''
  const now = Date.now()
  const window = inboundWindows.get(origin)
  if (origin.length < 16 || origin.length > 160 || (window !== undefined && now - window.startedAt < 60_000 && window.count >= 120)) return
  if (window === undefined || now - window.startedAt >= 60_000) {
    for (const [peerId, candidate] of inboundWindows) if (now - candidate.startedAt >= 60_000) inboundWindows.delete(peerId)
    if (window === undefined && inboundWindows.size >= 1_500) return
    inboundWindows.set(origin, { startedAt: now, count: 1 })
  }
  else window.count += 1
  if (inboundWindows.size > 1_500) for (const [peerId, candidate] of inboundWindows) if (now - candidate.startedAt >= 60_000) inboundWindows.delete(peerId)
  pendingVerifications += 1
  void Promise.resolve()
    .then(() => JSON.parse(decoder.decode(event.detail.data)))
    .then(parsed => verifyRoomEvent(parsed))
    .then(signed => { ledger.accept(signed) })
    .catch(() => {})
    .finally(() => { pendingVerifications -= 1 })
})
await node.handle(HALL_SYNC_PROTOCOL, async (stream, connection) => {
  const peerId = connection.remotePeer.toString()
  const now = Date.now()
  const previous = syncWindows.get(peerId) ?? 0
  if (now - previous < 60_000) {
    stream.abort(new Error('Room sync rate limit exceeded'))
    return
  }
  for (const [candidate, at] of syncWindows) if (now - at > 2 * 60_000) syncWindows.delete(candidate)
  if (!syncWindows.has(peerId) && syncWindows.size >= 2_000) {
    stream.abort(new Error('Room sync origin budget exceeded'))
    return
  }
  syncWindows.set(peerId, now)
  let requestBytes = 0
  for await (const chunk of stream) {
    requestBytes += chunk.byteLength
    if (requestBytes > 1_024) {
      stream.abort(new Error('Invalid room sync request'))
      return
    }
  }
  if (requestBytes === 0 || requestBytes > 1_024) {
    stream.abort(new Error('Invalid room sync request'))
    return
  }
  const data = encoder.encode(JSON.stringify({ version: 1, topic: HALL_TOPIC, events: ledger.eventsForSync() }))
  if (data.byteLength > maxSyncBytes) {
    stream.abort(new Error('Room sync snapshot exceeds byte budget'))
    return
  }
  stream.send(data)
  await stream.close()
}, { maxInboundStreams: 4, maxOutboundStreams: 4, runOnLimitedConnection: true })
const addresses = node.getMultiaddrs().map(address => address.toString())
console.log(JSON.stringify({ event: 'carbon-relay.ready', peerId: node.peerId.toString(), addresses, maxReservations, maxConnections, hallCapacity: 500 }))
const healthTimer = setInterval(() => {
  console.log(JSON.stringify({
    event: 'carbon-relay.health',
    at: new Date().toISOString(),
    connections: node.getConnections().length,
    topicPeers: node.services.pubsub.getSubscribers(HALL_TOPIC).length,
    pendingVerifications,
    ...ledger.diagnostics(),
    rssMiB: Number((process.memoryUsage().rss / (1024 * 1024)).toFixed(1)),
  }))
}, 60_000)
healthTimer.unref()

async function shutdown(signal) {
  clearInterval(healthTimer)
  console.log(JSON.stringify({ event: 'carbon-relay.stopping', signal }))
  await node.stop()
  process.exit(0)
}

process.once('SIGINT', () => { void shutdown('SIGINT') })
process.once('SIGTERM', () => { void shutdown('SIGTERM') })
