//#region src/typert.host.d.ts
declare const TYPERT: {
  readonly package: "dsh-human-buffer";
  readonly face: "host";
  readonly schemas: readonly [];
  readonly invocations: readonly [{
    readonly id: "dsh-human-buffer#carbonClub/status";
    readonly service: "carbonClub";
    readonly namespace: "carbonClub";
    readonly method: "status";
    readonly invocation: {
      readonly kind: "direct";
    };
    readonly parameters: readonly [];
    readonly result: {
      readonly mode: "strict";
      readonly typeSymbol: "dsh-human-buffer#NetworkStatus";
      readonly schema: import("zod").ZodObject<{
        phase: import("zod").ZodUnion<readonly [import("zod").ZodLiteral<"starting">, import("zod").ZodLiteral<"online">, import("zod").ZodLiteral<"error">]>;
        peerId: import("zod").ZodOptional<import("zod").ZodString>;
        addresses: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodString>>;
        connectedPeers: import("zod").ZodNumber;
        discoveredPeers: import("zod").ZodNumber;
        bootstrapConfigured: import("zod").ZodNumber;
        relayAddresses: import("zod").ZodNumber;
        error: import("zod").ZodOptional<import("zod").ZodString>;
      }, import("zod/v4/core").$strict>;
    };
    readonly sourceLocation: {
      readonly file: "src/index.ts";
      readonly line: 25;
      readonly column: 3;
    };
  }, {
    readonly id: "dsh-human-buffer#carbonClub/createInvite";
    readonly service: "carbonClub";
    readonly namespace: "carbonClub";
    readonly method: "createInvite";
    readonly invocation: {
      readonly kind: "direct";
    };
    readonly parameters: readonly [];
    readonly result: {
      readonly mode: "strict";
      readonly typeSymbol: "dsh-human-buffer#InviteInfo";
      readonly schema: import("zod").ZodObject<{
        code: import("zod").ZodString;
        peerId: import("zod").ZodString;
        addresses: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodString>>;
        expiresAt: import("zod").ZodNumber;
      }, import("zod/v4/core").$strict>;
    };
    readonly sourceLocation: {
      readonly file: "src/index.ts";
      readonly line: 37;
      readonly column: 3;
    };
  }, {
    readonly id: "dsh-human-buffer#carbonClub/connect";
    readonly service: "carbonClub";
    readonly namespace: "carbonClub";
    readonly method: "connect";
    readonly invocation: {
      readonly kind: "direct";
    };
    readonly parameters: readonly [{
      readonly name: "code";
      readonly wire: "code";
      readonly source: "json";
      readonly codec: {
        readonly mode: "strict";
        readonly typeSymbol: "string";
        readonly schema: import("zod").ZodString;
      };
    }];
    readonly result: {
      readonly mode: "strict";
      readonly typeSymbol: "dsh-human-buffer#ConnectResult";
      readonly schema: import("zod").ZodObject<{
        connected: import("zod").ZodBoolean;
        peerId: import("zod").ZodString;
      }, import("zod/v4/core").$strict>;
    };
    readonly sourceLocation: {
      readonly file: "src/index.ts";
      readonly line: 45;
      readonly column: 3;
    };
  }, {
    readonly id: "dsh-human-buffer#carbonClub/roomSnapshot";
    readonly service: "carbonClub";
    readonly namespace: "carbonClub";
    readonly method: "roomSnapshot";
    readonly invocation: {
      readonly kind: "direct";
    };
    readonly parameters: readonly [];
    readonly result: {
      readonly mode: "strict";
      readonly typeSymbol: "dsh-human-buffer#RoomSnapshot";
      readonly schema: import("zod").ZodObject<{
        roomId: import("zod").ZodLiteral<"hall">;
        seats: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodNullable<import("zod").ZodObject<{
          participant: import("zod").ZodObject<{
            peerId: import("zod").ZodString;
            profile: import("zod").ZodObject<{
              name: import("zod").ZodString;
              avatarUrl: import("zod").ZodOptional<import("zod").ZodString>;
              avatarCid: import("zod").ZodOptional<import("zod").ZodString>;
              lastCompletedSession: import("zod").ZodOptional<import("zod").ZodString>;
            }, import("zod/v4/core").$strict>;
            joinedAt: import("zod").ZodNumber;
          }, import("zod/v4/core").$strict>;
          seatedAt: import("zod").ZodNumber;
          lastSpokeAt: import("zod").ZodOptional<import("zod").ZodNumber>;
          leaseExpiresAt: import("zod").ZodNumber;
          idleExpiresAt: import("zod").ZodNumber;
        }, import("zod/v4/core").$strict>>>>;
        queue: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodObject<{
          peerId: import("zod").ZodString;
          profile: import("zod").ZodObject<{
            name: import("zod").ZodString;
            avatarUrl: import("zod").ZodOptional<import("zod").ZodString>;
            avatarCid: import("zod").ZodOptional<import("zod").ZodString>;
            lastCompletedSession: import("zod").ZodOptional<import("zod").ZodString>;
          }, import("zod/v4/core").$strict>;
          joinedAt: import("zod").ZodNumber;
        }, import("zod/v4/core").$strict>>>;
        queueCount: import("zod").ZodNumber;
        participantCount: import("zod").ZodNumber;
        capacity: import("zod").ZodLiteral<500>;
        localQueuePosition: import("zod").ZodOptional<import("zod").ZodNumber>;
        messages: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodObject<{
          id: import("zod").ZodString;
          origin: import("zod").ZodString;
          sequence: import("zod").ZodNumber;
          sentAt: import("zod").ZodNumber;
          body: import("zod").ZodString;
        }, import("zod/v4/core").$strict>>>;
        profiles: import("zod").ZodReadonly<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodObject<{
          name: import("zod").ZodString;
          avatarUrl: import("zod").ZodOptional<import("zod").ZodString>;
          avatarCid: import("zod").ZodOptional<import("zod").ZodString>;
          lastCompletedSession: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strict>>>;
        avatars: import("zod").ZodReadonly<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodString>>;
        cursor: import("zod").ZodNumber;
        checkpoint: import("zod").ZodOptional<import("zod").ZodObject<{
          epoch: import("zod").ZodNumber;
          stewardPeerId: import("zod").ZodString;
          stateHash: import("zod").ZodString;
          witnesses: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodString>>;
          issuedAt: import("zod").ZodNumber;
        }, import("zod/v4/core").$strict>>;
        updatedAt: import("zod").ZodNumber;
      }, import("zod/v4/core").$strict>;
    };
  }, {
    readonly id: "dsh-human-buffer#carbonClub/roomDelta";
    readonly service: "carbonClub";
    readonly namespace: "carbonClub";
    readonly method: "roomDelta";
    readonly invocation: {
      readonly kind: "direct";
    };
    readonly parameters: readonly [{
      readonly name: "cursor";
      readonly wire: "cursor";
      readonly source: "json";
      readonly codec: {
        readonly mode: "strict";
        readonly typeSymbol: "number";
        readonly schema: import("zod").ZodNumber;
      };
    }];
    readonly result: {
      readonly mode: "strict";
      readonly typeSymbol: "dsh-human-buffer#RoomDelta";
      readonly schema: import("zod").ZodObject<{
        roomId: import("zod").ZodLiteral<"hall">;
        seats: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodNullable<import("zod").ZodObject<{
          participant: import("zod").ZodObject<{
            peerId: import("zod").ZodString;
            profile: import("zod").ZodObject<{
              name: import("zod").ZodString;
              avatarUrl: import("zod").ZodOptional<import("zod").ZodString>;
              avatarCid: import("zod").ZodOptional<import("zod").ZodString>;
              lastCompletedSession: import("zod").ZodOptional<import("zod").ZodString>;
            }, import("zod/v4/core").$strict>;
            joinedAt: import("zod").ZodNumber;
          }, import("zod/v4/core").$strict>;
          seatedAt: import("zod").ZodNumber;
          lastSpokeAt: import("zod").ZodOptional<import("zod").ZodNumber>;
          leaseExpiresAt: import("zod").ZodNumber;
          idleExpiresAt: import("zod").ZodNumber;
        }, import("zod/v4/core").$strict>>>>;
        queue: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodObject<{
          peerId: import("zod").ZodString;
          profile: import("zod").ZodObject<{
            name: import("zod").ZodString;
            avatarUrl: import("zod").ZodOptional<import("zod").ZodString>;
            avatarCid: import("zod").ZodOptional<import("zod").ZodString>;
            lastCompletedSession: import("zod").ZodOptional<import("zod").ZodString>;
          }, import("zod/v4/core").$strict>;
          joinedAt: import("zod").ZodNumber;
        }, import("zod/v4/core").$strict>>>;
        queueCount: import("zod").ZodNumber;
        participantCount: import("zod").ZodNumber;
        capacity: import("zod").ZodLiteral<500>;
        localQueuePosition: import("zod").ZodOptional<import("zod").ZodNumber>;
        messages: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodObject<{
          id: import("zod").ZodString;
          origin: import("zod").ZodString;
          sequence: import("zod").ZodNumber;
          sentAt: import("zod").ZodNumber;
          body: import("zod").ZodString;
        }, import("zod/v4/core").$strict>>>;
        profiles: import("zod").ZodReadonly<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodObject<{
          name: import("zod").ZodString;
          avatarUrl: import("zod").ZodOptional<import("zod").ZodString>;
          avatarCid: import("zod").ZodOptional<import("zod").ZodString>;
          lastCompletedSession: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strict>>>;
        avatars: import("zod").ZodReadonly<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodString>>;
        cursor: import("zod").ZodNumber;
        checkpoint: import("zod").ZodOptional<import("zod").ZodObject<{
          epoch: import("zod").ZodNumber;
          stewardPeerId: import("zod").ZodString;
          stateHash: import("zod").ZodString;
          witnesses: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodString>>;
          issuedAt: import("zod").ZodNumber;
        }, import("zod/v4/core").$strict>>;
        updatedAt: import("zod").ZodNumber;
        reset: import("zod").ZodBoolean;
      }, import("zod/v4/core").$strict>;
    };
  }, {
    readonly id: "dsh-human-buffer#carbonClub/evidence";
    readonly service: "carbonClub";
    readonly namespace: "carbonClub";
    readonly method: "evidence";
    readonly invocation: {
      readonly kind: "direct";
    };
    readonly parameters: readonly [{
      readonly name: "eventId";
      readonly wire: "eventId";
      readonly source: "json";
      readonly codec: {
        readonly mode: "strict";
        readonly typeSymbol: "string";
        readonly schema: import("zod").ZodString;
      };
    }];
    readonly result: {
      readonly mode: "strict";
      readonly typeSymbol: "dsh-human-buffer#EvidenceBundle";
      readonly schema: import("zod").ZodObject<{
        format: import("zod").ZodLiteral<"dsh-carbon-club-evidence/v1">;
        exportedAt: import("zod").ZodNumber;
        event: import("zod").ZodUnknown;
      }, import("zod/v4/core").$strict>;
    };
  }, {
    readonly id: "dsh-human-buffer#carbonClub/joinHall";
    readonly service: "carbonClub";
    readonly namespace: "carbonClub";
    readonly method: "joinHall";
    readonly invocation: {
      readonly kind: "direct";
    };
    readonly parameters: readonly [{
      readonly name: "profile";
      readonly wire: "profile";
      readonly source: "json";
      readonly codec: {
        readonly mode: "strict";
        readonly typeSymbol: "dsh-human-buffer#RoomProfile";
        readonly schema: import("zod").ZodObject<{
          name: import("zod").ZodString;
          avatarUrl: import("zod").ZodOptional<import("zod").ZodString>;
          avatarCid: import("zod").ZodOptional<import("zod").ZodString>;
          lastCompletedSession: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strict>;
      };
    }];
    readonly result: {
      readonly mode: "strict";
      readonly typeSymbol: "dsh-human-buffer#RoomSnapshot";
      readonly schema: import("zod").ZodObject<{
        roomId: import("zod").ZodLiteral<"hall">;
        seats: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodNullable<import("zod").ZodObject<{
          participant: import("zod").ZodObject<{
            peerId: import("zod").ZodString;
            profile: import("zod").ZodObject<{
              name: import("zod").ZodString;
              avatarUrl: import("zod").ZodOptional<import("zod").ZodString>;
              avatarCid: import("zod").ZodOptional<import("zod").ZodString>;
              lastCompletedSession: import("zod").ZodOptional<import("zod").ZodString>;
            }, import("zod/v4/core").$strict>;
            joinedAt: import("zod").ZodNumber;
          }, import("zod/v4/core").$strict>;
          seatedAt: import("zod").ZodNumber;
          lastSpokeAt: import("zod").ZodOptional<import("zod").ZodNumber>;
          leaseExpiresAt: import("zod").ZodNumber;
          idleExpiresAt: import("zod").ZodNumber;
        }, import("zod/v4/core").$strict>>>>;
        queue: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodObject<{
          peerId: import("zod").ZodString;
          profile: import("zod").ZodObject<{
            name: import("zod").ZodString;
            avatarUrl: import("zod").ZodOptional<import("zod").ZodString>;
            avatarCid: import("zod").ZodOptional<import("zod").ZodString>;
            lastCompletedSession: import("zod").ZodOptional<import("zod").ZodString>;
          }, import("zod/v4/core").$strict>;
          joinedAt: import("zod").ZodNumber;
        }, import("zod/v4/core").$strict>>>;
        queueCount: import("zod").ZodNumber;
        participantCount: import("zod").ZodNumber;
        capacity: import("zod").ZodLiteral<500>;
        localQueuePosition: import("zod").ZodOptional<import("zod").ZodNumber>;
        messages: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodObject<{
          id: import("zod").ZodString;
          origin: import("zod").ZodString;
          sequence: import("zod").ZodNumber;
          sentAt: import("zod").ZodNumber;
          body: import("zod").ZodString;
        }, import("zod/v4/core").$strict>>>;
        profiles: import("zod").ZodReadonly<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodObject<{
          name: import("zod").ZodString;
          avatarUrl: import("zod").ZodOptional<import("zod").ZodString>;
          avatarCid: import("zod").ZodOptional<import("zod").ZodString>;
          lastCompletedSession: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strict>>>;
        avatars: import("zod").ZodReadonly<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodString>>;
        cursor: import("zod").ZodNumber;
        checkpoint: import("zod").ZodOptional<import("zod").ZodObject<{
          epoch: import("zod").ZodNumber;
          stewardPeerId: import("zod").ZodString;
          stateHash: import("zod").ZodString;
          witnesses: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodString>>;
          issuedAt: import("zod").ZodNumber;
        }, import("zod/v4/core").$strict>>;
        updatedAt: import("zod").ZodNumber;
      }, import("zod/v4/core").$strict>;
    };
  }, {
    readonly id: "dsh-human-buffer#carbonClub/leaveHall";
    readonly service: "carbonClub";
    readonly namespace: "carbonClub";
    readonly method: "leaveHall";
    readonly invocation: {
      readonly kind: "direct";
    };
    readonly parameters: readonly [];
    readonly result: {
      readonly mode: "strict";
      readonly typeSymbol: "dsh-human-buffer#RoomSnapshot";
      readonly schema: import("zod").ZodObject<{
        roomId: import("zod").ZodLiteral<"hall">;
        seats: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodNullable<import("zod").ZodObject<{
          participant: import("zod").ZodObject<{
            peerId: import("zod").ZodString;
            profile: import("zod").ZodObject<{
              name: import("zod").ZodString;
              avatarUrl: import("zod").ZodOptional<import("zod").ZodString>;
              avatarCid: import("zod").ZodOptional<import("zod").ZodString>;
              lastCompletedSession: import("zod").ZodOptional<import("zod").ZodString>;
            }, import("zod/v4/core").$strict>;
            joinedAt: import("zod").ZodNumber;
          }, import("zod/v4/core").$strict>;
          seatedAt: import("zod").ZodNumber;
          lastSpokeAt: import("zod").ZodOptional<import("zod").ZodNumber>;
          leaseExpiresAt: import("zod").ZodNumber;
          idleExpiresAt: import("zod").ZodNumber;
        }, import("zod/v4/core").$strict>>>>;
        queue: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodObject<{
          peerId: import("zod").ZodString;
          profile: import("zod").ZodObject<{
            name: import("zod").ZodString;
            avatarUrl: import("zod").ZodOptional<import("zod").ZodString>;
            avatarCid: import("zod").ZodOptional<import("zod").ZodString>;
            lastCompletedSession: import("zod").ZodOptional<import("zod").ZodString>;
          }, import("zod/v4/core").$strict>;
          joinedAt: import("zod").ZodNumber;
        }, import("zod/v4/core").$strict>>>;
        queueCount: import("zod").ZodNumber;
        participantCount: import("zod").ZodNumber;
        capacity: import("zod").ZodLiteral<500>;
        localQueuePosition: import("zod").ZodOptional<import("zod").ZodNumber>;
        messages: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodObject<{
          id: import("zod").ZodString;
          origin: import("zod").ZodString;
          sequence: import("zod").ZodNumber;
          sentAt: import("zod").ZodNumber;
          body: import("zod").ZodString;
        }, import("zod/v4/core").$strict>>>;
        profiles: import("zod").ZodReadonly<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodObject<{
          name: import("zod").ZodString;
          avatarUrl: import("zod").ZodOptional<import("zod").ZodString>;
          avatarCid: import("zod").ZodOptional<import("zod").ZodString>;
          lastCompletedSession: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strict>>>;
        avatars: import("zod").ZodReadonly<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodString>>;
        cursor: import("zod").ZodNumber;
        checkpoint: import("zod").ZodOptional<import("zod").ZodObject<{
          epoch: import("zod").ZodNumber;
          stewardPeerId: import("zod").ZodString;
          stateHash: import("zod").ZodString;
          witnesses: import("zod").ZodReadonly<import("zod").ZodArray<import("zod").ZodString>>;
          issuedAt: import("zod").ZodNumber;
        }, import("zod/v4/core").$strict>>;
        updatedAt: import("zod").ZodNumber;
      }, import("zod/v4/core").$strict>;
    };
  }, {
    readonly id: "dsh-human-buffer#carbonClub/postRoomMessage";
    readonly service: "carbonClub";
    readonly namespace: "carbonClub";
    readonly method: "postRoomMessage";
    readonly invocation: {
      readonly kind: "direct";
    };
    readonly parameters: readonly [{
      readonly name: "input";
      readonly wire: "input";
      readonly source: "json";
      readonly codec: {
        readonly mode: "strict";
        readonly typeSymbol: "dsh-human-buffer#PostRoomMessageInput";
        readonly schema: import("zod").ZodObject<{
          body: import("zod").ZodString;
        }, import("zod/v4/core").$strict>;
      };
    }];
    readonly result: {
      readonly mode: "strict";
      readonly typeSymbol: "dsh-human-buffer#RoomMessage";
      readonly schema: import("zod").ZodObject<{
        id: import("zod").ZodString;
        origin: import("zod").ZodString;
        sequence: import("zod").ZodNumber;
        sentAt: import("zod").ZodNumber;
        body: import("zod").ZodString;
      }, import("zod/v4/core").$strict>;
    };
  }];
  readonly model: {
    readonly services: readonly [];
    readonly events: readonly [];
    readonly objects: readonly [];
  };
};
//#endregion
export { TYPERT, TYPERT as default };
//# sourceMappingURL=typert.host.d.ts.map