import assert from 'node:assert/strict'
import { createLibp2p } from 'libp2p'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { identify } from '@libp2p/identify'
import { gossipsub } from '@libp2p/gossipsub'
import { multiaddr } from '@multiformats/multiaddr'
import { CarbonClubNode, HALL_TOPIC, signPresenceEvent } from '../lib/index.js'

const encoder = new TextEncoder()

async function waitFor(check, message, timeoutMs = 12_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (check()) return
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(message)
}

const receiverKey = await generateKeyPair('Ed25519')
const victimKey = await generateKeyPair('Ed25519')
const attackerKey = await generateKeyPair('Ed25519')
const isolated = { enableMdns: false, enableRelayReservations: false }
const receiver = new CarbonClubNode(receiverKey, isolated)
const victim = new CarbonClubNode(victimKey, isolated)
const attacker = await createLibp2p({
  privateKey: attackerKey,
  addresses: { listen: ['/ip4/127.0.0.1/tcp/0/ws'] },
  transports: [webSockets()], connectionEncrypters: [noise()], streamMuxers: [yamux()],
  services: { identify: identify(), pubsub: gossipsub({ allowPublishToZeroTopicPeers: true, floodPublish: true }) },
})

try {
  await Promise.all([receiver.start(), victim.start()])
  const invite = await receiver.createInvite()
  await victim.connect(invite.code)
  const directAddress = invite.addresses.find(address => !address.includes('/p2p-circuit'))
  assert.ok(directAddress, 'receiver must expose a direct test address')
  attacker.services.pubsub.subscribe(HALL_TOPIC)
  await attacker.dial(multiaddr(directAddress))
  await waitFor(() => attacker.services.pubsub.getSubscribers(HALL_TOPIC).length >= 1, 'attacker did not join the test mesh')

  const victimPeerId = victim.status().peerId
  assert.ok(victimPeerId, 'victim must expose a Peer ID')
  const validAttackerEvent = await signPresenceEvent(attackerKey, {
    action: 'join', profile: { name: 'attacker' }, joinedAt: Date.now(),
  }, 1, Date.now())
  const forged = encoder.encode(JSON.stringify({ ...validAttackerEvent, origin: victimPeerId }))
  for (let index = 0; index < 25; index += 1) await attacker.services.pubsub.publish(HALL_TOPIC, forged)
  await new Promise(resolve => setTimeout(resolve, 300))

  await victim.joinHall({ name: 'legitimate-victim' })
  await waitFor(
    () => receiver.roomSnapshot().seats.some(seat => seat?.participant.peerId === victimPeerId),
    'forged pre-verification origins silenced the legitimate victim',
  )
  assert.equal(receiver.roomSnapshot().participantCount, 1)
  console.log(JSON.stringify({ ok: true, forgedAttempts: 25, victimPeerId, admittedAfterAttack: true }, null, 2))
} finally {
  await Promise.allSettled([receiver.stop(), victim.stop(), attacker.stop()])
}
