import { z } from "zod";
//#region src/remote-contract.ts
const networkStatusSchema = z.strictObject({
	phase: z.union([
		z.literal("starting"),
		z.literal("online"),
		z.literal("error")
	]),
	peerId: z.string().optional(),
	addresses: z.array(z.string()).readonly(),
	connectedPeers: z.number().int().nonnegative(),
	discoveredPeers: z.number().int().nonnegative(),
	bootstrapConfigured: z.number().int().nonnegative(),
	relayAddresses: z.number().int().nonnegative(),
	error: z.string().optional()
});
const inviteInfoSchema = z.strictObject({
	code: z.string(),
	peerId: z.string(),
	addresses: z.array(z.string()).readonly(),
	expiresAt: z.number().int().positive()
});
const connectResultSchema = z.strictObject({
	connected: z.boolean(),
	peerId: z.string()
});
const inviteCodeSchema = z.string().min(1).max(16384);
const roomProfileSchema = z.strictObject({
	name: z.string().min(1).max(48),
	avatarUrl: z.string().max(12288).optional(),
	avatarCid: z.string().regex(/^sha256:[a-f0-9]{64}$/).optional(),
	lastCompletedSession: z.string().max(120).optional()
});
const postRoomMessageInputSchema = z.strictObject({ body: z.string().min(1).max(400) });
const hallParticipantSchema = z.strictObject({
	peerId: z.string(),
	profile: roomProfileSchema,
	joinedAt: z.number().int().positive()
});
const hallSeatSchema = z.strictObject({
	participant: hallParticipantSchema,
	seatedAt: z.number().int().positive(),
	lastSpokeAt: z.number().int().positive().optional(),
	leaseExpiresAt: z.number().int().positive(),
	idleExpiresAt: z.number().int().positive()
});
const roomMessageSchema = z.strictObject({
	id: z.string(),
	origin: z.string(),
	sequence: z.number().int().positive(),
	sentAt: z.number().int().positive(),
	body: z.string()
});
const hallCheckpointSchema = z.strictObject({
	epoch: z.number().int().nonnegative(),
	stewardPeerId: z.string(),
	stateHash: z.string().regex(/^[a-f0-9]{64}$/),
	witnesses: z.array(z.string()).max(8).readonly(),
	issuedAt: z.number().int().positive()
});
const roomSnapshotSchema = z.strictObject({
	roomId: z.literal("hall"),
	seats: z.array(hallSeatSchema.nullable()).length(8).readonly(),
	queue: z.array(hallParticipantSchema).max(24).readonly(),
	queueCount: z.number().int().min(0).max(500),
	participantCount: z.number().int().min(0).max(500),
	capacity: z.literal(500),
	localQueuePosition: z.number().int().min(1).max(492).optional(),
	messages: z.array(roomMessageSchema).max(50).readonly(),
	profiles: z.record(z.string(), roomProfileSchema).readonly(),
	avatars: z.record(z.string(), z.string().max(12288)).readonly(),
	cursor: z.number().int().nonnegative(),
	checkpoint: hallCheckpointSchema.optional(),
	updatedAt: z.number().int().nonnegative()
});
const roomDeltaSchema = roomSnapshotSchema.extend({ reset: z.boolean() });
const cursorSchema = z.number().int().min(-1);
const eventIdSchema = z.string().min(16).max(80);
const evidenceBundleSchema = z.strictObject({
	format: z.literal("dsh-carbon-club-evidence/v1"),
	exportedAt: z.number().int().positive(),
	event: z.unknown()
});
const remoteInvocations = [
	{
		id: "dsh-human-buffer#carbonClub/status",
		service: "carbonClub",
		namespace: "carbonClub",
		method: "status",
		invocation: { kind: "direct" },
		parameters: [],
		result: {
			mode: "strict",
			typeSymbol: "dsh-human-buffer#NetworkStatus",
			schema: networkStatusSchema
		},
		sourceLocation: {
			file: "src/index.ts",
			line: 25,
			column: 3
		}
	},
	{
		id: "dsh-human-buffer#carbonClub/createInvite",
		service: "carbonClub",
		namespace: "carbonClub",
		method: "createInvite",
		invocation: { kind: "direct" },
		parameters: [],
		result: {
			mode: "strict",
			typeSymbol: "dsh-human-buffer#InviteInfo",
			schema: inviteInfoSchema
		},
		sourceLocation: {
			file: "src/index.ts",
			line: 37,
			column: 3
		}
	},
	{
		id: "dsh-human-buffer#carbonClub/connect",
		service: "carbonClub",
		namespace: "carbonClub",
		method: "connect",
		invocation: { kind: "direct" },
		parameters: [{
			name: "code",
			wire: "code",
			source: "json",
			codec: {
				mode: "strict",
				typeSymbol: "string",
				schema: inviteCodeSchema
			}
		}],
		result: {
			mode: "strict",
			typeSymbol: "dsh-human-buffer#ConnectResult",
			schema: connectResultSchema
		},
		sourceLocation: {
			file: "src/index.ts",
			line: 45,
			column: 3
		}
	},
	{
		id: "dsh-human-buffer#carbonClub/roomSnapshot",
		service: "carbonClub",
		namespace: "carbonClub",
		method: "roomSnapshot",
		invocation: { kind: "direct" },
		parameters: [],
		result: {
			mode: "strict",
			typeSymbol: "dsh-human-buffer#RoomSnapshot",
			schema: roomSnapshotSchema
		}
	},
	{
		id: "dsh-human-buffer#carbonClub/roomDelta",
		service: "carbonClub",
		namespace: "carbonClub",
		method: "roomDelta",
		invocation: { kind: "direct" },
		parameters: [{
			name: "cursor",
			wire: "cursor",
			source: "json",
			codec: {
				mode: "strict",
				typeSymbol: "number",
				schema: cursorSchema
			}
		}],
		result: {
			mode: "strict",
			typeSymbol: "dsh-human-buffer#RoomDelta",
			schema: roomDeltaSchema
		}
	},
	{
		id: "dsh-human-buffer#carbonClub/evidence",
		service: "carbonClub",
		namespace: "carbonClub",
		method: "evidence",
		invocation: { kind: "direct" },
		parameters: [{
			name: "eventId",
			wire: "eventId",
			source: "json",
			codec: {
				mode: "strict",
				typeSymbol: "string",
				schema: eventIdSchema
			}
		}],
		result: {
			mode: "strict",
			typeSymbol: "dsh-human-buffer#EvidenceBundle",
			schema: evidenceBundleSchema
		}
	},
	{
		id: "dsh-human-buffer#carbonClub/joinHall",
		service: "carbonClub",
		namespace: "carbonClub",
		method: "joinHall",
		invocation: { kind: "direct" },
		parameters: [{
			name: "profile",
			wire: "profile",
			source: "json",
			codec: {
				mode: "strict",
				typeSymbol: "dsh-human-buffer#RoomProfile",
				schema: roomProfileSchema
			}
		}],
		result: {
			mode: "strict",
			typeSymbol: "dsh-human-buffer#RoomSnapshot",
			schema: roomSnapshotSchema
		}
	},
	{
		id: "dsh-human-buffer#carbonClub/leaveHall",
		service: "carbonClub",
		namespace: "carbonClub",
		method: "leaveHall",
		invocation: { kind: "direct" },
		parameters: [],
		result: {
			mode: "strict",
			typeSymbol: "dsh-human-buffer#RoomSnapshot",
			schema: roomSnapshotSchema
		}
	},
	{
		id: "dsh-human-buffer#carbonClub/postRoomMessage",
		service: "carbonClub",
		namespace: "carbonClub",
		method: "postRoomMessage",
		invocation: { kind: "direct" },
		parameters: [{
			name: "input",
			wire: "input",
			source: "json",
			codec: {
				mode: "strict",
				typeSymbol: "dsh-human-buffer#PostRoomMessageInput",
				schema: postRoomMessageInputSchema
			}
		}],
		result: {
			mode: "strict",
			typeSymbol: "dsh-human-buffer#RoomMessage",
			schema: roomMessageSchema
		}
	}
];
//#endregion
export { remoteInvocations as t };

//# sourceMappingURL=remote-contract-DpOFRYsr.js.map