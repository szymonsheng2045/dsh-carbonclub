import { useSyncExternalStore } from 'react'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { ConnectResult, EvidenceBundle, InviteInfo, NetworkStatus, PostRoomMessageInput, RoomDelta, RoomMessage, RoomProfile, RoomSnapshot } from '../network/types.js'

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
}

const listeners = new Set<() => void>()
let remote: CarbonClubRemote | undefined
let snapshot: NetworkSnapshot = { phase: 'starting', addresses: [], connectedPeers: 0, discoveredPeers: 0, bootstrapConfigured: 0, relayAddresses: 0 }

function emit(next: NetworkSnapshot): void {
  snapshot = next
  for (const listener of listeners) listener()
}

function failureMessage(result: { readonly ok: false; readonly error: { readonly message: string } }): string {
  return result.error.message
}

export function bindNetworkRemote(next: CarbonClubRemote): () => void {
  remote = next
  void refreshNetwork()
  return () => { if (remote === next) remote = undefined }
}

export async function refreshNetwork(): Promise<void> {
  const api = remote
  if (api === undefined) return
  try {
    const [status, room] = await Promise.all([api.status(), api.roomDelta(snapshot.room?.cursor ?? -1)])
    if (!status.ok) throw new Error(failureMessage(status))
    if (!room.ok) throw new Error(failureMessage(room))
    emit({
      ...status.value, room: mergeRoom(snapshot.room, room.value),
      ...(snapshot.invite === undefined ? {} : { invite: snapshot.invite }),
      ...(snapshot.busy === undefined ? {} : { busy: snapshot.busy }),
      ...(snapshot.actionError === undefined ? {} : { actionError: snapshot.actionError }),
    })
  } catch (error) {
    emit({ ...snapshot, phase: 'error', error: error instanceof Error ? error.message : String(error) })
  }
}

function mergeRoom(previous: RoomSnapshot | undefined, delta: RoomDelta): RoomSnapshot {
  if (previous === undefined || delta.reset) {
    const { reset: _reset, ...room } = delta
    return room
  }
  const byId = new Map(previous.messages.map(message => [message.id, message]))
  for (const message of delta.messages) byId.set(message.id, message)
  return {
    roomId: 'hall', seats: delta.seats, queue: delta.queue, queueCount: delta.queueCount, participantCount: delta.participantCount, capacity: delta.capacity,
    ...(delta.localQueuePosition === undefined ? {} : { localQueuePosition: delta.localQueuePosition }),
    profiles: { ...previous.profiles, ...delta.profiles }, avatars: { ...previous.avatars, ...delta.avatars },
    messages: [...byId.values()].sort((left, right) => left.sentAt - right.sentAt || left.origin.localeCompare(right.origin) || left.sequence - right.sequence).slice(-200),
    cursor: delta.cursor, ...(delta.checkpoint === undefined ? {} : { checkpoint: delta.checkpoint }), updatedAt: delta.updatedAt,
  }
}

export async function requestEvidence(eventId: string): Promise<EvidenceBundle | undefined> {
  const api = remote
  if (api === undefined) return undefined
  const result = await api.evidence(eventId)
  if (!result.ok) {
    emit({ ...snapshot, actionError: failureMessage(result) })
    return undefined
  }
  return result.value
}

export async function postNetworkMessage(input: PostRoomMessageInput): Promise<boolean> {
  const api = remote
  if (api === undefined) {
    emit({ ...snapshot, actionError: 'Carbon Club Host connection is unavailable' })
    return false
  }
  try {
    const result = await api.postRoomMessage(input)
    if (!result.ok) throw new Error(failureMessage(result))
    const currentRoom = snapshot.room
    if (currentRoom !== undefined) {
      const previous = currentRoom.messages
      emit({
        ...snapshot,
        room: {
          ...currentRoom,
          messages: previous.some(message => message.id === result.value.id) ? previous : [...previous, result.value],
          updatedAt: Math.max(currentRoom.updatedAt, result.value.sentAt),
        },
        actionError: undefined,
      })
    } else {
      await refreshNetwork()
    }
    return true
  } catch (error) {
    emit({ ...snapshot, actionError: error instanceof Error ? error.message : String(error) })
    return false
  }
}

export async function joinNetworkHall(profile: RoomProfile): Promise<boolean> {
  const api = remote
  if (api === undefined) {
    emit({ ...snapshot, actionError: 'Carbon Club Host connection is unavailable' })
    return false
  }
  emit({ ...snapshot, busy: 'hall', actionError: undefined })
  try {
    const result = await api.joinHall(profile)
    if (!result.ok) throw new Error(failureMessage(result))
    emit({ ...snapshot, room: result.value, busy: undefined, actionError: undefined })
    return true
  } catch (error) {
    emit({ ...snapshot, busy: undefined, actionError: error instanceof Error ? error.message : String(error) })
    return false
  }
}

export async function leaveNetworkHall(): Promise<boolean> {
  const api = remote
  if (api === undefined) {
    emit({ ...snapshot, actionError: 'Carbon Club Host connection is unavailable' })
    return false
  }
  emit({ ...snapshot, busy: 'hall', actionError: undefined })
  try {
    const result = await api.leaveHall()
    if (!result.ok) throw new Error(failureMessage(result))
    emit({ ...snapshot, room: result.value, busy: undefined, actionError: undefined })
    return true
  } catch (error) {
    emit({ ...snapshot, busy: undefined, actionError: error instanceof Error ? error.message : String(error) })
    return false
  }
}

export async function requestInvite(): Promise<void> {
  const api = remote
  if (api === undefined) {
    emit({ ...snapshot, actionError: 'Carbon Club Host connection is unavailable' })
    return
  }
  emit({ ...snapshot, busy: 'invite', actionError: undefined })
  try {
    const result = await api.createInvite()
    if (!result.ok) throw new Error(failureMessage(result))
    emit({ ...snapshot, invite: result.value, busy: undefined, actionError: undefined })
  } catch (error) {
    emit({ ...snapshot, busy: undefined, actionError: error instanceof Error ? error.message : String(error) })
  }
}

export async function connectWithInvite(code: string): Promise<boolean> {
  const api = remote
  if (api === undefined) {
    emit({ ...snapshot, actionError: 'Carbon Club Host connection is unavailable' })
    return false
  }
  emit({ ...snapshot, busy: 'connect', actionError: undefined })
  try {
    const result = await api.connect(code)
    if (!result.ok) throw new Error(failureMessage(result))
    emit({ ...snapshot, busy: undefined, actionError: undefined })
    await refreshNetwork()
    return result.value.connected
  } catch (error) {
    emit({ ...snapshot, busy: undefined, actionError: error instanceof Error ? error.message : String(error) })
    return false
  }
}

export function useNetworkSnapshot(): NetworkSnapshot {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener) } }, () => snapshot, () => snapshot)
}
