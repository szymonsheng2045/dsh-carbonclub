import { a as InviteInfo, d as RoomSnapshot, l as RoomMessage, o as NetworkStatus, s as PostRoomMessageInput, t as ConnectResult, u as RoomProfile } from "./types-Co5N6E2q.js";
import { RemoteResult, TypertRemoteContribution } from "@deepseek-ai/dsh-typert-protocol";
//#region src/typert.remote-client.d.ts
declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespace$636172626f6e436c7562 {
    status: () => Promise<RemoteResult<NetworkStatus>>;
    createInvite: () => Promise<RemoteResult<InviteInfo>>;
    connect: (code: string) => Promise<RemoteResult<ConnectResult>>;
    roomSnapshot: () => Promise<RemoteResult<RoomSnapshot>>;
    joinHall: (profile: RoomProfile) => Promise<RemoteResult<RoomSnapshot>>;
    leaveHall: () => Promise<RemoteResult<RoomSnapshot>>;
    postRoomMessage: (input: PostRoomMessageInput) => Promise<RemoteResult<RoomMessage>>;
  }
  interface TypertRemoteMap {
    'carbonClub/status': () => Promise<RemoteResult<NetworkStatus>>;
    'carbonClub/createInvite': () => Promise<RemoteResult<InviteInfo>>;
    'carbonClub/connect': (code: string) => Promise<RemoteResult<ConnectResult>>;
    'carbonClub/roomSnapshot': () => Promise<RemoteResult<RoomSnapshot>>;
    'carbonClub/joinHall': (profile: RoomProfile) => Promise<RemoteResult<RoomSnapshot>>;
    'carbonClub/leaveHall': () => Promise<RemoteResult<RoomSnapshot>>;
    'carbonClub/postRoomMessage': (input: PostRoomMessageInput) => Promise<RemoteResult<RoomMessage>>;
  }
  interface TypertRemoteNamespaceMap {
    carbonClub: TypertRemoteNamespace$636172626f6e436c7562;
  }
}
declare const TYPERT_REMOTE: TypertRemoteContribution;
//#endregion
export { TYPERT_REMOTE, TYPERT_REMOTE as default };
//# sourceMappingURL=typert.remote-client.d.ts.map