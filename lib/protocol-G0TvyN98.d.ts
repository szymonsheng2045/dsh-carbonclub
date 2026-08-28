import { c as RoomDelta, d as RoomSnapshot, f as SignedRoomEvent, i as HallPresenceInput, l as RoomMessage, n as EvidenceBundle, r as HallCheckpoint, s as PostRoomMessageInput } from "./types-Co5N6E2q.js";
import { generateKeyPair } from "@libp2p/crypto/keys";
import "@deepseek-ai/dsh-credentials";
//#region src/network/identity.d.ts
type CarbonPrivateKey = Awaited<ReturnType<typeof generateKeyPair>>;
interface RememberedPeer {
  readonly peerId: string;
  readonly addresses: readonly string[];
  readonly rememberedAt: number;
}
//#endregion
//#region src/network/room-events.d.ts
declare const MAX_SYNC_EVENTS = 1300;
declare function signRoomEvent(privateKey: CarbonPrivateKey, input: PostRoomMessageInput, sequence: number, now?: number): Promise<SignedRoomEvent>;
declare function signPresenceEvent(privateKey: CarbonPrivateKey, input: HallPresenceInput, sequence: number, now?: number): Promise<SignedRoomEvent>;
declare function signSyncRequest(privateKey: CarbonPrivateKey, targetPeerId: string, sequence: number, now?: number): Promise<SignedRoomEvent>;
declare function verifyRoomEvent(value: unknown, now?: number, options?: {
  readonly allowHistoricalPresence?: boolean;
}): Promise<SignedRoomEvent>;
declare class RoomEventLedger {
  private readonly seenEventIds;
  private readonly lastSequenceByOrigin;
  private readonly events;
  private readonly eventById;
  private readonly revisions;
  private readonly joinBasisByOrigin;
  private readonly latestPresenceByOrigin;
  private latestCheckpointEventId;
  private revision;
  accept(event: SignedRoomEvent): RoomMessage | undefined;
  snapshot(now?: number, viewerPeerId?: string): RoomSnapshot;
  delta(afterCursor: number, now?: number, viewerPeerId?: string): RoomDelta;
  evidence(eventId: string, now?: number): EvidenceBundle | undefined;
  checkpointPayload(now?: number, witnesses?: readonly string[]): Omit<HallCheckpoint, 'issuedAt'> | undefined;
  eventsForSync(limit?: number, now?: number): readonly SignedRoomEvent[];
  diagnostics(now?: number): {
    readonly revision: number;
    readonly retainedEvents: number;
    readonly activeParticipants: number;
    readonly syncEvents: number;
    readonly trackedSequenceOrigins: number;
  };
  private expirePresenceIndexes;
  private prune;
  private pruneSequenceOrigins;
  private checkpointIsValid;
  private stateHash;
}
//#endregion
//#region src/network/protocol.d.ts
declare const HALL_TOPIC = "/dsh-human-buffer/room/hall/0.5.0";
declare const HALL_SYNC_PROTOCOL = "/dsh-human-buffer/sync/hall/0.5.0";
//#endregion
export { signPresenceEvent as a, verifyRoomEvent as c, RoomEventLedger as i, CarbonPrivateKey as l, HALL_TOPIC as n, signRoomEvent as o, MAX_SYNC_EVENTS as r, signSyncRequest as s, HALL_SYNC_PROTOCOL as t, RememberedPeer as u };
//# sourceMappingURL=protocol-G0TvyN98.d.ts.map