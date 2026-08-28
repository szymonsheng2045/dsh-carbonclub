import { publicKeyFromProtobuf, publicKeyToProtobuf } from '@libp2p/crypto/keys'
import { peerIdFromPublicKey } from '@libp2p/peer-id'
import { createHash } from 'node:crypto'
import { NETWORK_HALL_RULES } from './hall-rules.js'
import type { CarbonPrivateKey } from './identity.js'
import type {
  HallParticipant,
  HallCheckpoint,
  HallPresenceInput,
  HallSeat,
  PostRoomMessageInput,
  RoomDelta,
  RoomMessage,
  RoomProfile,
  RoomSnapshot,
  SignedRoomEvent,
  UnsignedRoomEvent,
} from './types.js'

const encoder = new TextEncoder()
const MAX_MESSAGE_LENGTH = 400
/** 12 KiB data URL ~= 9 KiB binary; 500 worst-case avatars stay below 5 MiB. */
export const MAX_AVATAR_LENGTH = 12_288
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1_000
const MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1_000
const MAX_RETAINED_MESSAGES = 200
const MAX_RETAINED_EVENTS = 2_200
const MAX_TRACKED_JOIN_ORIGINS = 750
const MAX_TRACKED_SEQUENCE_ORIGINS = 1_500
export const MAX_SYNC_EVENTS = 1_300
const JOIN_FRESHNESS_MS = 30_000
const ADMISSION_EPOCH_MS = 5 * 60_000
export const ADMISSION_DIFFICULTY_BITS = 16

function hasLeadingZeroBits(bytes: Uint8Array, bits: number): boolean {
  const fullBytes = Math.floor(bits / 8)
  for (let index = 0; index < fullBytes; index += 1) if (bytes[index] !== 0) return false
  const remainder = bits % 8
  return remainder === 0 || ((bytes[fullBytes] ?? 255) & (0xff << (8 - remainder))) === 0
}

function admissionDigest(origin: string, epoch: number, nonce: number): Uint8Array {
  return createHash('sha256').update(`dsh-carbon-admission/1:${origin}:${epoch}:${nonce}`).digest()
}

function assertAdmission(origin: string | undefined, issuedAt: number | undefined, admission: HallPresenceInput['admission']): void {
  if (origin === undefined || issuedAt === undefined || admission === undefined || !Number.isSafeInteger(admission.epoch) || !Number.isSafeInteger(admission.nonce) || admission.nonce < 0 || admission.epoch !== Math.floor(issuedAt / ADMISSION_EPOCH_MS) || !hasLeadingZeroBits(admissionDigest(origin, admission.epoch, admission.nonce), ADMISSION_DIFFICULTY_BITS)) throw new Error('Hall admission proof is invalid')
}

async function mineAdmission(origin: string, issuedAt: number): Promise<NonNullable<HallPresenceInput['admission']>> {
  const epoch = Math.floor(issuedAt / ADMISSION_EPOCH_MS)
  for (let nonce = 0; nonce < Number.MAX_SAFE_INTEGER; nonce += 1) {
    if (hasLeadingZeroBits(admissionDigest(origin, epoch, nonce), ADMISSION_DIFFICULTY_BITS)) return { epoch, nonce }
    if (nonce % 2_048 === 0) await new Promise(resolve => setTimeout(resolve, 0))
  }
  throw new Error('Could not create hall admission proof')
}

function canonicalBytes(event: UnsignedRoomEvent): Uint8Array {
  return encoder.encode(JSON.stringify({
    version: event.version, roomId: event.roomId, eventId: event.eventId,
    origin: event.origin, sequence: event.sequence, issuedAt: event.issuedAt,
    kind: event.kind, payload: event.payload, publicKey: event.publicKey,
  }))
}

function assertProfile(value: unknown): asserts value is RoomProfile {
  if (typeof value !== 'object' || value === null) throw new Error('Room profile must be an object')
  const profile = value as Partial<RoomProfile>
  if (typeof profile.name !== 'string' || profile.name.trim() === '' || profile.name.length > 48) throw new Error('Room profile name is invalid')
  if (profile.lastCompletedSession !== undefined && (typeof profile.lastCompletedSession !== 'string' || profile.lastCompletedSession.length > 120)) throw new Error('Room profile session note is invalid')
  if (profile.avatarCid !== undefined && (typeof profile.avatarCid !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(profile.avatarCid))) throw new Error('Room profile avatar content id is invalid')
  if (profile.avatarUrl !== undefined) {
    if (typeof profile.avatarUrl !== 'string' || profile.avatarUrl.length > MAX_AVATAR_LENGTH || !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(profile.avatarUrl)) throw new Error('Room profile avatar is invalid')
    const bytes = Buffer.from(profile.avatarUrl.slice(profile.avatarUrl.indexOf(',') + 1), 'base64')
    const cid = `sha256:${createHash('sha256').update(bytes).digest('hex')}`
    if (profile.avatarCid !== cid) throw new Error('Room profile avatar content id does not match its bytes')
  }
}

export function contentAddressProfile(profile: RoomProfile): RoomProfile {
  if (profile.avatarUrl === undefined) return profile
  const bytes = Buffer.from(profile.avatarUrl.slice(profile.avatarUrl.indexOf(',') + 1), 'base64')
  return { ...profile, avatarCid: `sha256:${createHash('sha256').update(bytes).digest('hex')}` }
}

function profileReference(profile: RoomProfile): RoomProfile {
  const { avatarUrl: _avatarUrl, ...reference } = profile
  return reference
}

function assertPayload(event: Partial<UnsignedRoomEvent>): void {
  if (event.kind === 'chat.message') {
    const payload = event.payload as Partial<PostRoomMessageInput> | undefined
    if (payload === undefined || typeof payload.body !== 'string' || payload.body.trim() === '' || payload.body.length > MAX_MESSAGE_LENGTH) throw new Error('Room message is empty or too long')
    return
  }
  if (event.kind === 'hall.presence') {
    const payload = event.payload as Partial<HallPresenceInput> | undefined
    if (payload === undefined || !['join', 'heartbeat', 'leave'].includes(payload.action ?? '')) throw new Error('Hall presence action is invalid')
    if (payload.action === 'leave') return
    if (payload.action === 'join') assertProfile(payload.profile)
    if (payload.action === 'join') assertAdmission(event.origin, event.issuedAt, payload.admission)
    if (payload.action === 'heartbeat' && payload.profile !== undefined) assertProfile(payload.profile)
    if (!Number.isSafeInteger(payload.joinedAt) || (payload.joinedAt ?? 0) <= 0 || (payload.joinedAt ?? 0) > (event.issuedAt ?? 0)) throw new Error('Hall join time is invalid')
    if (payload.action === 'join' && (event.issuedAt ?? 0) - (payload.joinedAt ?? 0) > 10_000) throw new Error('Hall join time is not fresh')
    return
  }
  if (event.kind === 'hall.checkpoint') {
    const payload = event.payload as Partial<Omit<HallCheckpoint, 'issuedAt'>> | undefined
    if (payload === undefined || !Number.isSafeInteger(payload.epoch) || (payload.epoch ?? 0) < 0 || typeof payload.stewardPeerId !== 'string' || payload.stewardPeerId.length < 16 || payload.stewardPeerId.length > 160 || typeof payload.stateHash !== 'string' || !/^[a-f0-9]{64}$/.test(payload.stateHash) || !Array.isArray(payload.witnesses) || payload.witnesses.length > 8 || payload.witnesses.some(witness => typeof witness !== 'string' || witness.length < 16 || witness.length > 160)) throw new Error('Hall checkpoint is invalid')
    return
  }
  if (event.kind === 'room.sync.request') {
    const payload = event.payload as { readonly targetPeerId?: unknown } | undefined
    if (typeof payload?.targetPeerId !== 'string' || payload.targetPeerId.length < 16 || payload.targetPeerId.length > 160) throw new Error('Room sync target is invalid')
    return
  }
  throw new Error('Unsupported room event')
}

function assertUnsigned(value: unknown, now: number, allowHistoricalPresence = false): asserts value is UnsignedRoomEvent {
  if (typeof value !== 'object' || value === null) throw new Error('Room event must be an object')
  const event = value as Partial<UnsignedRoomEvent>
  if (event.version !== 1 || event.roomId !== 'hall') throw new Error('Unsupported room event')
  if (typeof event.eventId !== 'string' || event.eventId.length < 16 || event.eventId.length > 80) throw new Error('Room event id is invalid')
  if (typeof event.origin !== 'string' || event.origin.length < 16 || event.origin.length > 160) throw new Error('Room event origin is invalid')
  if (!Number.isSafeInteger(event.sequence) || (event.sequence ?? 0) <= 0) throw new Error('Room event sequence is invalid')
  const historicalJoin = allowHistoricalPresence && event.kind === 'hall.presence' && (event.payload as Partial<HallPresenceInput> | undefined)?.action === 'join'
  if (!Number.isSafeInteger(event.issuedAt) || (event.issuedAt ?? 0) > now + MAX_CLOCK_SKEW_MS || (!historicalJoin && (event.issuedAt ?? 0) < now - MAX_EVENT_AGE_MS)) throw new Error('Room event timestamp is outside the accepted window')
  if (typeof event.publicKey !== 'string' || event.publicKey.length > 512) throw new Error('Room event public key is invalid')
  assertPayload(event)
  if (event.kind === 'hall.presence') {
    const presence = event as { readonly issuedAt: number; readonly payload: HallPresenceInput }
    if (!allowHistoricalPresence && presence.payload.action === 'join' && presence.issuedAt < now - JOIN_FRESHNESS_MS) throw new Error('Hall join event is stale')
  }
}

async function signEvent(
  privateKey: CarbonPrivateKey,
  details: Pick<UnsignedRoomEvent, 'kind' | 'payload'>,
  sequence: number,
  now: number,
): Promise<SignedRoomEvent> {
  const base = {
    version: 1 as const, roomId: 'hall' as const, eventId: crypto.randomUUID(),
    origin: peerIdFromPublicKey(privateKey.publicKey).toString(), sequence, issuedAt: now,
    publicKey: Buffer.from(publicKeyToProtobuf(privateKey.publicKey)).toString('base64'),
  }
  let normalizedDetails = details
  if (details.kind === 'hall.presence') {
    const presence = details as { readonly kind: 'hall.presence'; readonly payload: HallPresenceInput }
    if (presence.payload.action === 'join' && presence.payload.admission === undefined) normalizedDetails = { kind: 'hall.presence', payload: { ...presence.payload, admission: await mineAdmission(base.origin, now) } }
  }
  const unsigned = { ...base, ...normalizedDetails } as UnsignedRoomEvent
  assertUnsigned(unsigned, now)
  const signature = await privateKey.sign(canonicalBytes(unsigned))
  return { ...unsigned, signature: Buffer.from(signature).toString('base64') } as SignedRoomEvent
}

export function signRoomEvent(privateKey: CarbonPrivateKey, input: PostRoomMessageInput, sequence: number, now = Date.now()): Promise<SignedRoomEvent> {
  return signEvent(privateKey, { kind: 'chat.message', payload: input }, sequence, now)
}

export function signPresenceEvent(privateKey: CarbonPrivateKey, input: HallPresenceInput, sequence: number, now = Date.now()): Promise<SignedRoomEvent> {
  return signEvent(privateKey, { kind: 'hall.presence', payload: input }, sequence, now)
}

export function signSyncRequest(privateKey: CarbonPrivateKey, targetPeerId: string, sequence: number, now = Date.now()): Promise<SignedRoomEvent> {
  return signEvent(privateKey, { kind: 'room.sync.request', payload: { targetPeerId } }, sequence, now)
}

export function signCheckpointEvent(privateKey: CarbonPrivateKey, payload: Omit<HallCheckpoint, 'issuedAt'>, sequence: number, now = Date.now()): Promise<SignedRoomEvent> {
  return signEvent(privateKey, { kind: 'hall.checkpoint', payload }, sequence, now)
}

export async function verifyRoomEvent(value: unknown, now = Date.now(), options: { readonly allowHistoricalPresence?: boolean } = {}): Promise<SignedRoomEvent> {
  assertUnsigned(value, now, options.allowHistoricalPresence === true)
  const signature = (value as Partial<SignedRoomEvent>).signature
  if (typeof signature !== 'string' || signature.length > 512) throw new Error('Room event signature is invalid')
  let publicKey
  try {
    publicKey = publicKeyFromProtobuf(Buffer.from(value.publicKey, 'base64'))
  } catch (cause) {
    throw new Error('Room event public key cannot be decoded', { cause })
  }
  if (peerIdFromPublicKey(publicKey).toString() !== value.origin) throw new Error('Room event public key does not match its origin')
  if (!await publicKey.verify(canonicalBytes(value), Buffer.from(signature, 'base64'))) throw new Error('Room event signature verification failed')
  return { ...value, signature } as SignedRoomEvent
}

interface MutableParticipant extends HallParticipant {
  profile: RoomProfile
  lastPresenceAt: number
}

interface MutableSeat {
  participant: MutableParticipant
  seatedAt: number
  lastSpokeAt?: number
}

interface DerivedHall {
  seats: Array<MutableSeat | null>
  queue: MutableParticipant[]
  cooldownUntil: Map<string, number>
  messages: RoomMessage[]
  profiles: Record<string, RoomProfile>
  avatars: Record<string, string>
  updatedAt: number
}

function eventOrder(left: SignedRoomEvent, right: SignedRoomEvent): number {
  return left.issuedAt - right.issuedAt || left.origin.localeCompare(right.origin) || left.sequence - right.sequence
}

function fillSeats(state: DerivedHall, at: number): void {
  for (let index = 0; index < state.seats.length && state.queue.length > 0; index += 1) {
    if (state.seats[index] !== null) continue
    state.seats[index] = { participant: state.queue.shift()!, seatedAt: at }
  }
}

function removeParticipant(state: DerivedHall, peerId: string, at: number, cooldown: boolean): void {
  let removedSeat = false
  state.seats = state.seats.map(seat => {
    if (seat?.participant.peerId !== peerId) return seat
    removedSeat = true
    return null
  })
  state.queue = state.queue.filter(participant => participant.peerId !== peerId)
  if (removedSeat && cooldown) state.cooldownUntil.set(peerId, at + NETWORK_HALL_RULES.cooldownMs)
  fillSeats(state, at)
}

function nextExpiry(state: DerivedHall): { readonly at: number; readonly peerId: string; readonly cooldown: boolean } | undefined {
  let next: { readonly at: number; readonly peerId: string; readonly cooldown: boolean } | undefined
  for (const seat of state.seats) {
    if (seat === null) continue
    const at = Math.min(
      seat.seatedAt + NETWORK_HALL_RULES.maxLeaseMs,
      (seat.lastSpokeAt ?? seat.seatedAt) + NETWORK_HALL_RULES.idleMs,
      seat.participant.lastPresenceAt + NETWORK_HALL_RULES.presenceTtlMs,
    )
    if (next === undefined || at < next.at) next = { at, peerId: seat.participant.peerId, cooldown: true }
  }
  for (const participant of state.queue) {
    const at = participant.lastPresenceAt + NETWORK_HALL_RULES.presenceTtlMs
    if (next === undefined || at < next.at) next = { at, peerId: participant.peerId, cooldown: false }
  }
  return next
}

function advance(state: DerivedHall, target: number): void {
  for (;;) {
    const expiry = nextExpiry(state)
    if (expiry === undefined || expiry.at > target) return
    removeParticipant(state, expiry.peerId, expiry.at, expiry.cooldown)
  }
}

function participantFor(state: DerivedHall, peerId: string): MutableParticipant | undefined {
  return state.seats.find(seat => seat?.participant.peerId === peerId)?.participant
    ?? state.queue.find(participant => participant.peerId === peerId)
}

function derive(events: readonly SignedRoomEvent[], now: number): DerivedHall {
  const state: DerivedHall = {
    seats: Array.from({ length: NETWORK_HALL_RULES.seatCount }, () => null),
    queue: [], cooldownUntil: new Map(), messages: [], profiles: {}, avatars: {}, updatedAt: 0,
  }

  for (const event of [...events].sort(eventOrder)) {
    advance(state, event.issuedAt)
    state.updatedAt = Math.max(state.updatedAt, event.issuedAt)
    if (event.kind === 'hall.presence') {
      if (event.payload.action === 'leave') {
        removeParticipant(state, event.origin, event.issuedAt, false)
        continue
      }
      const existing = participantFor(state, event.origin)
      if (existing !== undefined) {
        if (event.payload.profile !== undefined) {
          existing.profile = event.payload.profile
          state.profiles[event.origin] = profileReference(event.payload.profile)
          if (event.payload.profile.avatarCid !== undefined && event.payload.profile.avatarUrl !== undefined) state.avatars[event.payload.profile.avatarCid] = event.payload.profile.avatarUrl
        }
        existing.lastPresenceAt = event.issuedAt
        continue
      }
      if (event.payload.action === 'heartbeat') continue
      if ((state.cooldownUntil.get(event.origin) ?? 0) > event.issuedAt) continue
      const participantCount = state.queue.length + state.seats.reduce((count, seat) => count + (seat === null ? 0 : 1), 0)
      if (participantCount >= NETWORK_HALL_RULES.capacity) continue
      const participant: MutableParticipant = {
        peerId: event.origin,
        profile: event.payload.profile!,
        joinedAt: event.payload.joinedAt!,
        lastPresenceAt: event.issuedAt,
      }
      state.profiles[event.origin] = profileReference(participant.profile)
      if (participant.profile.avatarCid !== undefined && participant.profile.avatarUrl !== undefined) state.avatars[participant.profile.avatarCid] = participant.profile.avatarUrl
      state.queue.push(participant)
      state.queue.sort((left, right) => left.joinedAt - right.joinedAt || left.peerId.localeCompare(right.peerId))
      fillSeats(state, event.issuedAt)
      continue
    }
    if (event.kind !== 'chat.message') continue
    const seat = state.seats.find(candidate => candidate?.participant.peerId === event.origin)
    if (seat === undefined || seat === null) continue
    if (seat.lastSpokeAt !== undefined && event.issuedAt - seat.lastSpokeAt < NETWORK_HALL_RULES.slowModeMs) continue
    const recent = state.messages.slice(-NETWORK_HALL_RULES.maxConsecutiveMessages)
    if (recent.length === NETWORK_HALL_RULES.maxConsecutiveMessages && recent.every(message => message.origin === event.origin)) continue
    seat.lastSpokeAt = event.issuedAt
    state.messages.push({
      id: event.eventId, origin: event.origin, sequence: event.sequence,
      sentAt: event.issuedAt, body: event.payload.body,
    })
    while (state.messages.length > MAX_RETAINED_MESSAGES) state.messages.shift()
  }
  advance(state, now)
  return state
}

export class RoomEventLedger {
  private readonly seenEventIds = new Set<string>()
  private readonly lastSequenceByOrigin = new Map<string, number>()
  private readonly events: SignedRoomEvent[] = []
  private readonly eventById = new Map<string, SignedRoomEvent>()
  private readonly revisions = new Map<string, number>()
  private readonly joinBasisByOrigin = new Map<string, string>()
  private readonly latestPresenceByOrigin = new Map<string, string>()
  private latestCheckpointEventId: string | undefined
  private revision = 0

  accept(event: SignedRoomEvent): RoomMessage | undefined {
    if (event.kind === 'room.sync.request' || this.seenEventIds.has(event.eventId)) return undefined
    this.expirePresenceIndexes(event.issuedAt)
    const isJoin = event.kind === 'hall.presence' && event.payload.action === 'join'
    const hasJoinBasis = this.joinBasisByOrigin.has(event.origin)
    // A valid signature proves control of a key, not room admission. Requiring a
    // retained join basis prevents cheap key rotation from filling replay state.
    if (!isJoin && !hasJoinBasis) return undefined
    const previousSequence = this.lastSequenceByOrigin.get(event.origin) ?? 0
    if (event.sequence <= previousSequence) return undefined
    if (isJoin && !hasJoinBasis && this.joinBasisByOrigin.size >= MAX_TRACKED_JOIN_ORIGINS) return undefined
    if (event.kind === 'hall.checkpoint' && !this.checkpointIsValid(event)) return undefined
    this.seenEventIds.add(event.eventId)
    this.lastSequenceByOrigin.delete(event.origin)
    this.lastSequenceByOrigin.set(event.origin, event.sequence)
    this.events.push(event)
    this.eventById.set(event.eventId, event)
    this.revision += 1
    this.revisions.set(event.eventId, this.revision)
    if (event.kind === 'hall.presence') {
      if (event.payload.action === 'join') {
        this.joinBasisByOrigin.set(event.origin, event.eventId)
        this.latestPresenceByOrigin.set(event.origin, event.eventId)
      } else if (event.payload.action === 'heartbeat' && this.joinBasisByOrigin.has(event.origin)) {
        this.latestPresenceByOrigin.set(event.origin, event.eventId)
      } else if (event.payload.action === 'leave') {
        this.joinBasisByOrigin.delete(event.origin)
        this.latestPresenceByOrigin.delete(event.origin)
      }
    } else if (event.kind === 'hall.checkpoint') {
      this.latestCheckpointEventId = event.eventId
    }
    this.pruneSequenceOrigins()
    this.prune(event.issuedAt)
    if (event.kind !== 'chat.message') return undefined
    return this.snapshot(event.issuedAt).messages.find(message => message.id === event.eventId)
  }

  snapshot(now = Date.now(), viewerPeerId?: string): RoomSnapshot {
    this.expirePresenceIndexes(now)
    const state = derive(this.events, now)
    const seats: Array<HallSeat | null> = state.seats.map(seat => seat === null ? null : {
      participant: { peerId: seat.participant.peerId, profile: profileReference(seat.participant.profile), joinedAt: seat.participant.joinedAt },
      seatedAt: seat.seatedAt,
      ...(seat.lastSpokeAt === undefined ? {} : { lastSpokeAt: seat.lastSpokeAt }),
      leaseExpiresAt: seat.seatedAt + NETWORK_HALL_RULES.maxLeaseMs,
      idleExpiresAt: (seat.lastSpokeAt ?? seat.seatedAt) + NETWORK_HALL_RULES.idleMs,
    })
    const fullQueue = state.queue.map(participant => ({ peerId: participant.peerId, profile: profileReference(participant.profile), joinedAt: participant.joinedAt }))
    const compact = viewerPeerId !== undefined
    const queue = compact ? fullQueue.slice(0, NETWORK_HALL_RULES.clientQueuePreview) : fullQueue
    const messages = compact ? state.messages.slice(-NETWORK_HALL_RULES.clientMessageWindow) : state.messages
    const relevantOrigins = compact
      ? new Set([...seats.flatMap(seat => seat === null ? [] : [seat.participant.peerId]), ...messages.map(message => message.origin), viewerPeerId])
      : new Set(Object.keys(state.profiles))
    const profiles = Object.fromEntries([...relevantOrigins].flatMap(origin => state.profiles[origin] === undefined ? [] : [[origin, state.profiles[origin]!]]))
    const avatarCids = new Set(Object.values(profiles).flatMap(profile => profile.avatarCid === undefined ? [] : [profile.avatarCid]))
    const avatars = Object.fromEntries([...avatarCids].flatMap(cid => state.avatars[cid] === undefined ? [] : [[cid, state.avatars[cid]!]]))
    const checkpointCandidate = this.latestCheckpointEventId === undefined ? undefined : this.eventById.get(this.latestCheckpointEventId)
    const checkpointEvent = checkpointCandidate?.kind === 'hall.checkpoint' ? checkpointCandidate : undefined
    const localQueueIndex = viewerPeerId === undefined ? -1 : fullQueue.findIndex(participant => participant.peerId === viewerPeerId)
    return {
      roomId: 'hall', seats,
      queue, queueCount: fullQueue.length, participantCount: fullQueue.length + seats.filter(Boolean).length, capacity: NETWORK_HALL_RULES.capacity,
      ...(localQueueIndex < 0 ? {} : { localQueuePosition: localQueueIndex + 1 }),
      messages, profiles, avatars, cursor: this.revision,
      ...(checkpointEvent === undefined ? {} : { checkpoint: { ...checkpointEvent.payload, issuedAt: checkpointEvent.issuedAt } }),
      updatedAt: state.updatedAt,
    }
  }

  delta(afterCursor: number, now = Date.now(), viewerPeerId?: string): RoomDelta {
    const snapshot = this.snapshot(now, viewerPeerId)
    const revisions = this.events.map(event => this.revisions.get(event.eventId) ?? this.revision)
    const oldestRevision = revisions.length === 0 ? this.revision : Math.min(...revisions)
    const reset = !Number.isSafeInteger(afterCursor) || afterCursor < 0 || afterCursor > this.revision || afterCursor < oldestRevision - 1
    const changedMessageIds = reset ? undefined : new Set(this.events
      .filter(event => event.kind === 'chat.message' && (this.revisions.get(event.eventId) ?? 0) > afterCursor)
      .map(event => event.eventId))
    if (!reset) {
      const relevantOrigins = new Set(snapshot.seats.flatMap(seat => seat === null ? [] : [seat.participant.peerId]))
      for (const event of this.events) {
        if ((this.revisions.get(event.eventId) ?? 0) <= afterCursor) continue
        if (event.kind === 'chat.message' || event.kind === 'hall.presence') relevantOrigins.add(event.origin)
      }
      const profiles = Object.fromEntries([...relevantOrigins].flatMap(origin => snapshot.profiles[origin] === undefined ? [] : [[origin, snapshot.profiles[origin]!]]))
      const avatarCids = new Set(Object.values(profiles).flatMap(profile => profile.avatarCid === undefined ? [] : [profile.avatarCid]))
      const avatars = Object.fromEntries([...avatarCids].flatMap(cid => snapshot.avatars[cid] === undefined ? [] : [[cid, snapshot.avatars[cid]!]]))
      return {
        ...snapshot,
        messages: snapshot.messages.filter(message => changedMessageIds?.has(message.id) === true),
        profiles,
        avatars,
        reset,
      }
    }
    return {
      ...snapshot,
      reset,
    }
  }

  evidence(eventId: string, now = Date.now()): import('./types.js').EvidenceBundle | undefined {
    const event = this.eventById.get(eventId)
    return event === undefined ? undefined : { format: 'dsh-carbon-club-evidence/v1', exportedAt: now, event }
  }

  checkpointPayload(now = Date.now(), witnesses: readonly string[] = []): Omit<HallCheckpoint, 'issuedAt'> | undefined {
    const state = derive(this.events, now)
    const participantIds = [...state.seats.flatMap(seat => seat === null ? [] : [seat.participant.peerId]), ...state.queue.map(participant => participant.peerId)].sort()
    const stewardPeerId = participantIds[0]
    if (stewardPeerId === undefined) return undefined
    return {
      epoch: Math.floor(now / 60_000), stewardPeerId,
      stateHash: this.stateHash(state), witnesses: [...new Set(witnesses)].filter(peerId => peerId !== stewardPeerId).sort().slice(0, 8),
    }
  }

  eventsForSync(limit = MAX_SYNC_EVENTS, now = Date.now()): readonly SignedRoomEvent[] {
    this.expirePresenceIndexes(now)
    const state = derive(this.events, now)
    const activeOrigins = new Set([...state.seats.flatMap(seat => seat === null ? [] : [seat.participant.peerId]), ...state.queue.map(participant => participant.peerId)])
    const ids = new Set<string>()
    for (const origin of activeOrigins) {
      const basis = this.joinBasisByOrigin.get(origin)
      const latest = this.latestPresenceByOrigin.get(origin)
      if (basis !== undefined) ids.add(basis)
      if (latest !== undefined) ids.add(latest)
    }
    for (const event of this.events.filter(event => event.kind === 'chat.message').slice(-MAX_RETAINED_MESSAGES)) ids.add(event.eventId)
    if (this.latestCheckpointEventId !== undefined) ids.add(this.latestCheckpointEventId)
    return this.events.filter(event => ids.has(event.eventId)).sort(eventOrder).slice(-limit)
  }

  diagnostics(now = Date.now()): { readonly revision: number; readonly retainedEvents: number; readonly activeParticipants: number; readonly syncEvents: number; readonly trackedSequenceOrigins: number } {
    const state = derive(this.events, now)
    return {
      revision: this.revision,
      retainedEvents: this.events.length,
      activeParticipants: state.queue.length + state.seats.filter(Boolean).length,
      syncEvents: this.eventsForSync(MAX_SYNC_EVENTS, now).length,
      trackedSequenceOrigins: this.lastSequenceByOrigin.size,
    }
  }

  private expirePresenceIndexes(now: number): void {
    for (const [origin, eventId] of this.latestPresenceByOrigin) {
      const event = this.eventById.get(eventId)
      if (event === undefined || event.issuedAt < now - NETWORK_HALL_RULES.presenceTtlMs) {
        this.latestPresenceByOrigin.delete(origin)
        this.joinBasisByOrigin.delete(origin)
      }
    }
  }

  private prune(now: number): void {
    this.expirePresenceIndexes(now)
    while (this.events.length > MAX_RETAINED_EVENTS) {
      const protectedIds = new Set([...this.joinBasisByOrigin.values(), ...this.latestPresenceByOrigin.values()])
      if (this.latestCheckpointEventId !== undefined) protectedIds.add(this.latestCheckpointEventId)
      for (const event of this.events.filter(event => event.kind === 'chat.message').slice(-MAX_RETAINED_MESSAGES)) protectedIds.add(event.eventId)
      const removeAt = this.events.findIndex(event => !protectedIds.has(event.eventId))
      const [removed] = this.events.splice(removeAt < 0 ? 0 : removeAt, 1)
      if (removed === undefined) return
      this.seenEventIds.delete(removed.eventId)
      this.eventById.delete(removed.eventId)
      this.revisions.delete(removed.eventId)
      // Active origins retain their high-water mark. Inactive marks are kept in a
      // bounded LRU so old events cannot turn into permanent remote memory growth.
    }
  }

  private pruneSequenceOrigins(): void {
    while (this.lastSequenceByOrigin.size > MAX_TRACKED_SEQUENCE_ORIGINS) {
      let removed = false
      for (const origin of this.lastSequenceByOrigin.keys()) {
        if (this.joinBasisByOrigin.has(origin)) continue
        this.lastSequenceByOrigin.delete(origin)
        removed = true
        break
      }
      if (!removed) return
    }
  }

  private checkpointIsValid(event: SignedRoomEvent & { readonly kind: 'hall.checkpoint' }): boolean {
    const expected = this.checkpointPayload(event.issuedAt, event.payload.witnesses)
    return expected !== undefined && event.origin === expected.stewardPeerId && event.payload.stewardPeerId === expected.stewardPeerId && event.payload.epoch === expected.epoch && event.payload.stateHash === expected.stateHash
  }

  private stateHash(state: DerivedHall): string {
    const canonical = {
      seats: state.seats.map(seat => seat?.participant.peerId ?? null),
      queue: state.queue.map(participant => participant.peerId),
      messages: state.messages.slice(-32).map(message => message.id),
    }
    return createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
  }
}
