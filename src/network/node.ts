import { createLibp2p, type Libp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'
import { gossipsub } from '@libp2p/gossipsub'
import { mdns } from '@libp2p/mdns'
import { bootstrap } from '@libp2p/bootstrap'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { autoNAT } from '@libp2p/autonat'
import { dcutr } from '@libp2p/dcutr'
import { peerIdFromString } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'
import { assertDialAddress, decodeInvite, encodeInvite, signInvite } from './invite.js'
import { NETWORK_HALL_RULES } from './hall-rules.js'
import { HALL_SYNC_PROTOCOL, HALL_TOPIC } from './protocol.js'
import type { CarbonPrivateKey, RememberedPeer } from './identity.js'
import { contentAddressProfile, MAX_SYNC_EVENTS, RoomEventLedger, signCheckpointEvent, signPresenceEvent, signRoomEvent, verifyRoomEvent } from './room-events.js'
import type { ConnectResult, EvidenceBundle, HallPresenceInput, InviteInfo, NetworkStatus, PostRoomMessageInput, RoomDelta, RoomMessage, RoomProfile, RoomSnapshot, SignedRoomEvent } from './types.js'

export { HALL_SYNC_PROTOCOL, HALL_TOPIC } from './protocol.js'
const INVITE_TTL_MS = 30 * 60 * 1_000
const MAX_EVENT_BYTES = 48_000
const MAX_SYNC_BYTES = 8 * 1024 * 1024
const DISCOVERY_TTL_MS = 30 * 60 * 1_000
const DIAL_TIMEOUT_MS = 8_000
const KEEP_ALIVE_TAG = 'keep-alive-carbon-club'
const TARGET_DISCOVERY_CONNECTIONS = 12
const MAX_PARALLEL_DISCOVERY_DIALS = 4
const MAX_RATE_LIMIT_ORIGINS = 1_024
const MAX_SYNC_RATE_LIMIT_ORIGINS = 128
const decoder = new TextDecoder()
const encoder = new TextEncoder()

export interface CarbonClubNodeOptions {
  readonly rememberedPeers?: readonly RememberedPeer[]
  readonly persistRememberedPeers?: (peers: readonly RememberedPeer[]) => Promise<void>
  readonly bootstrapAddresses?: readonly string[]
  readonly enableMdns?: boolean
  readonly enableRelayReservations?: boolean
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function profileEquals(left: RoomProfile, right: RoomProfile): boolean {
  return left.name === right.name
    && left.avatarCid === right.avatarCid
    && left.lastCompletedSession === right.lastCompletedSession
}

function streamChunkBytes(chunk: unknown): Uint8Array {
  if (chunk instanceof Uint8Array) return chunk
  if (typeof chunk === 'object' && chunk !== null && 'subarray' in chunk && typeof chunk.subarray === 'function') return chunk.subarray() as Uint8Array
  throw new Error('Sync stream returned an unsupported byte chunk')
}

export class CarbonClubNode {
  private node: Libp2p | undefined
  private phase: NetworkStatus['phase'] = 'starting'
  private startupError: string | undefined
  private readonly discovered = new Map<string, number>()
  private readonly remembered = new Map<string, RememberedPeer>()
  private readonly ledger = new RoomEventLedger()
  private localSequence = 0
  private localPresence: { profile: RoomProfile; joinedAt: number } | undefined
  private heartbeatTimer: ReturnType<typeof setInterval> | undefined
  private checkpointTimer: ReturnType<typeof setInterval> | undefined
  private ingestion = Promise.resolve()
  private readonly transportInboundWindows = new Map<string, { startedAt: number; count: number }>()
  private readonly inboundWindows = new Map<string, { startedAt: number; count: number }>()
  private readonly syncWindows = new Map<string, number>()
  private readonly pendingDiscoveryDials = new Set<string>()

  constructor(private readonly privateKey: CarbonPrivateKey, private readonly options: CarbonClubNodeOptions = {}) {
    for (const peer of options.rememberedPeers ?? []) this.remembered.set(peer.peerId, peer)
  }

  async start(): Promise<void> {
    if (this.node !== undefined) return
    try {
      const bootstrapAddresses = [...(this.options.bootstrapAddresses ?? [])]
      const node = await createLibp2p({
        privateKey: this.privateKey,
        addresses: {
          listen: [
            '/ip4/0.0.0.0/tcp/0/ws',
            ...(this.options.enableRelayReservations === false ? [] : bootstrapAddresses.map(address => `${address}/p2p-circuit`)),
          ],
        },
        transports: [webSockets(), circuitRelayTransport({ maxReservationQueueLength: 16, reservationConcurrency: 1 })],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        peerDiscovery: [
          ...(this.options.enableMdns === false ? [] : [mdns()]),
          ...(bootstrapAddresses.length === 0 ? [] : [bootstrap({ list: bootstrapAddresses, timeout: 500, tagTTL: Infinity })]),
        ],
        connectionManager: {
          reconnectRetries: 6,
          reconnectRetryInterval: 1_000,
          reconnectBackoffFactor: 2,
          maxParallelReconnects: 4,
          maxConnections: 64,
          maxIncomingPendingConnections: 16,
          inboundConnectionThreshold: 32,
        },
        services: {
          identify: identify(),
          pubsub: gossipsub({ allowPublishToZeroTopicPeers: true, emitSelf: false, floodPublish: false, doPX: true, D: 6, Dlo: 4, Dhi: 12, Dout: 2 }),
          autoNAT: autoNAT({ timeout: 10_000, maxInboundStreams: 2, maxOutboundStreams: 2 }),
          dcutr: dcutr(),
        },
      })
      this.node = node
      await node.handle(HALL_SYNC_PROTOCOL, async (stream, connection) => {
        const remotePeerId = connection.remotePeer.toString()
        if (!this.allowSync(remotePeerId)) {
          stream.abort(new Error('Room sync rate limit exceeded'))
          return
        }
        const requestChunks: Uint8Array[] = []
        let requestBytes = 0
        for await (const chunk of stream) {
          const bytes = streamChunkBytes(chunk)
          requestBytes += bytes.byteLength
          if (requestBytes > 1_024) {
            stream.abort(new Error('Room sync request exceeds byte budget'))
            return
          }
          requestChunks.push(bytes)
        }
        const requestData = new Uint8Array(requestBytes)
        let requestOffset = 0
        for (const chunk of requestChunks) { requestData.set(chunk, requestOffset); requestOffset += chunk.byteLength }
        const request: unknown = JSON.parse(decoder.decode(requestData))
        if (typeof request !== 'object' || request === null || !('version' in request) || request.version !== 1 || !('topic' in request) || request.topic !== HALL_TOPIC) {
          stream.abort(new Error('Room sync request is invalid'))
          return
        }
        const events = this.ledger.eventsForSync(MAX_SYNC_EVENTS)
        const data = encoder.encode(JSON.stringify({ version: 1, topic: HALL_TOPIC, events }))
        if (data.byteLength > MAX_SYNC_BYTES) {
          stream.abort(new Error('Room sync snapshot exceeds byte budget'))
          return
        }
        stream.send(data)
        await stream.close()
      }, { maxInboundStreams: 2, maxOutboundStreams: 2, runOnLimitedConnection: true })
      node.addEventListener('peer:discovery', event => {
        const peerId = event.detail.id.toString()
        if (peerId === node.peerId.toString()) return
        this.noteDiscovered(peerId)
        const addresses = event.detail.multiaddrs
          .map(address => address.toString())
          .map(address => address.endsWith(`/p2p/${peerId}`) ? address : `${address}/p2p/${peerId}`)
          .filter(address => this.isAllowedAddress(address, peerId))
        if (addresses.length === 0) return
        void this.rememberPeer(peerId, addresses)
        const connected = new Set(node.getConnections().map(connection => connection.remotePeer.toString()))
        if (connected.has(peerId) || connected.size >= TARGET_DISCOVERY_CONNECTIONS || this.pendingDiscoveryDials.size >= MAX_PARALLEL_DISCOVERY_DIALS) return
        this.pendingDiscoveryDials.add(peerId)
        void this.preparePeer(peerId, addresses)
          .then(() => node.dial(event.detail.id, { signal: AbortSignal.timeout(DIAL_TIMEOUT_MS) }))
          .catch(() => {})
          .finally(() => { this.pendingDiscoveryDials.delete(peerId) })
      })
      node.addEventListener('peer:connect', event => {
        const peerId = event.detail.toString()
        void node.peerStore.merge(event.detail, { tags: { [KEEP_ALIVE_TAG]: { value: 20 } } }).catch(() => {})
        globalThis.setTimeout(() => { void this.requestHistory(peerId) }, 350)
      })
      node.services.pubsub.addEventListener('message', event => {
        if (event.detail.topic !== HALL_TOPIC || event.detail.data.byteLength > MAX_EVENT_BYTES) return
        const transportOrigin = event.detail.type === 'signed' ? event.detail.from.toString() : ''
        if (!this.allowTransportInbound(transportOrigin)) return
        this.ingestion = this.ingestion.then(async () => {
          try {
            const parsed: unknown = JSON.parse(decoder.decode(event.detail.data))
            const signed = await verifyRoomEvent(parsed)
            if (!this.allowInbound(signed.origin)) return
            if (signed.kind === 'room.sync.request') return
            this.ledger.accept(signed)
          } catch {
            // Invalid, forged, stale, out-of-order and oversized events are intentionally dropped.
          }
        })
      })
      node.services.pubsub.subscribe(HALL_TOPIC)
      this.phase = 'online'
      this.checkpointTimer = setInterval(() => { void this.publishCheckpoint().catch(() => {}) }, 30_000)
      this.startupError = undefined
      for (const connection of node.getConnections()) {
        const peerId = connection.remotePeer.toString()
        void node.peerStore.merge(connection.remotePeer, { tags: { [KEEP_ALIVE_TAG]: { value: 20 } } }).catch(() => {})
        globalThis.setTimeout(() => { void this.requestHistory(peerId) }, 350)
      }
      for (const address of bootstrapAddresses) {
        void node.dial(multiaddr(address), { signal: AbortSignal.timeout(DIAL_TIMEOUT_MS) }).catch(() => {})
      }
      for (const peer of this.remembered.values()) void this.connectRemembered(peer)
    } catch (error) {
      this.phase = 'error'
      this.startupError = errorMessage(error)
      throw error
    }
  }

  status(): NetworkStatus {
    const node = this.node
    this.pruneDiscovered()
    if (node === undefined) {
      return {
        phase: this.phase,
        addresses: [],
        connectedPeers: 0,
        discoveredPeers: this.discovered.size,
        bootstrapConfigured: this.options.bootstrapAddresses?.length ?? 0,
        relayAddresses: 0,
        ...(this.startupError === undefined ? {} : { error: this.startupError }),
      }
    }
    return {
      phase: this.phase,
      peerId: node.peerId.toString(),
      addresses: this.inviteAddresses(),
      connectedPeers: new Set(node.getConnections().map(connection => connection.remotePeer.toString())).size,
      discoveredPeers: this.discovered.size,
      bootstrapConfigured: this.options.bootstrapAddresses?.length ?? 0,
      relayAddresses: node.getMultiaddrs().filter(address => address.toString().includes('/p2p-circuit')).length,
    }
  }

  async createInvite(now = Date.now()): Promise<InviteInfo> {
    const node = this.requiredNode()
    const addresses = this.inviteAddresses()
    if (addresses.length === 0) throw new Error('Carbon Club node has no dialable WebSocket address')
    const expiresAt = now + INVITE_TTL_MS
    const peerId = node.peerId.toString()
    const code = encodeInvite(await signInvite(this.privateKey, { version: 1, roomId: 'hall', peerId, addresses, issuedAt: now, expiresAt }))
    return { code, peerId, addresses, expiresAt }
  }

  async connect(code: string): Promise<ConnectResult> {
    const node = this.requiredNode()
    const invite = await decodeInvite(code)
    await this.rememberPeer(invite.peerId, invite.addresses)
    await this.preparePeer(invite.peerId, invite.addresses)
    let lastError: unknown
    for (const address of invite.addresses) {
      try {
        await node.dial(multiaddr(address), { signal: AbortSignal.timeout(DIAL_TIMEOUT_MS) })
        return { connected: true, peerId: invite.peerId }
      } catch (error) {
        lastError = error
      }
    }
    throw new Error(`Could not connect to invited peer: ${errorMessage(lastError)}`)
  }

  roomSnapshot(now = Date.now()): RoomSnapshot {
    return this.ledger.snapshot(now, this.node?.peerId.toString())
  }

  roomDelta(afterCursor: number, now = Date.now()): RoomDelta {
    return this.ledger.delta(afterCursor, now, this.node?.peerId.toString())
  }

  evidence(eventId: string, now = Date.now()): EvidenceBundle {
    const bundle = this.ledger.evidence(eventId, now)
    if (bundle === undefined) throw new Error('ROOM_EVENT_NOT_FOUND')
    return bundle
  }

  async joinHall(profile: RoomProfile, now = Date.now()): Promise<RoomSnapshot> {
    this.requiredNode()
    profile = contentAddressProfile(profile)
    const previousPresence = this.localPresence
    const joinedAt = previousPresence?.joinedAt ?? now
    const action: HallPresenceInput['action'] = previousPresence === undefined ? 'join' : 'heartbeat'
    const profileChanged = previousPresence === undefined || !profileEquals(previousPresence.profile, profile)
    this.localPresence = { profile, joinedAt }
    const event = await signPresenceEvent(this.privateKey, {
      action,
      ...(action === 'join' || profileChanged ? { profile } : {}),
      joinedAt,
    }, this.nextSequence(), now)
    this.ledger.accept(event)
    await this.publishEvent(event)
    const snapshot = this.roomSnapshot(now)
    const localPeerId = this.requiredNode().peerId.toString()
    const admitted = snapshot.seats.some(seat => seat?.participant.peerId === localPeerId)
      || snapshot.queue.some(participant => participant.peerId === localPeerId)
    if (admitted) this.ensureHeartbeat()
    else this.clearLocalPresence()
    return snapshot
  }

  async leaveHall(now = Date.now()): Promise<RoomSnapshot> {
    if (this.localPresence === undefined) return this.roomSnapshot(now)
    const event = await signPresenceEvent(this.privateKey, { action: 'leave' }, this.nextSequence(), now)
    this.localPresence = undefined
    this.ledger.accept(event)
    await this.publishEvent(event)
    this.clearLocalPresence()
    return this.roomSnapshot(now)
  }

  async publishHallMessage(input: PostRoomMessageInput, now = Date.now()): Promise<RoomMessage> {
    const node = this.requiredNode()
    const presence = this.localPresence
    if (presence === undefined) throw new Error('HALL_NOT_JOINED')
    const localPeerId = node.peerId.toString()
    const snapshot = this.roomSnapshot(now)
    const seat = snapshot.seats.find(candidate => candidate?.participant.peerId === localPeerId)
    if (seat === undefined || seat === null) throw new Error('HALL_NOT_SEATED')
    if (!profileEquals(seat.participant.profile, presence.profile)) throw new Error('HALL_PROFILE_SYNC')
    const event = await signRoomEvent(this.privateKey, input, this.nextSequence(), now)
    const message = this.ledger.accept(event)
    if (message === undefined) throw new Error('HALL_RATE_LIMIT')
    await this.publishEvent(event)
    return message
  }

  async stop(): Promise<void> {
    const node = this.node
    if (node === undefined) return
    try {
      await this.leaveHall()
    } catch {
      // Shutdown continues even if the final presence event cannot be published.
    }
    if (this.heartbeatTimer !== undefined) clearInterval(this.heartbeatTimer)
    if (this.checkpointTimer !== undefined) clearInterval(this.checkpointTimer)
    this.heartbeatTimer = undefined
    this.checkpointTimer = undefined
    this.node = undefined
    this.phase = 'starting'
    await node.stop()
  }

  private nextSequence(): number {
    const sequence = Math.max(Math.floor(Date.now() * 1_000), this.localSequence + 1)
    this.localSequence = sequence
    return sequence
  }

  private ensureHeartbeat(): void {
    if (this.heartbeatTimer !== undefined) return
    this.heartbeatTimer = setInterval(() => {
      const presence = this.localPresence
      if (presence === undefined || this.node === undefined) return
      void this.joinHall(presence.profile).catch(() => {})
    }, NETWORK_HALL_RULES.presenceHeartbeatMs)
  }

  private clearLocalPresence(): void {
    this.localPresence = undefined
    if (this.heartbeatTimer !== undefined) clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = undefined
  }

  private async requestHistory(targetPeerId: string): Promise<void> {
    if (this.node === undefined || this.phase !== 'online') return
    try {
      const connections = this.node.getConnections().filter(candidate => candidate.remotePeer.toString() === targetPeerId)
      const connection = connections.find(candidate => candidate.direct && candidate.limits === undefined) ?? connections[0]
      if (connection === undefined) return
      const signal = AbortSignal.timeout(DIAL_TIMEOUT_MS)
      const stream = await connection.newStream(HALL_SYNC_PROTOCOL, { signal, runOnLimitedConnection: true })
      stream.maxReadBufferLength = MAX_SYNC_BYTES
      stream.send(encoder.encode(JSON.stringify({ version: 1, topic: HALL_TOPIC })))
      // Half-close after a bounded request. The responder waits for this FIN
      // before sending, avoiding a Yamux open/close race.
      const closeWrite = stream.close({ signal })
      const chunks: Uint8Array[] = []
      let total = 0
      for await (const chunk of stream) {
        const bytes = streamChunkBytes(chunk)
        total += bytes.byteLength
        if (total > MAX_SYNC_BYTES) {
          stream.abort(new Error('Room sync snapshot exceeds byte budget'))
          return
        }
        chunks.push(bytes)
      }
      await closeWrite
      const merged = new Uint8Array(total)
      let offset = 0
      for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength }
      const decoded: unknown = JSON.parse(decoder.decode(merged))
      if (typeof decoded !== 'object' || decoded === null || !('version' in decoded) || decoded.version !== 1 || !('topic' in decoded) || decoded.topic !== HALL_TOPIC || !('events' in decoded) || !Array.isArray(decoded.events) || decoded.events.length > MAX_SYNC_EVENTS) throw new Error('Room sync snapshot is invalid')
      for (const candidate of decoded.events) this.ledger.accept(await verifyRoomEvent(candidate, Date.now(), { allowHistoricalPresence: true }))
    } catch (error) {
      if (process.env.DSH_CARBON_CLUB_DEBUG === '1') console.warn('[carbon-club] room sync failed', targetPeerId, error)
      // A later reconnect or poll can request history again.
    }
  }

  private async publishCheckpoint(now = Date.now()): Promise<void> {
    const node = this.node
    if (node === undefined || this.phase !== 'online') return
    const witnesses = node.getConnections().map(connection => connection.remotePeer.toString())
    const payload = this.ledger.checkpointPayload(now, witnesses)
    if (payload === undefined || payload.stewardPeerId !== node.peerId.toString()) return
    const event = await signCheckpointEvent(this.privateKey, payload, this.nextSequence(), now)
    this.ledger.accept(event)
    await this.publishEvent(event)
  }

  private async publishEvent(event: SignedRoomEvent): Promise<void> {
    const node = this.requiredNode()
    const data = encoder.encode(JSON.stringify(event))
    if (data.byteLength > MAX_EVENT_BYTES) throw new Error('Room event exceeds the network byte budget')
    const pubsub = node.services.pubsub as { publish(topic: string, data: Uint8Array): Promise<unknown> }
    await pubsub.publish(HALL_TOPIC, data)
  }

  private requiredNode(): Libp2p {
    if (this.node === undefined || this.phase !== 'online') throw new Error(this.startupError ?? 'Carbon Club node is still starting')
    return this.node
  }

  private inviteAddresses(): string[] {
    const node = this.node
    if (node === undefined) return []
    const peerId = node.peerId.toString()
    const peerSuffix = `/p2p/${peerId}`
    return node.getMultiaddrs()
      .map(address => address.toString())
      .map(address => address.endsWith(peerSuffix) ? address : `${address}${peerSuffix}`)
      .filter(address => this.isAllowedAddress(address, peerId))
      .sort((left, right) => Number(right.includes('/p2p-circuit/')) - Number(left.includes('/p2p-circuit/')))
      .slice(0, 4)
  }

  private isAllowedAddress(address: string, peerId: string): boolean {
    try {
      assertDialAddress(address, peerId)
      return true
    } catch {
      return false
    }
  }

  private async preparePeer(peerId: string, addresses: readonly string[]): Promise<void> {
    const node = this.requiredNode()
    const id = peerIdFromString(peerId)
    const parsed = addresses.filter(address => this.isAllowedAddress(address, peerId)).map(address => multiaddr(address))
    if (parsed.length === 0) throw new Error('Peer has no allowed WebSocket address')
    await node.peerStore.merge(id, { multiaddrs: parsed, tags: { [KEEP_ALIVE_TAG]: { value: 20 } } })
  }

  private async connectRemembered(peer: RememberedPeer): Promise<void> {
    try {
      await this.preparePeer(peer.peerId, peer.addresses)
      await this.requiredNode().dial(peerIdFromString(peer.peerId), { signal: AbortSignal.timeout(DIAL_TIMEOUT_MS) })
    } catch {
      // Remembered addresses may become stale when a peer restarts on a new port.
    }
  }

  private async rememberPeer(peerId: string, addresses: readonly string[]): Promise<void> {
    const allowed = addresses.filter(address => this.isAllowedAddress(address, peerId)).slice(0, 4)
    if (allowed.length === 0) return
    this.remembered.set(peerId, { peerId, addresses: allowed, rememberedAt: Date.now() })
    while (this.remembered.size > 64) {
      const oldest = [...this.remembered.values()].sort((left, right) => left.rememberedAt - right.rememberedAt)[0]
      if (oldest === undefined) break
      this.remembered.delete(oldest.peerId)
    }
    await this.options.persistRememberedPeers?.([...this.remembered.values()])
  }

  private noteDiscovered(peerId: string): void {
    this.discovered.set(peerId, Date.now())
    this.pruneDiscovered()
    while (this.discovered.size > 512) this.discovered.delete(this.discovered.keys().next().value as string)
  }

  private pruneDiscovered(now = Date.now()): void {
    for (const [peerId, seenAt] of this.discovered) {
      if (seenAt < now - DISCOVERY_TTL_MS) this.discovered.delete(peerId)
    }
  }

  private allowInbound(origin: string, now = Date.now()): boolean {
    if (origin.length < 16 || origin.length > 160) return false
    const current = this.inboundWindows.get(origin)
    if (current === undefined || now - current.startedAt >= 60_000) {
      for (const [peerId, window] of this.inboundWindows) if (now - window.startedAt >= 60_000) this.inboundWindows.delete(peerId)
      if (current === undefined && this.inboundWindows.size >= MAX_RATE_LIMIT_ORIGINS) return false
      this.inboundWindows.set(origin, { startedAt: now, count: 1 })
      return true
    }
    current.count += 1
    if (this.inboundWindows.size > 512) {
      for (const [peerId, window] of this.inboundWindows) if (now - window.startedAt >= 60_000) this.inboundWindows.delete(peerId)
    }
    return current.count <= 20
  }

  private allowTransportInbound(origin: string, now = Date.now()): boolean {
    if (origin.length < 16 || origin.length > 160) return false
    const current = this.transportInboundWindows.get(origin)
    if (current === undefined || now - current.startedAt >= 60_000) {
      for (const [peerId, window] of this.transportInboundWindows) if (now - window.startedAt >= 60_000) this.transportInboundWindows.delete(peerId)
      if (current === undefined && this.transportInboundWindows.size >= MAX_RATE_LIMIT_ORIGINS) return false
      this.transportInboundWindows.set(origin, { startedAt: now, count: 1 })
      return true
    }
    current.count += 1
    if (this.transportInboundWindows.size > 512) {
      for (const [peerId, window] of this.transportInboundWindows) if (now - window.startedAt >= 60_000) this.transportInboundWindows.delete(peerId)
    }
    return current.count <= 120
  }

  private allowSync(origin: string, now = Date.now()): boolean {
    for (const [peerId, at] of this.syncWindows) if (now - at > 2 * 60_000) this.syncWindows.delete(peerId)
    const previous = this.syncWindows.get(origin) ?? 0
    if (now - previous < 60_000) return false
    if (!this.syncWindows.has(origin) && this.syncWindows.size >= MAX_SYNC_RATE_LIMIT_ORIGINS) return false
    this.syncWindows.set(origin, now)
    return true
  }
}
