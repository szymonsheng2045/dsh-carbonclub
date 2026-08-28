import { a as signPresenceEvent, c as verifyRoomEvent, d as NETWORK_HALL_RULES, i as signCheckpointEvent, l as HALL_SYNC_PROTOCOL, n as RoomEventLedger, o as signRoomEvent, r as contentAddressProfile, s as signSyncRequest, t as MAX_SYNC_EVENTS, u as HALL_TOPIC } from "./room-events-D9zTpvis.js";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { generateKeyPair, privateKeyFromProtobuf, privateKeyToProtobuf, publicKeyFromProtobuf, publicKeyToProtobuf } from "@libp2p/crypto/keys";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { createLibp2p } from "libp2p";
import { webSockets } from "@libp2p/websockets";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { gossipsub } from "@libp2p/gossipsub";
import { mdns } from "@libp2p/mdns";
import { bootstrap } from "@libp2p/bootstrap";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { autoNAT } from "@libp2p/autonat";
import { dcutr } from "@libp2p/dcutr";
import { peerIdFromPublicKey, peerIdFromString } from "@libp2p/peer-id";
import { multiaddr } from "@multiformats/multiaddr";
import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from "node:crypto";
//#region src/network/identity.ts
const IDENTITY_CREDENTIAL = credentialRef("DSH_CARBON_CLUB_PRIVATE_KEY");
const KNOWN_PEERS_CREDENTIAL = credentialRef("DSH_CARBON_CLUB_KNOWN_PEERS");
async function loadOrCreatePrivateKey(credentials) {
	const stored = await credentials.resolve(IDENTITY_CREDENTIAL);
	if (stored !== void 0) try {
		return privateKeyFromProtobuf(Buffer.from(stored.value, "base64"));
	} catch (cause) {
		throw new Error("Stored Carbon Club identity is invalid", { cause });
	}
	const privateKey = await generateKeyPair("Ed25519");
	await credentials.set(IDENTITY_CREDENTIAL, Buffer.from(privateKeyToProtobuf(privateKey)).toString("base64"));
	return privateKey;
}
async function loadRememberedPeers(credentials) {
	const stored = await credentials.resolve(KNOWN_PEERS_CREDENTIAL);
	if (stored === void 0) return [];
	try {
		const value = JSON.parse(stored.value);
		if (!Array.isArray(value)) return [];
		return value.flatMap((candidate) => {
			if (typeof candidate !== "object" || candidate === null) return [];
			const peer = candidate;
			if (typeof peer.peerId !== "string" || !Array.isArray(peer.addresses) || !Number.isSafeInteger(peer.rememberedAt)) return [];
			const addresses = peer.addresses.filter((address) => typeof address === "string").slice(0, 4);
			return addresses.length === 0 ? [] : [{
				peerId: peer.peerId,
				addresses,
				rememberedAt: peer.rememberedAt
			}];
		}).sort((left, right) => right.rememberedAt - left.rememberedAt).slice(0, 32);
	} catch {
		return [];
	}
}
async function saveRememberedPeers(credentials, peers) {
	await credentials.set(KNOWN_PEERS_CREDENTIAL, JSON.stringify([...peers].sort((left, right) => right.rememberedAt - left.rememberedAt).slice(0, 32)));
}
//#endregion
//#region src/network/invite.ts
const PREFIX = "carbon1.";
const MAX_CODE_LENGTH = 16384;
const MAX_ADDRESSES = 4;
const encoder$1 = new TextEncoder();
function canonicalInviteBytes(payload) {
	return encoder$1.encode(JSON.stringify({
		version: payload.version,
		roomId: payload.roomId,
		peerId: payload.peerId,
		addresses: payload.addresses,
		issuedAt: payload.issuedAt,
		expiresAt: payload.expiresAt
	}));
}
function assertDialAddress(address, expectedPeerId) {
	if (address.length > 512) throw new Error("Invalid invite address");
	try {
		peerIdFromString(expectedPeerId);
	} catch (cause) {
		throw new Error("Invalid invite peer identity", { cause });
	}
	const components = multiaddr(address).getComponents();
	const names = components.map((component) => component.name);
	const isWebSocketBase = [
		"ip4",
		"ip6",
		"dns4",
		"dns6"
	].includes(names[0]) && names[1] === "tcp" && ["ws", "wss"].includes(names[2]) && names[3] === "p2p";
	const direct = names.length === 4 && isWebSocketBase;
	const relayed = names.length === 6 && isWebSocketBase && names[4] === "p2p-circuit" && names[5] === "p2p";
	const identityComponent = relayed ? components[5] : components[3];
	if (!direct && !relayed || identityComponent?.value !== expectedPeerId) throw new Error("Invite address must be a direct or relayed WebSocket libp2p endpoint bound to its peer identity");
	const port = Number(components[1]?.value);
	if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invite address uses a disallowed port");
	const host = components[0]?.value?.toLowerCase();
	if (host === void 0 || host === "0.0.0.0" || host === "::" || host === "255.255.255.255" || host === "localhost" || host.endsWith(".localhost")) throw new Error("Invite address is not dialable");
	if (names[0] === "ip4") {
		const first = Number(host.split(".")[0]);
		if (first >= 224 && first <= 239 || host.startsWith("169.254.")) throw new Error("Invite address uses multicast or link-local IP space");
	}
	if (names[0] === "ip6" && (host.startsWith("ff") || host.startsWith("fe8") || host.startsWith("fe9") || host.startsWith("fea") || host.startsWith("feb"))) throw new Error("Invite address uses multicast or link-local IP space");
}
function assertPayload(value, now) {
	if (typeof value !== "object" || value === null) throw new Error("Invalid Carbon Club invite");
	const candidate = value;
	if (candidate.version !== 1 || candidate.roomId !== "hall") throw new Error("Unsupported Carbon Club invite");
	if (typeof candidate.peerId !== "string" || candidate.peerId.length < 16 || candidate.peerId.length > 160) throw new Error("Invalid invite peer identity");
	if (!Array.isArray(candidate.addresses) || candidate.addresses.length === 0 || candidate.addresses.length > MAX_ADDRESSES) throw new Error("Invite has no usable addresses");
	if (typeof candidate.issuedAt !== "number" || typeof candidate.expiresAt !== "number" || candidate.expiresAt <= candidate.issuedAt) throw new Error("Invalid invite lifetime");
	if (typeof candidate.publicKey !== "string" || candidate.publicKey.length > 512 || typeof candidate.signature !== "string" || candidate.signature.length > 512) throw new Error("Invalid invite signature");
	if (candidate.expiresAt < now) throw new Error("Carbon Club invite has expired");
	if (candidate.expiresAt - candidate.issuedAt > 864e5) throw new Error("Invite lifetime is too long");
	for (const address of candidate.addresses) {
		if (typeof address !== "string") throw new Error("Invalid invite address");
		assertDialAddress(address, candidate.peerId);
	}
}
function encodeInvite(payload) {
	return `${PREFIX}${Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")}`;
}
async function signInvite(privateKey, payload) {
	const publicKey = Buffer.from(publicKeyToProtobuf(privateKey.publicKey)).toString("base64");
	if (peerIdFromPublicKey(privateKey.publicKey).toString() !== payload.peerId) throw new Error("Invite identity does not match signing key");
	const signature = Buffer.from(await privateKey.sign(canonicalInviteBytes(payload))).toString("base64");
	return {
		...payload,
		publicKey,
		signature
	};
}
async function decodeInvite(code, now = Date.now()) {
	const normalized = code.trim();
	if (!normalized.startsWith(PREFIX) || normalized.length > MAX_CODE_LENGTH) throw new Error("Invalid Carbon Club invite");
	let value;
	try {
		value = JSON.parse(Buffer.from(normalized.slice(8), "base64url").toString("utf8"));
	} catch {
		throw new Error("Invalid Carbon Club invite");
	}
	assertPayload(value, now);
	let publicKey;
	try {
		publicKey = publicKeyFromProtobuf(Buffer.from(value.publicKey, "base64"));
	} catch (cause) {
		throw new Error("Invalid invite public key", { cause });
	}
	if (peerIdFromPublicKey(publicKey).toString() !== value.peerId) throw new Error("Invite public key does not match its peer identity");
	const { publicKey: _publicKey, signature: _signature, ...unsigned } = value;
	if (!await publicKey.verify(canonicalInviteBytes(unsigned), Buffer.from(value.signature, "base64"))) throw new Error("Invite signature verification failed");
	return value;
}
//#endregion
//#region src/network/node.ts
const INVITE_TTL_MS = 18e5;
const MAX_EVENT_BYTES = 48e3;
const MAX_SYNC_BYTES = 8388608;
const DISCOVERY_TTL_MS = 18e5;
const DIAL_TIMEOUT_MS = 8e3;
const KEEP_ALIVE_TAG = "keep-alive-carbon-club";
const TARGET_DISCOVERY_CONNECTIONS = 12;
const MAX_PARALLEL_DISCOVERY_DIALS = 4;
const MAX_RATE_LIMIT_ORIGINS = 1024;
const MAX_SYNC_RATE_LIMIT_ORIGINS = 128;
const decoder = new TextDecoder();
const encoder = new TextEncoder();
function errorMessage$1(error) {
	return error instanceof Error ? error.message : String(error);
}
function profileEquals(left, right) {
	return left.name === right.name && left.avatarCid === right.avatarCid && left.lastCompletedSession === right.lastCompletedSession;
}
function streamChunkBytes(chunk) {
	if (chunk instanceof Uint8Array) return chunk;
	if (typeof chunk === "object" && chunk !== null && "subarray" in chunk && typeof chunk.subarray === "function") return chunk.subarray();
	throw new Error("Sync stream returned an unsupported byte chunk");
}
var CarbonClubNode = class {
	privateKey;
	options;
	node;
	phase = "starting";
	startupError;
	discovered = /* @__PURE__ */ new Map();
	remembered = /* @__PURE__ */ new Map();
	ledger = new RoomEventLedger();
	localSequence = 0;
	localPresence;
	heartbeatTimer;
	checkpointTimer;
	ingestion = Promise.resolve();
	transportInboundWindows = /* @__PURE__ */ new Map();
	inboundWindows = /* @__PURE__ */ new Map();
	syncWindows = /* @__PURE__ */ new Map();
	pendingDiscoveryDials = /* @__PURE__ */ new Set();
	constructor(privateKey, options = {}) {
		this.privateKey = privateKey;
		this.options = options;
		for (const peer of options.rememberedPeers ?? []) this.remembered.set(peer.peerId, peer);
	}
	async start() {
		if (this.node !== void 0) return;
		try {
			const bootstrapAddresses = [...this.options.bootstrapAddresses ?? []];
			const node = await createLibp2p({
				privateKey: this.privateKey,
				addresses: { listen: ["/ip4/0.0.0.0/tcp/0/ws", ...this.options.enableRelayReservations === false ? [] : bootstrapAddresses.map((address) => `${address}/p2p-circuit`)] },
				transports: [webSockets(), circuitRelayTransport({
					maxReservationQueueLength: 16,
					reservationConcurrency: 1
				})],
				connectionEncrypters: [noise()],
				streamMuxers: [yamux()],
				peerDiscovery: [...this.options.enableMdns === false ? [] : [mdns()], ...bootstrapAddresses.length === 0 ? [] : [bootstrap({
					list: bootstrapAddresses,
					timeout: 500,
					tagTTL: Infinity
				})]],
				connectionManager: {
					reconnectRetries: 6,
					reconnectRetryInterval: 1e3,
					reconnectBackoffFactor: 2,
					maxParallelReconnects: 4,
					maxConnections: 64,
					maxIncomingPendingConnections: 16,
					inboundConnectionThreshold: 32
				},
				services: {
					identify: identify(),
					pubsub: gossipsub({
						allowPublishToZeroTopicPeers: true,
						emitSelf: false,
						floodPublish: false,
						doPX: true,
						D: 6,
						Dlo: 4,
						Dhi: 12,
						Dout: 2
					}),
					autoNAT: autoNAT({
						timeout: 1e4,
						maxInboundStreams: 2,
						maxOutboundStreams: 2
					}),
					dcutr: dcutr()
				}
			});
			this.node = node;
			await node.handle(HALL_SYNC_PROTOCOL, async (stream, connection) => {
				const remotePeerId = connection.remotePeer.toString();
				if (!this.allowSync(remotePeerId)) {
					stream.abort(/* @__PURE__ */ new Error("Room sync rate limit exceeded"));
					return;
				}
				const requestChunks = [];
				let requestBytes = 0;
				for await (const chunk of stream) {
					const bytes = streamChunkBytes(chunk);
					requestBytes += bytes.byteLength;
					if (requestBytes > 1024) {
						stream.abort(/* @__PURE__ */ new Error("Room sync request exceeds byte budget"));
						return;
					}
					requestChunks.push(bytes);
				}
				const requestData = new Uint8Array(requestBytes);
				let requestOffset = 0;
				for (const chunk of requestChunks) {
					requestData.set(chunk, requestOffset);
					requestOffset += chunk.byteLength;
				}
				const request = JSON.parse(decoder.decode(requestData));
				if (typeof request !== "object" || request === null || !("version" in request) || request.version !== 1 || !("topic" in request) || request.topic !== "/dsh-human-buffer/room/hall/0.5.0") {
					stream.abort(/* @__PURE__ */ new Error("Room sync request is invalid"));
					return;
				}
				const events = this.ledger.eventsForSync(MAX_SYNC_EVENTS);
				const data = encoder.encode(JSON.stringify({
					version: 1,
					topic: HALL_TOPIC,
					events
				}));
				if (data.byteLength > MAX_SYNC_BYTES) {
					stream.abort(/* @__PURE__ */ new Error("Room sync snapshot exceeds byte budget"));
					return;
				}
				stream.send(data);
				await stream.close();
			}, {
				maxInboundStreams: 2,
				maxOutboundStreams: 2,
				runOnLimitedConnection: true
			});
			node.addEventListener("peer:discovery", (event) => {
				const peerId = event.detail.id.toString();
				if (peerId === node.peerId.toString()) return;
				this.noteDiscovered(peerId);
				const addresses = event.detail.multiaddrs.map((address) => address.toString()).map((address) => address.endsWith(`/p2p/${peerId}`) ? address : `${address}/p2p/${peerId}`).filter((address) => this.isAllowedAddress(address, peerId));
				if (addresses.length === 0) return;
				this.rememberPeer(peerId, addresses);
				const connected = new Set(node.getConnections().map((connection) => connection.remotePeer.toString()));
				if (connected.has(peerId) || connected.size >= TARGET_DISCOVERY_CONNECTIONS || this.pendingDiscoveryDials.size >= MAX_PARALLEL_DISCOVERY_DIALS) return;
				this.pendingDiscoveryDials.add(peerId);
				this.preparePeer(peerId, addresses).then(() => node.dial(event.detail.id, { signal: AbortSignal.timeout(DIAL_TIMEOUT_MS) })).catch(() => {}).finally(() => {
					this.pendingDiscoveryDials.delete(peerId);
				});
			});
			node.addEventListener("peer:connect", (event) => {
				const peerId = event.detail.toString();
				node.peerStore.merge(event.detail, { tags: { [KEEP_ALIVE_TAG]: { value: 20 } } }).catch(() => {});
				globalThis.setTimeout(() => {
					this.requestHistory(peerId);
				}, 350);
			});
			node.services.pubsub.addEventListener("message", (event) => {
				if (event.detail.topic !== "/dsh-human-buffer/room/hall/0.5.0" || event.detail.data.byteLength > MAX_EVENT_BYTES) return;
				const transportOrigin = event.detail.type === "signed" ? event.detail.from.toString() : "";
				if (!this.allowTransportInbound(transportOrigin)) return;
				this.ingestion = this.ingestion.then(async () => {
					try {
						const parsed = JSON.parse(decoder.decode(event.detail.data));
						const signed = await verifyRoomEvent(parsed);
						if (!this.allowInbound(signed.origin)) return;
						if (signed.kind === "room.sync.request") return;
						this.ledger.accept(signed);
					} catch {}
				});
			});
			node.services.pubsub.subscribe(HALL_TOPIC);
			this.phase = "online";
			this.checkpointTimer = setInterval(() => {
				this.publishCheckpoint().catch(() => {});
			}, 3e4);
			this.startupError = void 0;
			for (const connection of node.getConnections()) {
				const peerId = connection.remotePeer.toString();
				node.peerStore.merge(connection.remotePeer, { tags: { [KEEP_ALIVE_TAG]: { value: 20 } } }).catch(() => {});
				globalThis.setTimeout(() => {
					this.requestHistory(peerId);
				}, 350);
			}
			for (const address of bootstrapAddresses) node.dial(multiaddr(address), { signal: AbortSignal.timeout(DIAL_TIMEOUT_MS) }).catch(() => {});
			for (const peer of this.remembered.values()) this.connectRemembered(peer);
		} catch (error) {
			this.phase = "error";
			this.startupError = errorMessage$1(error);
			throw error;
		}
	}
	status() {
		const node = this.node;
		this.pruneDiscovered();
		if (node === void 0) return {
			phase: this.phase,
			addresses: [],
			connectedPeers: 0,
			discoveredPeers: this.discovered.size,
			bootstrapConfigured: this.options.bootstrapAddresses?.length ?? 0,
			relayAddresses: 0,
			...this.startupError === void 0 ? {} : { error: this.startupError }
		};
		return {
			phase: this.phase,
			peerId: node.peerId.toString(),
			addresses: this.inviteAddresses(),
			connectedPeers: new Set(node.getConnections().map((connection) => connection.remotePeer.toString())).size,
			discoveredPeers: this.discovered.size,
			bootstrapConfigured: this.options.bootstrapAddresses?.length ?? 0,
			relayAddresses: node.getMultiaddrs().filter((address) => address.toString().includes("/p2p-circuit")).length
		};
	}
	async createInvite(now = Date.now()) {
		const node = this.requiredNode();
		const addresses = this.inviteAddresses();
		if (addresses.length === 0) throw new Error("Carbon Club node has no dialable WebSocket address");
		const expiresAt = now + INVITE_TTL_MS;
		const peerId = node.peerId.toString();
		return {
			code: encodeInvite(await signInvite(this.privateKey, {
				version: 1,
				roomId: "hall",
				peerId,
				addresses,
				issuedAt: now,
				expiresAt
			})),
			peerId,
			addresses,
			expiresAt
		};
	}
	async connect(code) {
		const node = this.requiredNode();
		const invite = await decodeInvite(code);
		await this.rememberPeer(invite.peerId, invite.addresses);
		await this.preparePeer(invite.peerId, invite.addresses);
		let lastError;
		for (const address of invite.addresses) try {
			await node.dial(multiaddr(address), { signal: AbortSignal.timeout(DIAL_TIMEOUT_MS) });
			return {
				connected: true,
				peerId: invite.peerId
			};
		} catch (error) {
			lastError = error;
		}
		throw new Error(`Could not connect to invited peer: ${errorMessage$1(lastError)}`);
	}
	roomSnapshot(now = Date.now()) {
		return this.ledger.snapshot(now, this.node?.peerId.toString());
	}
	roomDelta(afterCursor, now = Date.now()) {
		return this.ledger.delta(afterCursor, now, this.node?.peerId.toString());
	}
	evidence(eventId, now = Date.now()) {
		const bundle = this.ledger.evidence(eventId, now);
		if (bundle === void 0) throw new Error("ROOM_EVENT_NOT_FOUND");
		return bundle;
	}
	async joinHall(profile, now = Date.now()) {
		this.requiredNode();
		profile = contentAddressProfile(profile);
		const previousPresence = this.localPresence;
		const joinedAt = previousPresence?.joinedAt ?? now;
		const action = previousPresence === void 0 ? "join" : "heartbeat";
		const profileChanged = previousPresence === void 0 || !profileEquals(previousPresence.profile, profile);
		this.localPresence = {
			profile,
			joinedAt
		};
		const event = await signPresenceEvent(this.privateKey, {
			action,
			...action === "join" || profileChanged ? { profile } : {},
			joinedAt
		}, this.nextSequence(), now);
		this.ledger.accept(event);
		await this.publishEvent(event);
		const snapshot = this.roomSnapshot(now);
		const localPeerId = this.requiredNode().peerId.toString();
		if (snapshot.seats.some((seat) => seat?.participant.peerId === localPeerId) || snapshot.queue.some((participant) => participant.peerId === localPeerId)) this.ensureHeartbeat();
		else this.clearLocalPresence();
		return snapshot;
	}
	async leaveHall(now = Date.now()) {
		if (this.localPresence === void 0) return this.roomSnapshot(now);
		const event = await signPresenceEvent(this.privateKey, { action: "leave" }, this.nextSequence(), now);
		this.localPresence = void 0;
		this.ledger.accept(event);
		await this.publishEvent(event);
		this.clearLocalPresence();
		return this.roomSnapshot(now);
	}
	async publishHallMessage(input, now = Date.now()) {
		const node = this.requiredNode();
		const presence = this.localPresence;
		if (presence === void 0) throw new Error("HALL_NOT_JOINED");
		const localPeerId = node.peerId.toString();
		const seat = this.roomSnapshot(now).seats.find((candidate) => candidate?.participant.peerId === localPeerId);
		if (seat === void 0 || seat === null) throw new Error("HALL_NOT_SEATED");
		if (!profileEquals(seat.participant.profile, presence.profile)) throw new Error("HALL_PROFILE_SYNC");
		const event = await signRoomEvent(this.privateKey, input, this.nextSequence(), now);
		const message = this.ledger.accept(event);
		if (message === void 0) throw new Error("HALL_RATE_LIMIT");
		await this.publishEvent(event);
		return message;
	}
	async stop() {
		const node = this.node;
		if (node === void 0) return;
		try {
			await this.leaveHall();
		} catch {}
		if (this.heartbeatTimer !== void 0) clearInterval(this.heartbeatTimer);
		if (this.checkpointTimer !== void 0) clearInterval(this.checkpointTimer);
		this.heartbeatTimer = void 0;
		this.checkpointTimer = void 0;
		this.node = void 0;
		this.phase = "starting";
		await node.stop();
	}
	nextSequence() {
		const sequence = Math.max(Math.floor(Date.now() * 1e3), this.localSequence + 1);
		this.localSequence = sequence;
		return sequence;
	}
	ensureHeartbeat() {
		if (this.heartbeatTimer !== void 0) return;
		this.heartbeatTimer = setInterval(() => {
			const presence = this.localPresence;
			if (presence === void 0 || this.node === void 0) return;
			this.joinHall(presence.profile).catch(() => {});
		}, NETWORK_HALL_RULES.presenceHeartbeatMs);
	}
	clearLocalPresence() {
		this.localPresence = void 0;
		if (this.heartbeatTimer !== void 0) clearInterval(this.heartbeatTimer);
		this.heartbeatTimer = void 0;
	}
	async requestHistory(targetPeerId) {
		if (this.node === void 0 || this.phase !== "online") return;
		try {
			const connections = this.node.getConnections().filter((candidate) => candidate.remotePeer.toString() === targetPeerId);
			const connection = connections.find((candidate) => candidate.direct && candidate.limits === void 0) ?? connections[0];
			if (connection === void 0) return;
			const signal = AbortSignal.timeout(DIAL_TIMEOUT_MS);
			const stream = await connection.newStream(HALL_SYNC_PROTOCOL, {
				signal,
				runOnLimitedConnection: true
			});
			stream.maxReadBufferLength = MAX_SYNC_BYTES;
			stream.send(encoder.encode(JSON.stringify({
				version: 1,
				topic: HALL_TOPIC
			})));
			const closeWrite = stream.close({ signal });
			const chunks = [];
			let total = 0;
			for await (const chunk of stream) {
				const bytes = streamChunkBytes(chunk);
				total += bytes.byteLength;
				if (total > MAX_SYNC_BYTES) {
					stream.abort(/* @__PURE__ */ new Error("Room sync snapshot exceeds byte budget"));
					return;
				}
				chunks.push(bytes);
			}
			await closeWrite;
			const merged = new Uint8Array(total);
			let offset = 0;
			for (const chunk of chunks) {
				merged.set(chunk, offset);
				offset += chunk.byteLength;
			}
			const decoded = JSON.parse(decoder.decode(merged));
			if (typeof decoded !== "object" || decoded === null || !("version" in decoded) || decoded.version !== 1 || !("topic" in decoded) || decoded.topic !== "/dsh-human-buffer/room/hall/0.5.0" || !("events" in decoded) || !Array.isArray(decoded.events) || decoded.events.length > 1300) throw new Error("Room sync snapshot is invalid");
			for (const candidate of decoded.events) this.ledger.accept(await verifyRoomEvent(candidate, Date.now(), { allowHistoricalPresence: true }));
		} catch (error) {
			if (process.env.DSH_CARBON_CLUB_DEBUG === "1") console.warn("[carbon-club] room sync failed", targetPeerId, error);
		}
	}
	async publishCheckpoint(now = Date.now()) {
		const node = this.node;
		if (node === void 0 || this.phase !== "online") return;
		const witnesses = node.getConnections().map((connection) => connection.remotePeer.toString());
		const payload = this.ledger.checkpointPayload(now, witnesses);
		if (payload === void 0 || payload.stewardPeerId !== node.peerId.toString()) return;
		const event = await signCheckpointEvent(this.privateKey, payload, this.nextSequence(), now);
		this.ledger.accept(event);
		await this.publishEvent(event);
	}
	async publishEvent(event) {
		const node = this.requiredNode();
		const data = encoder.encode(JSON.stringify(event));
		if (data.byteLength > MAX_EVENT_BYTES) throw new Error("Room event exceeds the network byte budget");
		await node.services.pubsub.publish(HALL_TOPIC, data);
	}
	requiredNode() {
		if (this.node === void 0 || this.phase !== "online") throw new Error(this.startupError ?? "Carbon Club node is still starting");
		return this.node;
	}
	inviteAddresses() {
		const node = this.node;
		if (node === void 0) return [];
		const peerId = node.peerId.toString();
		const peerSuffix = `/p2p/${peerId}`;
		return node.getMultiaddrs().map((address) => address.toString()).map((address) => address.endsWith(peerSuffix) ? address : `${address}${peerSuffix}`).filter((address) => this.isAllowedAddress(address, peerId)).sort((left, right) => Number(right.includes("/p2p-circuit/")) - Number(left.includes("/p2p-circuit/"))).slice(0, 4);
	}
	isAllowedAddress(address, peerId) {
		try {
			assertDialAddress(address, peerId);
			return true;
		} catch {
			return false;
		}
	}
	async preparePeer(peerId, addresses) {
		const node = this.requiredNode();
		const id = peerIdFromString(peerId);
		const parsed = addresses.filter((address) => this.isAllowedAddress(address, peerId)).map((address) => multiaddr(address));
		if (parsed.length === 0) throw new Error("Peer has no allowed WebSocket address");
		await node.peerStore.merge(id, {
			multiaddrs: parsed,
			tags: { [KEEP_ALIVE_TAG]: { value: 20 } }
		});
	}
	async connectRemembered(peer) {
		try {
			await this.preparePeer(peer.peerId, peer.addresses);
			await this.requiredNode().dial(peerIdFromString(peer.peerId), { signal: AbortSignal.timeout(DIAL_TIMEOUT_MS) });
		} catch {}
	}
	async rememberPeer(peerId, addresses) {
		const allowed = addresses.filter((address) => this.isAllowedAddress(address, peerId)).slice(0, 4);
		if (allowed.length === 0) return;
		this.remembered.set(peerId, {
			peerId,
			addresses: allowed,
			rememberedAt: Date.now()
		});
		while (this.remembered.size > 64) {
			const oldest = [...this.remembered.values()].sort((left, right) => left.rememberedAt - right.rememberedAt)[0];
			if (oldest === void 0) break;
			this.remembered.delete(oldest.peerId);
		}
		await this.options.persistRememberedPeers?.([...this.remembered.values()]);
	}
	noteDiscovered(peerId) {
		this.discovered.set(peerId, Date.now());
		this.pruneDiscovered();
		while (this.discovered.size > 512) this.discovered.delete(this.discovered.keys().next().value);
	}
	pruneDiscovered(now = Date.now()) {
		for (const [peerId, seenAt] of this.discovered) if (seenAt < now - DISCOVERY_TTL_MS) this.discovered.delete(peerId);
	}
	allowInbound(origin, now = Date.now()) {
		if (origin.length < 16 || origin.length > 160) return false;
		const current = this.inboundWindows.get(origin);
		if (current === void 0 || now - current.startedAt >= 6e4) {
			for (const [peerId, window] of this.inboundWindows) if (now - window.startedAt >= 6e4) this.inboundWindows.delete(peerId);
			if (current === void 0 && this.inboundWindows.size >= MAX_RATE_LIMIT_ORIGINS) return false;
			this.inboundWindows.set(origin, {
				startedAt: now,
				count: 1
			});
			return true;
		}
		current.count += 1;
		if (this.inboundWindows.size > 512) {
			for (const [peerId, window] of this.inboundWindows) if (now - window.startedAt >= 6e4) this.inboundWindows.delete(peerId);
		}
		return current.count <= 20;
	}
	allowTransportInbound(origin, now = Date.now()) {
		if (origin.length < 16 || origin.length > 160) return false;
		const current = this.transportInboundWindows.get(origin);
		if (current === void 0 || now - current.startedAt >= 6e4) {
			for (const [peerId, window] of this.transportInboundWindows) if (now - window.startedAt >= 6e4) this.transportInboundWindows.delete(peerId);
			if (current === void 0 && this.transportInboundWindows.size >= MAX_RATE_LIMIT_ORIGINS) return false;
			this.transportInboundWindows.set(origin, {
				startedAt: now,
				count: 1
			});
			return true;
		}
		current.count += 1;
		if (this.transportInboundWindows.size > 512) {
			for (const [peerId, window] of this.transportInboundWindows) if (now - window.startedAt >= 6e4) this.transportInboundWindows.delete(peerId);
		}
		return current.count <= 120;
	}
	allowSync(origin, now = Date.now()) {
		for (const [peerId, at] of this.syncWindows) if (now - at > 12e4) this.syncWindows.delete(peerId);
		if (now - (this.syncWindows.get(origin) ?? 0) < 6e4) return false;
		if (!this.syncWindows.has(origin) && this.syncWindows.size >= MAX_SYNC_RATE_LIMIT_ORIGINS) return false;
		this.syncWindows.set(origin, now);
		return true;
	}
};
//#endregion
//#region src/network/project-crypto.ts
const INVITE_PREFIX = "carbon-project1.";
const MAX_INVITE_LENGTH = 2048;
const MAX_PLAINTEXT_BYTES = 32768;
function roomIdFor(secret) {
	return `project-${createHash("sha256").update(secret).digest("base64url").slice(0, 24)}`;
}
function decodeSecret(invite) {
	const secret = Buffer.from(invite.secret, "base64url");
	if (secret.byteLength !== 32 || roomIdFor(secret) !== invite.roomId) throw new Error("Project-room invite secret is invalid");
	return secret;
}
function epochKey(invite, epoch) {
	if (!Number.isSafeInteger(epoch) || epoch < invite.epoch || epoch > invite.epoch + 1e6) throw new Error("Project-room epoch is invalid");
	return Buffer.from(hkdfSync("sha256", decodeSecret(invite), Buffer.from(invite.roomId), Buffer.from(`dsh-carbon-project:${epoch}`), 32));
}
function aad(roomId, epoch) {
	return Buffer.from(JSON.stringify({
		protocol: "dsh-carbon-project/1",
		roomId,
		epoch
	}));
}
function createProjectInvite(now = Date.now()) {
	const secret = randomBytes(32);
	return {
		version: 1,
		roomId: roomIdFor(secret),
		secret: secret.toString("base64url"),
		epoch: 1,
		issuedAt: now
	};
}
function encodeProjectInvite(invite) {
	decodeSecret(invite);
	return `${INVITE_PREFIX}${Buffer.from(JSON.stringify(invite)).toString("base64url")}`;
}
function decodeProjectInvite(code) {
	const normalized = code.trim();
	if (!normalized.startsWith(INVITE_PREFIX) || normalized.length > MAX_INVITE_LENGTH) throw new Error("Invalid project-room invite");
	let value;
	try {
		value = JSON.parse(Buffer.from(normalized.slice(16), "base64url").toString("utf8"));
	} catch {
		throw new Error("Invalid project-room invite");
	}
	if (typeof value !== "object" || value === null) throw new Error("Invalid project-room invite");
	const invite = value;
	if (invite.version !== 1 || typeof invite.roomId !== "string" || typeof invite.secret !== "string" || !Number.isSafeInteger(invite.epoch) || (invite.epoch ?? 0) < 1 || !Number.isSafeInteger(invite.issuedAt) || (invite.issuedAt ?? 0) < 1) throw new Error("Invalid project-room invite");
	decodeSecret(invite);
	return invite;
}
function encryptProjectPayload(invite, plaintext, epoch = invite.epoch) {
	const bytes = typeof plaintext === "string" ? Buffer.from(plaintext, "utf8") : Buffer.from(plaintext);
	if (bytes.byteLength === 0 || bytes.byteLength > MAX_PLAINTEXT_BYTES) throw new Error("Project-room payload is empty or too large");
	const nonce = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", epochKey(invite, epoch), nonce);
	cipher.setAAD(aad(invite.roomId, epoch));
	const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()]);
	return {
		version: 1,
		roomId: invite.roomId,
		epoch,
		nonce: nonce.toString("base64url"),
		ciphertext: ciphertext.toString("base64url"),
		tag: cipher.getAuthTag().toString("base64url")
	};
}
function decryptProjectPayload(invite, payload) {
	if (payload.version !== 1 || payload.roomId !== invite.roomId) throw new Error("Encrypted payload belongs to another project room");
	const nonce = Buffer.from(payload.nonce, "base64url");
	const tag = Buffer.from(payload.tag, "base64url");
	const ciphertext = Buffer.from(payload.ciphertext, "base64url");
	if (nonce.byteLength !== 12 || tag.byteLength !== 16 || ciphertext.byteLength === 0 || ciphertext.byteLength > 32800) throw new Error("Encrypted project-room payload is malformed");
	try {
		const decipher = createDecipheriv("aes-256-gcm", epochKey(invite, payload.epoch), nonce);
		decipher.setAAD(aad(payload.roomId, payload.epoch));
		decipher.setAuthTag(tag);
		return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	} catch (cause) {
		throw new Error("Encrypted project-room payload failed authentication", { cause });
	}
}
function rotateProjectInvite(previous, now = Date.now()) {
	decodeSecret(previous);
	return {
		...createProjectInvite(now),
		epoch: previous.epoch + 1
	};
}
//#endregion
//#region src/index.ts
const name = "dsh-human-buffer";
const inject = ["credentials"];
function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
function markRemote(service, method) {
	Remote(method)(service[method], {
		kind: "method",
		name: method,
		static: false,
		private: false,
		access: {
			has: (object) => method in object,
			get: (object) => object[method]
		},
		addInitializer: (initializer) => {
			initializer.call(service);
		}
	});
}
var CarbonClubService = class extends TypertRemoteService {
	static inject = ["credentials"];
	node;
	initError;
	ready;
	constructor(ctx) {
		super(ctx, "carbonClub");
		markRemote(this, "status");
		markRemote(this, "createInvite");
		markRemote(this, "connect");
		markRemote(this, "roomSnapshot");
		markRemote(this, "roomDelta");
		markRemote(this, "evidence");
		markRemote(this, "joinHall");
		markRemote(this, "leaveHall");
		markRemote(this, "postRoomMessage");
		this.ready = this.initialize();
		ctx.effect(() => () => this.node?.stop(), "carbon-club: stop libp2p node");
	}
	async status() {
		await this.ready;
		if (this.node === void 0) return {
			phase: "error",
			addresses: [],
			connectedPeers: 0,
			discoveredPeers: 0,
			bootstrapConfigured: 0,
			relayAddresses: 0,
			error: this.initError ?? "Carbon Club node failed to start"
		};
		return this.node.status();
	}
	async createInvite() {
		await this.ready;
		if (this.node === void 0) throw new Error(this.initError ?? "Carbon Club node failed to start");
		return this.node.createInvite();
	}
	async connect(code) {
		await this.ready;
		if (this.node === void 0) throw new Error(this.initError ?? "Carbon Club node failed to start");
		return this.node.connect(code);
	}
	async roomSnapshot() {
		await this.ready;
		if (this.node === void 0) throw new Error(this.initError ?? "Carbon Club node failed to start");
		return this.node.roomSnapshot();
	}
	async roomDelta(cursor) {
		await this.ready;
		if (this.node === void 0) throw new Error(this.initError ?? "Carbon Club node failed to start");
		return this.node.roomDelta(cursor);
	}
	async evidence(eventId) {
		await this.ready;
		if (this.node === void 0) throw new Error(this.initError ?? "Carbon Club node failed to start");
		return this.node.evidence(eventId);
	}
	async joinHall(profile) {
		await this.ready;
		if (this.node === void 0) throw new Error(this.initError ?? "Carbon Club node failed to start");
		return this.node.joinHall(profile);
	}
	async leaveHall() {
		await this.ready;
		if (this.node === void 0) throw new Error(this.initError ?? "Carbon Club node failed to start");
		return this.node.leaveHall();
	}
	async postRoomMessage(input) {
		await this.ready;
		if (this.node === void 0) throw new Error(this.initError ?? "Carbon Club node failed to start");
		return this.node.publishHallMessage(input);
	}
	async initialize() {
		try {
			const node = new CarbonClubNode(await loadOrCreatePrivateKey(this.ctx.credentials), {
				rememberedPeers: await loadRememberedPeers(this.ctx.credentials),
				persistRememberedPeers: (peers) => saveRememberedPeers(this.ctx.credentials, peers),
				bootstrapAddresses: (process.env.DSH_CARBON_CLUB_BOOTSTRAP ?? "").split(",").map((value) => value.trim()).filter((value) => value.length > 0).slice(0, 8)
			});
			this.node = node;
			await node.start();
		} catch (error) {
			this.initError = errorMessage(error);
		}
	}
};
function apply(ctx) {
	new CarbonClubService(ctx);
}
//#endregion
export { CarbonClubNode, CarbonClubService, HALL_SYNC_PROTOCOL, HALL_TOPIC, RoomEventLedger, apply, createProjectInvite, decodeProjectInvite, decryptProjectPayload, encodeProjectInvite, encryptProjectPayload, inject, name, rotateProjectInvite, signPresenceEvent, signRoomEvent, signSyncRequest, verifyRoomEvent };

//# sourceMappingURL=index.js.map