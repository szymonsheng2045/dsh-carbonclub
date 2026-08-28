import { createLibp2p } from 'libp2p'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { gossipsub } from '@libp2p/gossipsub'
import { identify } from '@libp2p/identify'
import { circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { CarbonClubNode, HALL_TOPIC } from '../lib/index.js'

async function waitFor(check, message, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (check()) return
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(message)
}

async function createRouter() {
  const router = await createLibp2p({
    addresses: { listen: ['/ip4/127.0.0.1/tcp/0/ws'] },
    transports: [webSockets()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    connectionManager: { maxConnections: 32, maxIncomingPendingConnections: 16 },
    services: {
      identify: identify(),
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        emitSelf: false,
        floodPublish: true,
        doPX: true,
        D: 6,
        Dlo: 4,
        Dhi: 12,
        Dout: 2,
      }),
      relay: circuitRelayServer({ reservations: { maxReservations: 16, defaultDataLimit: 4n * 1024n * 1024n } }),
    },
  })
  router.services.pubsub.subscribe(HALL_TOPIC)
  const address = router.getMultiaddrs()[0]?.toString()
  if (address === undefined) throw new Error('Router has no WebSocket address')
  return { router, address }
}

const first = await createRouter()
const second = await createRouter()
const bootstrapAddresses = [first.address, second.address]
const clientOptions = { bootstrapAddresses, enableMdns: false, enableRelayReservations: false }
const alice = new CarbonClubNode(await generateKeyPair('Ed25519'), clientOptions)
const bob = new CarbonClubNode(await generateKeyPair('Ed25519'), clientOptions)

try {
  console.error('failover: starting clients')
  await Promise.all([alice.start(), bob.start()])
  await waitFor(() => alice.status().connectedPeers >= 2 && bob.status().connectedPeers >= 2, 'Clients did not attach to both routers')
  await waitFor(
    () => first.router.services.pubsub.getSubscribers(HALL_TOPIC).length >= 2
      && second.router.services.pubsub.getSubscribers(HALL_TOPIC).length >= 2,
    'Both routers did not establish the hall mesh',
  )

  console.error('failover: converging initial room state')
  await Promise.all([
    alice.joinHall({ name: 'failover-alice' }),
    bob.joinHall({ name: 'failover-bob' }),
  ])
  await waitFor(() => alice.roomSnapshot().participantCount === 2 && bob.roomSnapshot().participantCount === 2, 'Initial room state did not converge')

  console.error('failover: removing first router')
  await Promise.allSettled(first.router.getConnections().map(connection => connection.close()))
  await first.router.stop()
  await waitFor(() => alice.status().connectedPeers === 1 && bob.status().connectedPeers === 1, 'Clients did not observe the first router failure')
  await new Promise(resolve => setTimeout(resolve, 1_500))

  console.error('failover: sending through surviving router')
  const sent = await alice.publishHallMessage({ body: 'The second router kept the hall alive.' })
  await waitFor(() => bob.roomSnapshot().messages.some(message => message.id === sent.id), 'Message did not survive the first router failure')

  console.log(JSON.stringify({
    ok: true,
    failedRouter: first.address,
    survivingRouter: second.address,
    alice: alice.status(),
    bob: bob.status(),
    deliveredEventId: sent.id,
  }, null, 2))
} finally {
  await Promise.allSettled([alice.stop(), bob.stop(), first.router.stop(), second.router.stop()])
}
