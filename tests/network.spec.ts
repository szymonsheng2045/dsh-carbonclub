import { describe, expect, it } from 'vitest'
import { generateKeyPair, privateKeyToProtobuf } from '@libp2p/crypto/keys'
import { peerIdFromPublicKey } from '@libp2p/peer-id'
import { CarbonClubNode } from '../src/network/node.js'
import { decodeInvite, encodeInvite } from '../src/network/invite.js'
import { loadOrCreatePrivateKey } from '../src/network/identity.js'
import { TYPERT } from '../src/typert.host.js'
import { TYPERT_REMOTE } from '../src/typert.remote-client.js'
import { contentAddressProfile, RoomEventLedger, signCheckpointEvent, signPresenceEvent, signRoomEvent, verifyRoomEvent } from '../src/network/room-events.js'
import { createProjectInvite, decodeProjectInvite, decryptProjectPayload, encodeProjectInvite, encryptProjectPayload, rotateProjectInvite } from '../src/network/project-crypto.js'
import type { SignedRoomEvent } from '../src/network/types.js'

async function waitFor(check: () => boolean, timeoutMs = 5_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (check()) return
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error('timed out waiting for replicated room event')
}

function syntheticPresence(index: number, action: 'join' | 'heartbeat' | 'leave', sequence: number, issuedAt: number, joinedAt: number): SignedRoomEvent {
  const origin = `synthetic-peer-${index.toString().padStart(4, '0')}`
  return {
    version: 1, roomId: 'hall', eventId: `synthetic-${index}-${sequence}-${issuedAt}`, origin, sequence, issuedAt,
    publicKey: 'synthetic', signature: 'synthetic', kind: 'hall.presence',
    payload: action === 'leave' ? { action } : { action, joinedAt, ...(action === 'join' ? { profile: { name: `peer-${index}` }, admission: { epoch: 0, nonce: 0 } } : {}) },
  }
}

function syntheticMessage(index: number, issuedAt: number): SignedRoomEvent {
  return {
    version: 1, roomId: 'hall', eventId: `synthetic-message-${index}-${issuedAt}`,
    origin: `rotated-attacker-${index.toString().padStart(5, '0')}`, sequence: 1, issuedAt,
    publicKey: 'synthetic', signature: 'synthetic', kind: 'chat.message', payload: { body: 'not admitted' },
  }
}

describe('Carbon Club decentralized transport', () => {
  it('persists one private identity through the DSH credential seam', async () => {
    let stored: string | undefined
    const credentials = {
      resolve: async () => stored === undefined ? undefined : { value: stored, source: 'test' },
      set: async (_ref: unknown, value: string) => { stored = value },
    } as unknown as Parameters<typeof loadOrCreatePrivateKey>[0]
    const first = await loadOrCreatePrivateKey(credentials)
    const second = await loadOrCreatePrivateKey(credentials)
    expect(Buffer.from(privateKeyToProtobuf(first))).toEqual(Buffer.from(privateKeyToProtobuf(second)))
    expect(stored).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })

  it('publishes the same strict Host and browser RPC descriptors', () => {
    expect(TYPERT.package).toBe('dsh-human-buffer')
    expect(TYPERT.face).toBe('host')
    expect(TYPERT_REMOTE.descriptors.map(item => item.id)).toEqual(TYPERT.invocations.map(item => item.id))
    expect(TYPERT.invocations.every(item => item.result.mode === 'strict')).toBe(true)
  })

  it('verifies author identity and rejects tampering and replay', async () => {
    const key = await generateKeyPair('Ed25519')
    const ledger = new RoomEventLedger()
    const presence = await signPresenceEvent(key, { action: 'join', profile: { name: '测试人类' }, joinedAt: 9_000 }, 10, 9_000)
    ledger.accept(await verifyRoomEvent(presence, 9_001))
    const first = await signRoomEvent(key, { body: '不进入 Agent 上下文' }, 11, 10_000)
    const verified = await verifyRoomEvent(first, 10_001)
    expect(ledger.accept(verified)?.body).toBe('不进入 Agent 上下文')
    expect(ledger.accept(verified)).toBeUndefined()

    const older = await verifyRoomEvent(await signRoomEvent(key, { body: '旧序号' }, 10, 10_002), 10_003)
    expect(ledger.accept(older)).toBeUndefined()
    await expect(verifyRoomEvent({ ...first, payload: { ...first.payload, body: '篡改内容' } }, 10_001)).rejects.toThrow(/signature/)
  })

  it('bounds replay state and rejects key-rotating messages without admission', () => {
    const ledger = new RoomEventLedger()
    for (let index = 0; index < 5_000; index += 1) ledger.accept(syntheticMessage(index, 11_000 + index))
    expect(ledger.diagnostics(20_000).trackedSequenceOrigins).toBe(0)
    expect(ledger.diagnostics(20_000).retainedEvents).toBe(0)

    for (let index = 0; index < 1_800; index += 1) {
      const joinedAt = 30_000 + index * 2
      ledger.accept(syntheticPresence(index, 'join', 1, joinedAt, joinedAt))
      ledger.accept(syntheticPresence(index, 'leave', 2, joinedAt + 1, joinedAt))
    }
    expect(ledger.diagnostics(40_000).trackedSequenceOrigins).toBeLessThanOrEqual(1_500)
    expect(ledger.diagnostics(40_000).activeParticipants).toBe(0)
  })

  it('encodes a bounded, expiring direct-dial invite', async () => {
    const node = new CarbonClubNode(await generateKeyPair('Ed25519'))
    await node.start()
    try {
      const invite = await node.createInvite(1_000)
      const decoded = await decodeInvite(invite.code, 1_001)
      expect(decoded.peerId).toBe(invite.peerId)
      expect(decoded.addresses.every(address => address.endsWith(`/p2p/${invite.peerId}`))).toBe(true)
      await expect(decodeInvite(encodeInvite({ ...decoded, expiresAt: decoded.expiresAt + 1 }), 1_001)).rejects.toThrow(/signature/)
      await expect(decodeInvite(invite.code, invite.expiresAt + 1)).rejects.toThrow(/expired/)
    } finally {
      await node.stop()
    }
  })

  it('rejects an address whose authenticated peer id differs from the invite', async () => {
    const first = new CarbonClubNode(await generateKeyPair('Ed25519'))
    const second = new CarbonClubNode(await generateKeyPair('Ed25519'))
    await Promise.all([first.start(), second.start()])
    try {
      const firstInvite = await first.createInvite(1_000)
      const secondInvite = await second.createInvite(1_000)
      const decodedFirst = await decodeInvite(firstInvite.code, 1_001)
      const mismatched = encodeInvite({
        ...decodedFirst, addresses: secondInvite.addresses,
      })
      await expect(decodeInvite(mismatched, 1_001)).rejects.toThrow(/bound to its peer identity/)
    } finally {
      await Promise.all([first.stop(), second.stop()])
    }
  })

  it('connects two independent Host nodes from an invite', async () => {
    const host = new CarbonClubNode(await generateKeyPair('Ed25519'))
    const guest = new CarbonClubNode(await generateKeyPair('Ed25519'))
    await Promise.all([host.start(), guest.start()])
    try {
      const result = await guest.connect((await host.createInvite()).code)
      expect(result).toEqual({ connected: true, peerId: host.status().peerId })
      expect(guest.status().connectedPeers).toBeGreaterThan(0)
    } finally {
      await Promise.all([host.stop(), guest.stop()])
    }
  })

  it('replicates a signed human message between two Host nodes', async () => {
    const host = new CarbonClubNode(await generateKeyPair('Ed25519'))
    const guest = new CarbonClubNode(await generateKeyPair('Ed25519'))
    await Promise.all([host.start(), guest.start()])
    try {
      await guest.connect((await host.createInvite()).code)
      await new Promise(resolve => setTimeout(resolve, 250))
      await guest.joinHall({ name: '旅客', avatarUrl: `data:image/webp;base64,${Buffer.from('integration-avatar').toString('base64')}` })
      await waitFor(() => host.roomSnapshot().seats.some(seat => seat?.participant.peerId === guest.status().peerId))
      const sent = await guest.publishHallMessage({ body: '真实 P2P 消息' })
      await waitFor(() => host.roomSnapshot().messages.some(message => message.id === sent.id))
      expect(host.roomSnapshot().messages.at(-1)).toEqual(sent)
      expect(sent.origin).toBe(guest.status().peerId)
    } finally {
      await Promise.all([host.stop(), guest.stop()])
    }
  })

  it('enforces eight signed speaking seats and queues the ninth peer', async () => {
    const ledger = new RoomEventLedger()
    const keys = await Promise.all(Array.from({ length: 9 }, () => generateKeyPair('Ed25519')))
    for (const [index, key] of keys.entries()) {
      const joinedAt = 10_000 + index
      const event = await signPresenceEvent(key, { action: 'join', profile: { name: `peer-${index}` }, joinedAt }, 1, joinedAt)
      ledger.accept(await verifyRoomEvent(event, joinedAt + 1))
    }
    const snapshot = ledger.snapshot(10_100)
    expect(snapshot.seats.filter(Boolean)).toHaveLength(8)
    expect(snapshot.queue).toHaveLength(1)

    const rejected = await signRoomEvent(keys[8]!, { body: '我还在排队' }, 2, 10_200)
    expect(ledger.accept(await verifyRoomEvent(rejected, 10_201))).toBeUndefined()
    const accepted = await signRoomEvent(keys[0]!, { body: '我有发言席' }, 2, 10_200)
    expect(ledger.accept(await verifyRoomEvent(accepted, 10_201))?.body).toBe('我有发言席')
  })

  it('syncs recent signed history to a peer that joins late', async () => {
    const host = new CarbonClubNode(await generateKeyPair('Ed25519'))
    const lateGuest = new CarbonClubNode(await generateKeyPair('Ed25519'))
    await Promise.all([host.start(), lateGuest.start()])
    try {
      await host.joinHall({ name: '先到的人' })
      const sent = await host.publishHallMessage({ body: '迟到的人也能补到这条' })
      await lateGuest.connect((await host.createInvite()).code)
      await waitFor(() => lateGuest.roomSnapshot().messages.some(message => message.id === sent.id), 8_000)
    } finally {
      await Promise.all([host.stop(), lateGuest.stop()])
    }
  }, 12_000)

  it('keeps a compact, recoverable 500-person roster after repeated heartbeats', () => {
    const ledger = new RoomEventLedger()
    const base = Date.now() - 5_000
    for (let index = 0; index < 501; index += 1) ledger.accept(syntheticPresence(index, 'join', 1, base + index, base + index))
    for (let cycle = 0; cycle < 4; cycle += 1) {
      for (let index = 0; index < 500; index += 1) ledger.accept(syntheticPresence(index, 'heartbeat', cycle + 2, base + 1_000 + cycle * 500 + index, base + index))
    }

    const viewer = 'synthetic-peer-0499'
    const compact = ledger.snapshot(base + 4_000, viewer)
    expect(compact.capacity).toBe(500)
    expect(compact.participantCount).toBe(500)
    expect(compact.queueCount).toBe(492)
    expect(compact.queue).toHaveLength(24)
    expect(compact.localQueuePosition).toBe(492)
    expect(Buffer.byteLength(JSON.stringify(compact))).toBeLessThan(128 * 1024)

    const syncEvents = ledger.eventsForSync(1_300, base + 4_000)
    expect(syncEvents.length).toBeLessThanOrEqual(1_201)
    const lateLedger = new RoomEventLedger()
    for (const event of syncEvents) lateLedger.accept(event)
    expect(lateLedger.snapshot(base + 4_000).participantCount).toBe(500)
    expect(lateLedger.snapshot(base + 4_000).queueCount).toBe(492)
  }, 12_000)

  it('uses content-addressed avatars once and serves cursor deltas', async () => {
    const key = await generateKeyPair('Ed25519')
    const ledger = new RoomEventLedger()
    const avatarUrl = `data:image/webp;base64,${Buffer.from('tiny-avatar').toString('base64')}`
    const profile = contentAddressProfile({ name: '有头像的人', avatarUrl })
    const join = await signPresenceEvent(key, { action: 'join', profile, joinedAt: 20_000 }, 1, 20_000)
    ledger.accept(await verifyRoomEvent(join, 20_001))
    const cursor = ledger.snapshot(20_001).cursor
    const message = await signRoomEvent(key, { body: '增量消息' }, 2, 21_000)
    ledger.accept(await verifyRoomEvent(message, 21_001))
    const delta = ledger.delta(cursor, 21_001)
    expect(delta.reset).toBe(false)
    expect(delta.messages.map(item => item.id)).toEqual([message.eventId])
    expect(Object.keys(delta.avatars)).toEqual([profile.avatarCid])
    expect(delta.profiles[message.origin]?.avatarUrl).toBeUndefined()
    expect(delta.profiles[message.origin]?.avatarCid).toBe(profile.avatarCid)
  })

  it('rejects stale backdated joins and accepts a steward checkpoint', async () => {
    const keys = await Promise.all([generateKeyPair('Ed25519'), generateKeyPair('Ed25519')])
    const ledger = new RoomEventLedger()
    for (const [index, key] of keys.entries()) {
      const at = 30_000 + index
      const join = await signPresenceEvent(key, { action: 'join', profile: { name: `p${index}` }, joinedAt: at }, 1, at)
      ledger.accept(await verifyRoomEvent(join, at + 1))
    }
    const stale = await signPresenceEvent(await generateKeyPair('Ed25519'), { action: 'join', profile: { name: 'backdated' }, joinedAt: 1_000 }, 1, 1_000)
    await expect(verifyRoomEvent(stale, 31_001)).rejects.toThrow(/stale/)

    const at = 40_000
    const payload = ledger.checkpointPayload(at)!
    const stewardKey = keys.find(key => peerIdFromPublicKey(key.publicKey).toString() === payload.stewardPeerId)!
    const checkpoint = await signCheckpointEvent(stewardKey, payload, 2, at)
    ledger.accept(await verifyRoomEvent(checkpoint, at + 1))
    expect(ledger.snapshot(at + 1).checkpoint?.stateHash).toBe(payload.stateHash)
  })

  it('encrypts project-room payloads and rotates the invitation root', () => {
    const invite = createProjectInvite(50_000)
    expect(decodeProjectInvite(encodeProjectInvite(invite))).toEqual(invite)
    const encrypted = encryptProjectPayload(invite, '项目密文')
    expect(Buffer.from(decryptProjectPayload(invite, encrypted)).toString('utf8')).toBe('项目密文')
    expect(() => decryptProjectPayload(invite, { ...encrypted, ciphertext: `${encrypted.ciphertext.slice(0, -1)}A` })).toThrow(/authentication/)
    const rotated = rotateProjectInvite(invite, 60_000)
    expect(rotated.epoch).toBe(2)
    expect(() => decryptProjectPayload(rotated, encrypted)).toThrow()
  })
})
