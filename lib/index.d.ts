import { a as InviteInfo, c as RoomDelta, d as RoomSnapshot, l as RoomMessage, n as EvidenceBundle, o as NetworkStatus, s as PostRoomMessageInput, t as ConnectResult, u as RoomProfile } from "./types-Co5N6E2q.js";
import { a as signPresenceEvent, c as verifyRoomEvent, i as RoomEventLedger, l as CarbonPrivateKey, n as HALL_TOPIC, o as signRoomEvent, s as signSyncRequest, t as HALL_SYNC_PROTOCOL, u as RememberedPeer } from "./protocol-G0TvyN98.js";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { Context } from "@deepseek-ai/cordis";
//#region src/network/project-crypto.d.ts
interface ProjectRoomInvite {
  readonly version: 1;
  readonly roomId: string;
  readonly secret: string;
  readonly epoch: number;
  readonly issuedAt: number;
}
interface EncryptedProjectPayload {
  readonly version: 1;
  readonly roomId: string;
  readonly epoch: number;
  readonly nonce: string;
  readonly ciphertext: string;
  readonly tag: string;
}
declare function createProjectInvite(now?: number): ProjectRoomInvite;
declare function encodeProjectInvite(invite: ProjectRoomInvite): string;
declare function decodeProjectInvite(code: string): ProjectRoomInvite;
declare function encryptProjectPayload(invite: ProjectRoomInvite, plaintext: string | Uint8Array, epoch?: number): EncryptedProjectPayload;
declare function decryptProjectPayload(invite: ProjectRoomInvite, payload: EncryptedProjectPayload): Uint8Array;
declare function rotateProjectInvite(previous: ProjectRoomInvite, now?: number): ProjectRoomInvite;
//#endregion
//#region src/network/node.d.ts
interface CarbonClubNodeOptions {
  readonly rememberedPeers?: readonly RememberedPeer[];
  readonly persistRememberedPeers?: (peers: readonly RememberedPeer[]) => Promise<void>;
  readonly bootstrapAddresses?: readonly string[];
  readonly enableMdns?: boolean;
  readonly enableRelayReservations?: boolean;
}
declare class CarbonClubNode {
  private readonly privateKey;
  private readonly options;
  private node;
  private phase;
  private startupError;
  private readonly discovered;
  private readonly remembered;
  private readonly ledger;
  private localSequence;
  private localPresence;
  private heartbeatTimer;
  private checkpointTimer;
  private ingestion;
  private readonly transportInboundWindows;
  private readonly inboundWindows;
  private readonly syncWindows;
  private readonly pendingDiscoveryDials;
  constructor(privateKey: CarbonPrivateKey, options?: CarbonClubNodeOptions);
  start(): Promise<void>;
  status(): NetworkStatus;
  createInvite(now?: number): Promise<InviteInfo>;
  connect(code: string): Promise<ConnectResult>;
  roomSnapshot(now?: number): RoomSnapshot;
  roomDelta(afterCursor: number, now?: number): RoomDelta;
  evidence(eventId: string, now?: number): EvidenceBundle;
  joinHall(profile: RoomProfile, now?: number): Promise<RoomSnapshot>;
  leaveHall(now?: number): Promise<RoomSnapshot>;
  publishHallMessage(input: PostRoomMessageInput, now?: number): Promise<RoomMessage>;
  stop(): Promise<void>;
  private nextSequence;
  private ensureHeartbeat;
  private clearLocalPresence;
  private requestHistory;
  private publishCheckpoint;
  private publishEvent;
  private requiredNode;
  private inviteAddresses;
  private isAllowedAddress;
  private preparePeer;
  private connectRemembered;
  private rememberPeer;
  private noteDiscovered;
  private pruneDiscovered;
  private allowInbound;
  private allowTransportInbound;
  private allowSync;
}
//#endregion
//#region src/index.d.ts
declare const name = "dsh-human-buffer";
declare const inject: string[];
declare class CarbonClubService extends TypertRemoteService {
  static inject: string[];
  private node?;
  private initError?;
  private readonly ready;
  constructor(ctx: Context);
  status(): Promise<NetworkStatus>;
  createInvite(): Promise<InviteInfo>;
  connect(code: string): Promise<ConnectResult>;
  roomSnapshot(): Promise<RoomSnapshot>;
  roomDelta(cursor: number): Promise<RoomDelta>;
  evidence(eventId: string): Promise<EvidenceBundle>;
  joinHall(profile: RoomProfile): Promise<RoomSnapshot>;
  leaveHall(): Promise<RoomSnapshot>;
  postRoomMessage(input: PostRoomMessageInput): Promise<RoomMessage>;
  private initialize;
}
declare function apply(ctx: Context): void;
//#endregion
export { CarbonClubNode, CarbonClubService, HALL_SYNC_PROTOCOL, HALL_TOPIC, RoomEventLedger, apply, createProjectInvite, decodeProjectInvite, decryptProjectPayload, encodeProjectInvite, encryptProjectPayload, inject, name, rotateProjectInvite, signPresenceEvent, signRoomEvent, signSyncRequest, verifyRoomEvent };
//# sourceMappingURL=index.d.ts.map