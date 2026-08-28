import assert from 'node:assert/strict'
import { createLibp2p } from 'libp2p'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { identify } from '@libp2p/identify'
import { gossipsub } from '@libp2p/gossipsub'
import { circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { multiaddr } from '@multiformats/multiaddr'
import { CarbonClubNode, HALL_SYNC_PROTOCOL, HALL_TOPIC, RoomEventLedger, verifyRoomEvent } from '../lib/index.js'

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const relayLedger = new RoomEventLedger()
let relaySyncRequests = 0

async function waitFor(check, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (check()) return
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('Timed out waiting for bootstrap/relay connectivity')
}

const relay = await createLibp2p({
  addresses: { listen: ['/ip4/127.0.0.1/tcp/0/ws'] },
  transports: [webSockets()], connectionEncrypters: [noise()], streamMuxers: [yamux()],
  services: {
    identify: identify(), pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
    relay: circuitRelayServer({ reservations: { maxReservations: 8, defaultDataLimit: 4n * 1024n * 1024n } }),
  },
})
relay.services.pubsub.subscribe(HALL_TOPIC)
relay.services.pubsub.addEventListener('message', event => {
  if (event.detail.topic !== HALL_TOPIC) return
  void Promise.resolve()
    .then(() => JSON.parse(decoder.decode(event.detail.data)))
    .then(parsed => verifyRoomEvent(parsed))
    .then(signed => { relayLedger.accept(signed) })
    .catch(() => {})
})
await relay.handle(HALL_SYNC_PROTOCOL, async stream => {
  relaySyncRequests += 1
  let requestBytes = 0
  for await (const chunk of stream) requestBytes += chunk.byteLength
  if (requestBytes === 0 || requestBytes > 1_024) {
    stream.abort(new Error('Invalid sync request'))
    return
  }
  const data = encoder.encode(JSON.stringify({ version: 1, topic: HALL_TOPIC, events: relayLedger.eventsForSync() }))
  stream.send(data)
  await stream.close()
}, { runOnLimitedConnection: true })
const relayAddress = relay.getMultiaddrs()[0]?.toString()
if (relayAddress === undefined) throw new Error('Relay has no address')

const clientOptions = { bootstrapAddresses: [relayAddress], enableMdns: false }
const client = new CarbonClubNode(await generateKeyPair('Ed25519'), clientOptions)
const lateClient = new CarbonClubNode(await generateKeyPair('Ed25519'), clientOptions)
const malformedPublisher = await createLibp2p({
  addresses: { listen: ['/ip4/127.0.0.1/tcp/0/ws'] },
  transports: [webSockets()], connectionEncrypters: [noise()], streamMuxers: [yamux()],
  services: { identify: identify(), pubsub: gossipsub({ allowPublishToZeroTopicPeers: true, floodPublish: true }) },
})
try {
  malformedPublisher.services.pubsub.subscribe(HALL_TOPIC)
  await malformedPublisher.dial(multiaddr(relayAddress))
  await waitFor(() => malformedPublisher.services.pubsub.getSubscribers(HALL_TOPIC).length >= 1)
  await malformedPublisher.services.pubsub.publish(HALL_TOPIC, encoder.encode('{malformed-json'))
  await new Promise(resolve => setTimeout(resolve, 150))
  assert.equal(relay.status, 'started', 'malformed public messages must not stop the relay')

  await client.start()
  await waitFor(() => client.status().connectedPeers >= 1)
  await waitFor(() => client.status().relayAddresses >= 1)
  await waitFor(() => relay.services.pubsub.getSubscribers(HALL_TOPIC).length >= 1)
  await client.joinHall({ name: 'relay-first' })
  const sent = await client.publishHallMessage({ body: 'Relay memory cache restores this message.' })
  await waitFor(() => relayLedger.snapshot().messages.some(message => message.id === sent.id))

  await lateClient.start()
  await waitFor(() => lateClient.status().connectedPeers >= 1)
  try {
    await waitFor(() => lateClient.roomSnapshot().messages.some(message => message.id === sent.id))
  } catch (error) {
    console.error(JSON.stringify({ relaySyncRequests, relayDiagnostics: relayLedger.diagnostics(), lateStatus: lateClient.status(), lateSnapshot: lateClient.roomSnapshot() }, null, 2))
    throw error
  }
  console.log(JSON.stringify({ relay: relayAddress, client: client.status(), lateClient: lateClient.status(), cachedEventId: sent.id, restored: true }, null, 2))
} finally {
  await Promise.all([client.stop(), lateClient.stop(), malformedPublisher.stop()])
  await relay.stop()
}
