import { useSyncExternalStore } from 'react'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { ConnectResult, EvidenceBundle, InviteInfo, NetworkStatus, PostRoomMessageInput, RoomDelta, RoomMessage, RoomProfile, RoomSnapshot } from '../network/types.js'
import { NETWORK_HALL_RULES } from '../network/hall-rules.js'
import { boundedRequest } from './request.js'

export interface CarbonClubRemote {
  status(): Promise<RemoteResult<NetworkStatus>>
  createInvite(): Promise<RemoteResult<InviteInfo>>
  connect(code: string): Promise<RemoteResult<ConnectResult>>
  roomSnapshot(): Promise<RemoteResult<RoomSnapshot>>
  roomDelta(cursor: number): Promise<RemoteResult<RoomDelta>>
  evidence(eventId: string): Promise<RemoteResult<EvidenceBundle>>
  joinHall(profile: RoomProfile): Promise<RemoteResult<RoomSnapshot>>
  leaveHall(): Promise<RemoteResult<RoomSnapshot>>
  postRoomMessage(input: PostRoomMessageInput): Promise<RemoteResult<RoomMessage>>
}

export interface NetworkSnapshot extends NetworkStatus {
  readonly invite?: InviteInfo | undefined
  readonly busy?: 'invite' | 'connect' | 'hall' | undefined
  readonly actionError?: string | undefined
  readonly room?: RoomSnapshot | undefined
  readonly posting?: boolean | undefined
}

const listeners = new Set<() => void>()
let remote: CarbonClubRemote | undefined
const initialSnapshot = (): NetworkSnapshot => ({ phase: 'starting', addresses: [], connectedPeers: 0, discoveredPeers: 0, bootstrapConfigured: 0, relayAddresses: 0 })
let snapshot: NetworkSnapshot = initialSnapshot()
let binding = 0
let roomVersion = 0
let refreshInFlight: Promise<void> | undefined
let hallActions: Promise<unknown> = Promise.resolve()

export function getNetworkSnapshot(): NetworkSnapshot { return snapshot }

function emit(next: NetworkSnapshot): void {
  snapshot = next
  for (const listener of listeners) listener()
}

function failureMessage(result: { readonly ok: false; readonly error: { readonly message: string } }): string {
  return result.error.message
}

export function bindNetworkRemote(next: CarbonClubRemote): () => void {
  const current = ++binding
  remote = next
  refreshInFlight = undefined
  hallActions = Promise.resolve()
  emit(initialSnapshot())
  void refreshNetwork()
  return () => {
    if (binding !== current) return
    ++binding
    remote = undefined
    refreshInFlight = undefined
    emit(initialSnapshot())
  }
}

export function refreshNetwork(): Promise<void> {
  if (refreshInFlight !== undefined) return refreshInFlight
  const work = refreshCurrentNetwork()
  refreshInFlight = work
  void work.finally(() => { if (refreshInFlight === work) refreshInFlight = undefined })
  return work
}

async function refreshCurrentNetwork(): Promise<void> {
  const api = remote
  if (api === undefined) return
  const current = binding
  const version = roomVersion
  try {
    const [status, room] = await boundedRequest(Promise.all([api.status(), api.roomDelta(snapshot.room?.cursor ?? -1)]))
    // A response from an old Host or from before a join/leave/send is obsolete.
    if (current !== binding || version !== roomVersion || snapshot.busy === 'hall' || snapshot.posting) return
    if (!status.ok) throw new Error(failureMessage(status))
    if (!room.ok) throw new Error(failureMessage(room))
    emit({
      ...status.value, room: mergeRoom(snapshot.room, room.value, status.value.peerId),
      ...(snapshot.invite === undefined ? {} : { invite: snapshot.invite }),
      ...(snapshot.busy === undefined ? {} : { busy: snapshot.busy }),
      ...(snapshot.actionError === undefined ? {} : { actionError: snapshot.actionError }),
    })
  } catch (error) {
    if (current !== binding || version !== roomVersion) return
    emit({ ...snapshot, phase: 'error', error: error instanceof Error ? error.message : String(error) })
  }
}

export function mergeRoom(previous: RoomSnapshot | undefined, delta: RoomDelta, localPeerId?: string): RoomSnapshot {
  if (previous === undefined || delta.reset) {
    const { reset: _reset, ...room } = delta
    return room
  }
  const byId = new Map(previous.messages.map(message => [message.id, message]))
  for (const message of delta.messages) byId.set(message.id, message)
  const messages = [...byId.values()].sort((left, right) => left.sentAt - right.sentAt || left.origin.localeCompare(right.origin) || left.sequence - right.sequence).slice(-NETWORK_HALL_RULES.clientMessageWindow)
  const relevant = new Set([
    ...delta.seats.flatMap(seat => seat === null ? [] : [seat.participant.peerId]),
    ...delta.queue.map(participant => participant.peerId), ...messages.map(message => message.origin),
    ...(localPeerId === undefined ? [] : [localPeerId]),
  ])
  const profiles = Object.fromEntries(Object.entries({ ...previous.profiles, ...delta.profiles }).filter(([peer]) => relevant.has(peer)))
  const avatarCids = new Set(Object.values(profiles).flatMap(profile => profile.avatarCid === undefined ? [] : [profile.avatarCid]))
  const avatars = Object.fromEntries(Object.entries({ ...previous.avatars, ...delta.avatars }).filter(([cid]) => avatarCids.has(cid)))
  return {
    roomId: 'hall', seats: delta.seats, queue: delta.queue, queueCount: delta.queueCount, participantCount: delta.participantCount, capacity: delta.capacity,
    ...(delta.localQueuePosition === undefined ? {} : { localQueuePosition: delta.localQueuePosition }),
    profiles, avatars, messages,
    cursor: delta.cursor, ...(delta.checkpoint === undefined ? {} : { checkpoint: delta.checkpoint }), updatedAt: delta.updatedAt,
  }
}

export async function requestEvidence(eventId: string): Promise<EvidenceBundle | undefined> {
  const api = remote
  if (api === undefined) return undefined
  const current = binding
  try {
    const result = await boundedRequest(api.evidence(eventId))
    if (current !== binding) return undefined
    if (!result.ok) throw new Error(failureMessage(result))
    return result.value
  } catch (error) {
    if (current === binding) emit({ ...snapshot, actionError: error instanceof Error ? error.message : String(error) })
    return undefined
  }
}

export async function postNetworkMessage(input: PostRoomMessageInput): Promise<boolean> {
  const api = remote
  if (api === undefined) {
    emit({ ...snapshot, actionError: 'Carbon Club Host connection is unavailable' })
    return false
  }
  if (snapshot.posting) return false
  const current = binding
  emit({ ...snapshot, posting: true, actionError: undefined })
  const work = hallActions.then(async () => {
    if (current !== binding) return false
    ++roomVersion
    try {
      const result = await boundedRequest(api.postRoomMessage(input))
      if (current !== binding) return false
      if (!result.ok) throw new Error(failureMessage(result))
      const currentRoom = snapshot.room
      if (currentRoom !== undefined) {
        const previous = currentRoom.messages
        emit({
          ...snapshot,
          room: {
            ...currentRoom,
            messages: previous.some(message => message.id === result.value.id) ? previous : [...previous, result.value].slice(-NETWORK_HALL_RULES.clientMessageWindow),
            updatedAt: Math.max(currentRoom.updatedAt, result.value.sentAt),
          },
          actionError: undefined,
        })
      }
      return true
    } catch (error) {
      if (current === binding) emit({ ...snapshot, actionError: error instanceof Error ? error.message : String(error) })
      return false
    } finally {
      if (current === binding) {
        ++roomVersion
        emit({ ...snapshot, posting: false })
      }
    }
  })
  hallActions = work
  return work
}

function changeHall(action: (api: CarbonClubRemote) => Promise<RemoteResult<RoomSnapshot>>): Promise<boolean> {
  const api = remote
  if (api === undefined) {
    emit({ ...snapshot, actionError: 'Carbon Club Host connection is unavailable' })
    return Promise.resolve(false)
  }
  const current = binding
  // Preserve profile-update/leave order even when the user changes data rapidly.
  const work = hallActions.then(async () => {
    if (current !== binding) return false
    ++roomVersion
    emit({ ...snapshot, busy: 'hall', actionError: undefined })
    try {
      const result = await boundedRequest(action(api))
      if (current !== binding) return false
      if (!result.ok) throw new Error(failureMessage(result))
      emit({ ...snapshot, room: result.value, actionError: undefined })
      return true
    } catch (error) {
      if (current === binding) emit({ ...snapshot, actionError: error instanceof Error ? error.message : String(error) })
      return false
    } finally {
      if (current === binding) {
        ++roomVersion
        emit({ ...snapshot, busy: undefined })
      }
    }
  })
  hallActions = work
  return work
}

export function joinNetworkHall(profile: RoomProfile): Promise<boolean> {
  return changeHall(api => api.joinHall(profile))
}

export function leaveNetworkHall(): Promise<boolean> {
  return changeHall(api => api.leaveHall())
}

export async function requestInvite(): Promise<void> {
  const api = remote
  if (api === undefined) {
    emit({ ...snapshot, actionError: 'Carbon Club Host connection is unavailable' })
    return
  }
  if (snapshot.busy !== undefined) return
  const current = binding
  emit({ ...snapshot, busy: 'invite', actionError: undefined })
  try {
    const result = await boundedRequest(api.createInvite())
    if (current !== binding) return
    if (!result.ok) throw new Error(failureMessage(result))
    emit({ ...snapshot, invite: result.value, busy: undefined, actionError: undefined })
  } catch (error) {
    if (current === binding) emit({ ...snapshot, busy: undefined, actionError: error instanceof Error ? error.message : String(error) })
  }
}

export async function connectWithInvite(code: string): Promise<boolean> {
  const api = remote
  if (api === undefined) {
    emit({ ...snapshot, actionError: 'Carbon Club Host connection is unavailable' })
    return false
  }
  if (snapshot.busy !== undefined) return false
  const current = binding
  emit({ ...snapshot, busy: 'connect', actionError: undefined })
  try {
    const result = await boundedRequest(api.connect(code), 40_000)
    if (current !== binding) return false
    if (!result.ok) throw new Error(failureMessage(result))
    emit({ ...snapshot, busy: undefined, actionError: undefined })
    await refreshNetwork()
    return result.value.connected
  } catch (error) {
    if (current === binding) emit({ ...snapshot, busy: undefined, actionError: error instanceof Error ? error.message : String(error) })
    return false
  }
}

export function useNetworkSnapshot(): NetworkSnapshot {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener) } }, getNetworkSnapshot, getNetworkSnapshot)
}
