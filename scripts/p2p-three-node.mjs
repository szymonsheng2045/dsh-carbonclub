import assert from 'node:assert/strict'
import { createLibp2p } from 'libp2p'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'
import { gossipsub } from '@libp2p/gossipsub'
import { HALL_TOPIC, signPresenceEvent, signRoomEvent, verifyRoomEvent } from '../lib/index.js'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

async function createNode(privateKey) {
  return createLibp2p({
    privateKey,
    addresses: { listen: ['/ip4/127.0.0.1/tcp/0/ws'] },
    transports: [webSockets()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      identify: identify(),
      pubsub: gossipsub({ emitSelf: false, floodPublish: true }),
    },
  })
}

function waitForSignedEvent(node, eventId, timeoutMs = 8_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      node.services.pubsub.removeEventListener('message', onMessage)
      reject(new Error(`timed out waiting for ${HALL_TOPIC}`))
    }, timeoutMs)
    async function onMessage(event) {
      if (event.detail.topic !== HALL_TOPIC) return
      try {
        const signed = await verifyRoomEvent(JSON.parse(decoder.decode(event.detail.data)))
        if (signed.eventId !== eventId) return
        clearTimeout(timer)
        node.services.pubsub.removeEventListener('message', onMessage)
        resolve({ signed, wire: event.detail })
      } catch {
        // Keep waiting for the expected valid event.
      }
    }
    node.services.pubsub.addEventListener('message', onMessage)
  })
}

async function waitForMesh(node, expectedPeers, timeoutMs = 8_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (node.services.pubsub.getSubscribers(HALL_TOPIC).length >= expectedPeers) return
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`pubsub mesh did not reach ${expectedPeers} peer(s)`)
}

const keys = await Promise.all(Array.from({ length: 3 }, () => generateKeyPair('Ed25519')))
const nodes = await Promise.all(keys.map(createNode))
const [waitingRoom, traveller, observer] = nodes

try {
  for (const node of nodes) node.services.pubsub.subscribe(HALL_TOPIC)

  // A temporary room peer connects two ordinary users. No application-owned
  // database, message API or model service participates in this topology.
  const roomAddress = waitingRoom.getMultiaddrs()[0]
  assert.ok(roomAddress, 'waiting-room peer must expose a local address')
  await traveller.dial(roomAddress)
  await observer.dial(roomAddress)

  await Promise.all([
    waitForMesh(waitingRoom, 2),
    waitForMesh(traveller, 1),
    waitForMesh(observer, 1),
  ])

  const now = Date.now()
  const presence = await signPresenceEvent(keys[1], { action: 'join', profile: { name: '旅客' }, joinedAt: now }, 1, now)
  const receivedPresence = waitForSignedEvent(observer, presence.eventId)
  await traveller.services.pubsub.publish(HALL_TOPIC, encoder.encode(JSON.stringify(presence)))
  await receivedPresence

  const chat = await signRoomEvent(keys[1], { body: '三节点之间的人类消息，不进入 Agent 上下文。' }, 2, now + 1)
  const receivedChat = waitForSignedEvent(observer, chat.eventId)
  await traveller.services.pubsub.publish(HALL_TOPIC, encoder.encode(JSON.stringify(chat)))
  const result = await receivedChat

  assert.deepEqual(result.signed, chat)
  assert.equal(result.signed.origin, traveller.peerId.toString())
  assert.notEqual(observer.peerId.toString(), traveller.peerId.toString())
  assert.equal('prompt' in result.signed, false)
  assert.equal('sessionId' in result.signed, false)

  console.log(JSON.stringify({
    ok: true,
    topology: 'traveller -> waiting-room peer -> observer',
    topic: HALL_TOPIC,
    peers: nodes.map(node => node.peerId.toString()),
    eventId: chat.eventId,
    bytes: encoder.encode(JSON.stringify(chat)).byteLength,
    verified: true,
  }, null, 2))
} finally {
  await Promise.all(nodes.map(node => node.stop()))
}
