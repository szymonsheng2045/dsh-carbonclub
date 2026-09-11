import { describe, expect, it } from 'vitest'
import { generateKeyPair, privateKeyToProtobuf } from '@libp2p/crypto/keys'
import { peerIdFromPublicKey } from '@libp2p/peer-id'
import { CarbonClubNode, presenceActionFor } from '../src/network/node.js'
import { assertDialAddress, decodeInvite, encodeInvite, signInvite } from '../src/network/invite.js'
import { HALL_PROTOCOL_VERSION } from '../src/network/protocol.js'
import { NETWORK_HALL_RULES } from '../src/network/hall-rules.js'
import { loadOrCreatePrivateKey } from '../src/network/identity.js'
import { TYPERT } from '../src/typert.host.js'
import { TYPERT_REMOTE } from '../src/typert.remote-client.js'
import { contentAddressProfile, RoomEventLedger, signCheckpointEvent, signPresenceEvent, signRoomEvent, verifyRoomEvent } from '../src/network/room-events.js'
import { createProjectInvite, decodeProjectInvite, decryptProjectPayload, encodeProjectInvite, encryptProjectPayload, rotateProjectInvite } from '../src/network/project-crypto.js'
import type { SignedRoomEvent } from '../src/network/types.js'

/**
 * Loopback-only node options. A default node enables mDNS, so it discovers — and is
 * discovered by — the real LAN/public hall, including whatever club instance the operator
 * is running. Test traffic then leaks into the live room and into other tests' assertions.
 */
const ISOLATED = { enableMdns: false, enableRelayReservations: false, listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'] } as const

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
  it('allows the standard TLS relay port without opening other privileged ports', async () => {
    const peer = peerIdFromPublicKey((await generateKeyPair('Ed25519')).publicKey).toString()
    expect(() => assertDialAddress(`/dns4/relay.laozi.art/tcp/443/wss/p2p/${peer}`, peer)).not.toThrow()
    expect(() => assertDialAddress(`/dns4/relay.laozi.art/tcp/443/wss/p2p/${peer}/p2p-circuit/p2p/${peer}`, peer)).not.toThrow()
    for (const [port, transport] of [[443, 'ws'], [80, 'ws'], [22, 'wss'], [0, 'wss']]) {
      expect(() => assertDialAddress(`/dns4/relay.laozi.art/tcp/${port}/${transport}/p2p/${peer}`, peer)).toThrow()
    }
  })
  it('explains full capacity and enforces cooldown after a suspended seat expires', () => {
    const ledger = new RoomEventLedger()
    for (let index = 0; index < 500; index++) ledger.accept(syntheticPresence(index, 'join', 1, 10000, 10000))
    expect(ledger.admissionError('new-peer', 10001)).toBe('HALL_FULL')
    expect(ledger.admissionError('synthetic-peer-0000', 10001)).toBeUndefined()
    expect(ledger.admissionError('synthetic-peer-0000', 130001)).toBe('HALL_COOLDOWN')
    expect(ledger.admissionError('synthetic-peer-0000', 730001)).toBeUndefined()
    expect(ledger.admissionError('synthetic-peer-0033', 130001)).toBeUndefined()
  })

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
    const node = new CarbonClubNode(await generateKeyPair('Ed25519'), ISOLATED)
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
    const first = new CarbonClubNode(await generateKeyPair('Ed25519'), ISOLATED)
    const second = new CarbonClubNode(await generateKeyPair('Ed25519'), ISOLATED)
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

  it('re-joins instead of heartbeating once the room may have dropped the join basis', () => {
    // The room expires a join basis after presenceTtlMs of silence and then refuses every
    // heartbeat from that origin — the peer keeps its local seat and speaks into the void
    // until its own lease lapses into a cooldown. Refreshing with a real join halfway
    // through the TTL rebuilds the basis before the room can drop it.
    const ttl = NETWORK_HALL_RULES.presenceTtlMs
    expect(presenceActionFor(false, 0, 1_000)).toBe('join')
    expect(presenceActionFor(true, 1_000, 1_000 + ttl / 2 - 1)).toBe('heartbeat')
    expect(presenceActionFor(true, 1_000, 1_000 + ttl / 2)).toBe('join')
    expect(presenceActionFor(true, 1_000, 1_000 + ttl)).toBe('join')
  })

  it('binds invitations to the hall protocol and rejects legacy invites before remembering or dialing', async () => {
    const key = await generateKeyPair('Ed25519')
    const peerId = peerIdFromPublicKey(key.publicKey).toString()
    const payload = { version: 2 as const, hallProtocol: HALL_PROTOCOL_VERSION, roomId: 'hall' as const, peerId, addresses: [`/ip4/127.0.0.1/tcp/19999/ws/p2p/${peerId}`], issuedAt: 1000, expiresAt: 10000 }
    const signed = await signInvite(key, payload)
    expect((await decodeInvite(encodeInvite(signed), 1001)).hallProtocol).toBe(HALL_PROTOCOL_VERSION)
    const oldProtocol = await signInvite(key, { ...payload, hallProtocol: '0.5.0' })
    await expect(decodeInvite(encodeInvite(oldProtocol), 1001)).rejects.toThrow('HALL_PROTOCOL_MISMATCH')
    await expect(decodeInvite(encodeInvite({ ...oldProtocol, hallProtocol: HALL_PROTOCOL_VERSION }), 1001)).rejects.toThrow(/signature/)
    await expect(decodeInvite(encodeInvite(await signInvite(key, { ...payload, issuedAt: 100000, expiresAt: 200000 })), 1001)).rejects.toThrow(/lifetime/)
    const guest = new CarbonClubNode(await generateKeyPair('Ed25519'), { enableMdns: false, enableRelayReservations: false, listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'] })
    await guest.start()
    try {
      await expect(guest.connect('carbon1.legacy')).rejects.toThrow('HALL_PROTOCOL_MISMATCH')
      expect(guest.status().connectedPeers).toBe(0)
      expect(guest.status().discoveredPeers).toBe(0)
    } finally { await guest.stop() }
  })

  it('connects two independent Host nodes from an invite', async () => {
    const host = new CarbonClubNode(await generateKeyPair('Ed25519'), ISOLATED)
    const guest = new CarbonClubNode(await generateKeyPair('Ed25519'), ISOLATED)
    await Promise.all([host.start(), guest.start()])
    try {
      const result = await guest.connect((await host.createInvite()).code)
      expect(result).toEqual({ connected: true, peerId: host.status().peerId })
      expect(guest.status().connectedPeers).toBeGreaterThan(0)
    } finally {
      await Promise.all([host.stop(), guest.stop()])
    }
  })

  it('keeps local chat available when an optional relay cannot be reserved', async () => {
    const unreachableId = peerIdFromPublicKey((await generateKeyPair('Ed25519')).publicKey).toString()
    const host = new CarbonClubNode(await generateKeyPair('Ed25519'), { enableMdns: false, listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'], bootstrapAddresses: [`/ip4/127.0.0.1/tcp/1/ws/p2p/${unreachableId}`] })
    const guest = new CarbonClubNode(await generateKeyPair('Ed25519'), { enableMdns: false, enableRelayReservations: false, listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'] })
    try {
      await host.start()
      expect(host.status().phase).toBe('online')
      expect(host.status().relayAddresses).toBe(0)
      await guest.start()
      await guest.connect((await host.createInvite()).code)
      expect(guest.status().connectedPeers).toBeGreaterThan(0)
    } finally { await Promise.all([host.stop(), guest.stop()]) }
  }, 20000)

  it('replicates a signed human message between two Host nodes', async () => {
    const host = new CarbonClubNode(await generateKeyPair('Ed25519'), ISOLATED)
    const guest = new CarbonClubNode(await generateKeyPair('Ed25519'), ISOLATED)
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
    const host = new CarbonClubNode(await generateKeyPair('Ed25519'), ISOLATED)
    const lateGuest = new CarbonClubNode(await generateKeyPair('Ed25519'), ISOLATED)
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

  it('keeps a lost seat behind the room cooldown and a refresh join fresh', async () => {
    const ledger = new RoomEventLedger()
    const guest = await generateKeyPair('Ed25519')
    const guestId = peerIdFromPublicKey(guest.publicKey).toString()
    const profile = contentAddressProfile({ name: '旅客' })
    const joinedAt = Date.now()
    ledger.accept(await signPresenceEvent(guest, { action: 'join', profile, joinedAt }, 1, joinedAt))
    expect(ledger.snapshot(joinedAt).seats.some(seat => seat?.participant.peerId === guestId)).toBe(true)

    // A *seat* lost to a presence timeout is deliberately unlike the queued case: every
    // seat expiry carries the ten-minute cooldown, so no re-join readmits it early. The
    // node surfaces that as HALL_COOLDOWN when its own lease lapses — bounded, and not
    // silently unheard forever.
    const resumedAt = joinedAt + NETWORK_HALL_RULES.presenceTtlMs + 5_000
    expect(ledger.snapshot(resumedAt).seats.some(seat => seat?.participant.peerId === guestId)).toBe(false)
    expect(ledger.admissionError(guestId, resumedAt)).toBe('HALL_COOLDOWN')

    // A refresh join must renew joinedAt: assertPayload refuses a join whose joinedAt is
    // more than ten seconds older than its issuedAt before it is even signed — a rejection
    // the heartbeat timer swallows, so the refresh would die silently.
    await expect(signPresenceEvent(guest, { action: 'join', profile, joinedAt }, 2, resumedAt)).rejects.toThrow('not fresh')
    await expect(signPresenceEvent(guest, { action: 'join', profile, joinedAt: resumedAt }, 3, resumedAt)).resolves.toBeDefined()
  })

  it('carries a watcher back into the hall across a one-way partition', async () => {
    // Eight seated peers that stay present, plus a watcher whose outbound events are dropped
    // for longer than the presence TTL. The watcher keeps accepting its own events, so it
    // goes on believing it is in line while the room has already forgotten it — the split
    // brain the refresh join exists to end. Presence timestamps are supplied throughout, so
    // the partition is simulated without waiting two real minutes.
    let partitioned = false
    const host = new CarbonClubNode(await generateKeyPair('Ed25519'), ISOLATED)
    const guest = new CarbonClubNode(await generateKeyPair('Ed25519'), { ...ISOLATED, outboundEventGate: () => !partitioned })
    const fillers: CarbonClubNode[] = []
    await Promise.all([host.start(), guest.start()])
    try {
      const invite = (await host.createInvite()).code
      await guest.connect(invite)
      const base = Date.now()
      for (let index = 0; index < 8; index += 1) {
        const filler = new CarbonClubNode(await generateKeyPair('Ed25519'), ISOLATED)
        await filler.start()
        await filler.connect(invite)
        await filler.joinHall({ name: `seat-${index}` }, base + index)
        fillers.push(filler)
      }
      await guest.joinHall({ name: 'watcher' }, base + 20)
      const guestId = guest.status().peerId
      const queuedOnHost = (now: number): boolean => host.roomSnapshot(now).queue.some(participant => participant.peerId === guestId)
      await waitFor(() => queuedOnHost(base + 30), 15_000)

      partitioned = true
      for (const offset of [45_000, 90_000, 135_000]) await guest.joinHall({ name: 'watcher' }, base + offset)
      // The seats must outlive the probe: a seat expires on presence TTL *or* on the idle
      // rule, whichever comes first, so refresh both.
      for (const [index, filler] of fillers.entries()) {
        await filler.joinHall({ name: `seat-${index}` }, base + 100_000)
        await filler.publishHallMessage({ body: `still here ${index}` }, base + 100_000)
      }

      const localHall = guest.roomSnapshot(base + 150_000)
      expect(localHall.seats.some(seat => seat?.participant.peerId === guestId) || localHall.queue.some(participant => participant.peerId === guestId)).toBe(true)
      expect(queuedOnHost(base + 150_000)).toBe(false)

      // The partition ends. The TTL/2 cadence (presenceActionFor) sends a real join, which
      // the room accepts without a join basis and which puts the watcher back in line.
      partitioned = false
      await guest.joinHall({ name: 'watcher' }, base + 150_000)
      await waitFor(() => queuedOnHost(base + 150_000), 15_000)
    } finally {
      await Promise.all([host, guest, ...fillers].map(node => node.stop()))
    }
  }, 60_000)

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

  it('retains local presence beyond the 24-person queue preview so leaving still works', async () => {
    const node = new CarbonClubNode(await generateKeyPair('Ed25519'), { enableMdns: false })
    await node.start()
    try {
      // Populate the local ledger at its already-verified-event seam, without 40 sockets.
      const ledger = (node as unknown as { ledger: RoomEventLedger }).ledger
      const base = Date.now() - 2_000
      for (let index = 0; index < 40; index++) ledger.accept(syntheticPresence(index, 'join', 1, base + index, base + index))
      const joined = await node.joinHall({ name: 'queued after preview' })
      expect(joined.queue).toHaveLength(24)
      expect(joined.localQueuePosition).toBe(33)
      const left = await node.leaveHall()
      expect(left.localQueuePosition).toBeUndefined()
      expect(left.participantCount).toBe(40)
    } finally { await node.stop() }
  })

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
    const tamperedCiphertext = `${encrypted.ciphertext[0] === 'A' ? 'B' : 'A'}${encrypted.ciphertext.slice(1)}`
    expect(() => decryptProjectPayload(invite, { ...encrypted, ciphertext: tamperedCiphertext })).toThrow(/authentication/)
    const rotated = rotateProjectInvite(invite, 60_000)
    expect(rotated.epoch).toBe(2)
    expect(() => decryptProjectPayload(rotated, encrypted)).toThrow()
  })
})
