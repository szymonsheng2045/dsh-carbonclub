import { a as InviteInfo, c as RoomDelta, d as RoomSnapshot, l as RoomMessage, n as EvidenceBundle, o as NetworkStatus, s as PostRoomMessageInput, t as ConnectResult, u as RoomProfile } from "./types-BG7HMp2j.js";
import { RemoteResult, TypertRemoteContribution } from "@deepseek-ai/dsh-typert-protocol";
//#region src/typert.remote-client.d.ts
declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespace$636172626f6e436c7562 {
    status: () => Promise<RemoteResult<NetworkStatus>>;
    createInvite: () => Promise<RemoteResult<InviteInfo>>;
    connect: (code: string) => Promise<RemoteResult<ConnectResult>>;
    roomSnapshot: () => Promise<RemoteResult<RoomSnapshot>>;
    roomDelta: (cursor: number) => Promise<RemoteResult<RoomDelta>>;
    evidence: (eventId: string) => Promise<RemoteResult<EvidenceBundle>>;
    joinHall: (profile: RoomProfile) => Promise<RemoteResult<RoomSnapshot>>;
    leaveHall: () => Promise<RemoteResult<RoomSnapshot>>;
    postRoomMessage: (input: PostRoomMessageInput) => Promise<RemoteResult<RoomMessage>>;
  }
  interface TypertRemoteMap {
    'carbonClub/status': () => Promise<RemoteResult<NetworkStatus>>;
    'carbonClub/createInvite': () => Promise<RemoteResult<InviteInfo>>;
    'carbonClub/connect': (code: string) => Promise<RemoteResult<ConnectResult>>;
    'carbonClub/roomSnapshot': () => Promise<RemoteResult<RoomSnapshot>>;
    'carbonClub/roomDelta': (cursor: number) => Promise<RemoteResult<RoomDelta>>;
    'carbonClub/evidence': (eventId: string) => Promise<RemoteResult<EvidenceBundle>>;
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