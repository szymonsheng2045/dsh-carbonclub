export type NetworkPhase = 'starting' | 'online' | 'error'

export interface NetworkStatus {
  readonly phase: NetworkPhase
  readonly peerId?: string
  readonly addresses: readonly string[]
  readonly connectedPeers: number
  readonly discoveredPeers: number
  readonly bootstrapConfigured: number
  readonly relayAddresses: number
  readonly error?: string
}

export interface InviteInfo {
  readonly code: string
  readonly peerId: string
  readonly addresses: readonly string[]
  readonly expiresAt: number
}

export interface ConnectResult {
  readonly connected: boolean
  readonly peerId: string
}

export interface InvitePayload {
  readonly version: 1
  readonly roomId: 'hall'
  readonly peerId: string
  readonly addresses: readonly string[]
  readonly issuedAt: number
  readonly expiresAt: number
  readonly publicKey: string
  readonly signature: string
}

export interface RoomProfile {
  readonly name: string
  readonly avatarUrl?: string
  readonly avatarCid?: string
  readonly lastCompletedSession?: string
}

export interface PostRoomMessageInput {
  readonly body: string
}

export interface HallPresenceInput {
  readonly action: 'join' | 'heartbeat' | 'leave'
  readonly profile?: RoomProfile
  readonly joinedAt?: number
  readonly admission?: { readonly epoch: number; readonly nonce: number }
}

export interface HallParticipant {
  readonly peerId: string
  readonly profile: RoomProfile
  readonly joinedAt: number
}

export interface HallSeat {
  readonly participant: HallParticipant
  readonly seatedAt: number
  readonly lastSpokeAt?: number
  readonly leaseExpiresAt: number
  readonly idleExpiresAt: number
}

export interface RoomMessage {
  readonly id: string
  readonly origin: string
  readonly sequence: number
  readonly sentAt: number
  readonly body: string
}

export interface HallCheckpoint {
  readonly epoch: number
  readonly stewardPeerId: string
  readonly stateHash: string
  readonly witnesses: readonly string[]
  readonly issuedAt: number
}

export interface RoomSnapshot {
  readonly roomId: 'hall'
  readonly seats: readonly (HallSeat | null)[]
  /** A bounded head preview; use queueCount/localQueuePosition for capacity UI. */
  readonly queue: readonly HallParticipant[]
  readonly queueCount: number
  readonly participantCount: number
  readonly capacity: number
  readonly localQueuePosition?: number
  readonly messages: readonly RoomMessage[]
  readonly profiles: Readonly<Record<string, RoomProfile>>
  readonly avatars: Readonly<Record<string, string>>
  readonly cursor: number
  readonly checkpoint?: HallCheckpoint
  readonly updatedAt: number
}

export interface RoomDelta {
  readonly roomId: 'hall'
  readonly seats: readonly (HallSeat | null)[]
  readonly queue: readonly HallParticipant[]
  readonly queueCount: number
  readonly participantCount: number
  readonly capacity: number
  readonly localQueuePosition?: number
  readonly messages: readonly RoomMessage[]
  readonly profiles: Readonly<Record<string, RoomProfile>>
  readonly avatars: Readonly<Record<string, string>>
  readonly cursor: number
  readonly reset: boolean
  readonly checkpoint?: HallCheckpoint
  readonly updatedAt: number
}

export interface EvidenceBundle {
  readonly format: 'dsh-carbon-club-evidence/v1'
  readonly exportedAt: number
  readonly event: SignedRoomEvent
}

interface RoomEventBase {
  readonly version: 1
  readonly roomId: 'hall'
  readonly eventId: string
  readonly origin: string
  readonly sequence: number
  readonly issuedAt: number
  readonly publicKey: string
}

export type UnsignedRoomEvent = RoomEventBase & (
  | { readonly kind: 'chat.message'; readonly payload: PostRoomMessageInput }
  | { readonly kind: 'hall.presence'; readonly payload: HallPresenceInput }
  | { readonly kind: 'hall.checkpoint'; readonly payload: Omit<HallCheckpoint, 'issuedAt'> }
  | { readonly kind: 'room.sync.request'; readonly payload: { readonly targetPeerId: string } }
)

export type SignedRoomEvent = UnsignedRoomEvent & { readonly signature: string }
