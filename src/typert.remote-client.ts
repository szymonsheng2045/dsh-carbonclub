import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { remoteInvocations } from './remote-contract.js'
import type { ConnectResult, InviteInfo, NetworkStatus, PostRoomMessageInput, RoomMessage, RoomProfile, RoomSnapshot } from './network/types.js'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespace$636172626f6e436c7562 {
    status: () => Promise<RemoteResult<NetworkStatus>>
    createInvite: () => Promise<RemoteResult<InviteInfo>>
    connect: (code: string) => Promise<RemoteResult<ConnectResult>>
    roomSnapshot: () => Promise<RemoteResult<RoomSnapshot>>
    joinHall: (profile: RoomProfile) => Promise<RemoteResult<RoomSnapshot>>
    leaveHall: () => Promise<RemoteResult<RoomSnapshot>>
    postRoomMessage: (input: PostRoomMessageInput) => Promise<RemoteResult<RoomMessage>>
  }
  interface TypertRemoteMap {
    'carbonClub/status': () => Promise<RemoteResult<NetworkStatus>>
    'carbonClub/createInvite': () => Promise<RemoteResult<InviteInfo>>
    'carbonClub/connect': (code: string) => Promise<RemoteResult<ConnectResult>>
    'carbonClub/roomSnapshot': () => Promise<RemoteResult<RoomSnapshot>>
    'carbonClub/joinHall': (profile: RoomProfile) => Promise<RemoteResult<RoomSnapshot>>
    'carbonClub/leaveHall': () => Promise<RemoteResult<RoomSnapshot>>
    'carbonClub/postRoomMessage': (input: PostRoomMessageInput) => Promise<RemoteResult<RoomMessage>>
  }
  interface TypertRemoteNamespaceMap { carbonClub: TypertRemoteNamespace$636172626f6e436c7562 }
}

export const TYPERT_REMOTE: TypertRemoteContribution = { package: 'dsh-human-buffer', descriptors: remoteInvocations }
export default TYPERT_REMOTE
