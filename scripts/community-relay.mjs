import { chmod, lstat, mkdir, readFile, writeFile } from 'node:fs/promises'
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
import { startReviewServer, stopReviewServer } from './review-server.mjs'

const keyFile = resolve(process.env.CARBON_RELAY_KEY_FILE ?? './data/carbon-relay.key')
const listen = (process.env.CARBON_RELAY_LISTEN ?? '/ip4/127.0.0.1/tcp/9090/ws').split(',').map(value => value.trim()).filter(Boolean)
const announce = (process.env.CARBON_RELAY_ANNOUNCE ?? '').split(',').map(value => value.trim()).filter(Boolean)
const maxReservations = Math.min(1_000, Math.max(1, Number(process.env.CARBON_RELAY_MAX_RESERVATIONS ?? 600)))
const maxConnections = Math.min(2_000, Math.max(maxReservations + 64, Number(process.env.CARBON_RELAY_MAX_CONNECTIONS ?? 1_200)))
const maxSyncBytes = 8 * 1024 * 1024
const reviewPort = Number(process.env.CARBON_RELAY_REVIEW_PORT ?? 0)
const reviewTokenFile = process.env.CARBON_RELAY_REVIEW_TOKEN_FILE
const decoder = new TextDecoder()
const encoder = new TextEncoder()
const ledger = new RoomEventLedger()
const syncWindows = new Map()
const inboundWindows = new Map()
const maxSyncsPerMinute = 60
let globalSyncWindow = { startedAt: 0, count: 0 }
let pendingVerifications = 0
const startedAt = new Date().toISOString()

if (!Number.isInteger(reviewPort) || reviewPort < 0 || reviewPort > 65_535) throw new Error('CARBON_RELAY_REVIEW_PORT must be an integer between 0 and 65535')
if ((reviewPort > 0) !== (reviewTokenFile !== undefined && reviewTokenFile.length > 0)) {
  throw new Error('CARBON_RELAY_REVIEW_PORT and CARBON_RELAY_REVIEW_TOKEN_FILE must be configured together')
}

async function readPrivateFile(path, label) {
  const metadata = await lstat(path)
  if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error(`${label} must be a regular, non-symlink file`)
  if ((metadata.mode & 0o077) !== 0) throw new Error(`${label} permissions must not grant group or other access`)
  if (typeof process.getuid === 'function' && metadata.uid !== process.getuid()) throw new Error(`${label} must be owned by the service user`)
  return readFile(path, 'utf8')
}

async function loadKey() {
  try { return privateKeyFromProtobuf(Buffer.from(await readPrivateFile(keyFile, 'Relay private key'), 'base64')) } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error
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
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true, emitSelf: false, doPX: false, D: 256, Dlo: 128, Dhi: 600, Dout: 64 }),
    relay: circuitRelayServer({
      reservations: {
        maxReservations, reservationTtl: 60 * 60 * 1_000,
        applyDefaultLimit: true,
        defaultDurationLimit: 10 * 60 * 1_000, defaultDataLimit: 16n * 1024n * 1024n,
      },
      maxInboundHopStreams: 512, maxOutboundHopStreams: 512, maxOutboundStopStreams: Math.min(maxReservations, 600),
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
  const requestChunks = []
  let requestBytes = 0
  for await (const chunk of stream) {
    requestBytes += chunk.byteLength
    if (requestBytes > 1_024) {
      stream.abort(new Error('Invalid room sync request'))
      return
    }
    requestChunks.push(chunk.subarray())
  }
  if (requestBytes === 0 || requestBytes > 1_024) {
    stream.abort(new Error('Invalid room sync request'))
    return
  }
  const requestData = new Uint8Array(requestBytes)
  let requestOffset = 0
  for (const chunk of requestChunks) { requestData.set(chunk, requestOffset); requestOffset += chunk.byteLength }
  let request
  try {
    const decoded = JSON.parse(decoder.decode(requestData))
    if (typeof decoded !== 'object' || decoded === null || decoded.version !== 1 || decoded.topic !== HALL_TOPIC || !('request' in decoded)) throw new Error('Invalid sync envelope')
    request = await verifyRoomEvent(decoded.request)
    if (request.kind !== 'room.sync.request' || request.origin !== peerId || request.payload.targetPeerId !== node.peerId.toString()) throw new Error('Invalid sync requester')
  } catch {
    stream.abort(new Error('Invalid signed room sync request'))
    return
  }
  if (now - globalSyncWindow.startedAt >= 60_000) globalSyncWindow = { startedAt: now, count: 0 }
  if (globalSyncWindow.count >= maxSyncsPerMinute) {
    stream.abort(new Error('Global room sync budget exceeded'))
    return
  }
  globalSyncWindow.count += 1
  const data = encoder.encode(JSON.stringify({ version: 1, topic: HALL_TOPIC, events: ledger.eventsForSync() }))
  if (data.byteLength > maxSyncBytes) {
    stream.abort(new Error('Room sync snapshot exceeds byte budget'))
    return
  }
  stream.send(data)
  await stream.close()
}, { maxInboundStreams: 4, maxOutboundStreams: 4, runOnLimitedConnection: true })
const addresses = node.getMultiaddrs().map(address => address.toString())
const packageVersion = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')).version
const reviewServer = reviewPort > 0 ? await startReviewServer({
  port: reviewPort,
  tokenFile: reviewTokenFile,
  report: () => ({
    schemaVersion: 1,
    service: 'dsh-carbon-relay',
    release: packageVersion,
    startedAt,
    observedAt: new Date().toISOString(),
    peerId: node.peerId.toString(),
    addresses,
    limits: { maxReservations, maxConnections, maxSyncBytes, maxSyncsPerMinute, hallCapacity: 500 },
    health: {
      connections: node.getConnections().length,
      topicPeers: node.services.pubsub.getSubscribers(HALL_TOPIC).length,
      pendingVerifications,
      ...ledger.diagnostics(),
      rssMiB: Number((process.memoryUsage().rss / (1024 * 1024)).toFixed(1)),
    },
    privacy: {
      rawMessages: false,
      remotePeerAddresses: false,
      privateKeys: false,
      remoteControl: false,
    },
  }),
}) : undefined
console.log(JSON.stringify({ event: 'carbon-relay.ready', peerId: node.peerId.toString(), addresses, maxReservations, maxConnections, hallCapacity: 500 }))
if (reviewServer !== undefined) console.log(JSON.stringify({ event: 'carbon-relay.review-ready', address: `http://127.0.0.1:${reviewPort}`, access: 'token-required', remoteControl: false }))
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
  await stopReviewServer(reviewServer)
  await node.stop()
  process.exit(0)
}

process.once('SIGINT', () => { void shutdown('SIGINT') })
process.once('SIGTERM', () => { void shutdown('SIGTERM') })
