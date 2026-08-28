# Carbon Club protocol 0.5

## Product boundary

Carbon Club is a human-to-human side channel. Room traffic must never be appended to a DSH session, prompt, tool result, memory, transcript or model request. Agent state is read-only presentation input, so normal room use costs zero model tokens. Network and optional relay bandwidth still have a real cost.

The public beta enables only `roomId = hall` on topic:

```text
/dsh-human-buffer/room/hall/0.5.0
```

Other visible room types are roadmap previews and do not subscribe or publish.

## Identity and event envelope

Each DSH installation creates one Ed25519 private key in `ctx.credentials`. The derived libp2p Peer ID is the durable decentralized identity. Display name, avatar and optional session note remain self-reported.

Every event contains fixed-order signed fields:

```text
version, roomId, eventId, origin, sequence, issuedAt, kind, payload, publicKey
```

The receiver decodes the public key, derives its Peer ID, requires it to equal `origin`, verifies the Ed25519 signature, rejects duplicate event IDs and rejects a sequence not above that origin's retained high-water mark. Live-topic events older than 24 hours or more than five minutes in the future are rejected. A direct catch-up stream may carry an older signed join basis; it cannot make a departed member active without that member's fresh signed heartbeat.

Wire events are capped at 48 KiB. Before room verification, an authenticated GossipSub publisher may submit at most 120 candidate events per minute; this key comes from the transport signature and cannot be spoofed in the JSON body. After Ed25519 room verification, the signed room origin may contribute at most 20 accepted events per minute. Both identity-window maps have hard cardinality ceilings, so rotating valid keys cannot grow them without bound. Invalid messages therefore cannot consume another identity's room-event allowance. The libp2p connection manager caps total and pending inbound connections.

## Seats, queue and admission

Every honest Host replays the same ordered signed event set. It admits at most 500 active identities, fills eight speaking seats and places at most 492 in the queue. The 501st ordered join remains outside the active roster. A Host may track at most 750 admission candidates during churn. Except for a proof-of-work join, an event is rejected unless the signer already has a retained join basis; this prevents freshly generated keys from filling replay state with otherwise valid chat signatures. A local Host refuses to publish a chat event unless its current derived state holds a seat; receiving Hosts independently enforce the same rule.

The state machine applies:

- maximum seat lease: 5 minutes;
- idle release: 2 minutes;
- presence heartbeats and expiry;
- post-release cooldown: 10 minutes;
- slow mode: 8 seconds;
- maximum consecutive messages from one identity: 2.

A new join must be no more than 30 seconds old, its `joinedAt` may trail `issuedAt` by at most 10 seconds, and it carries a Hashcash-style SHA-256 proof with 16 leading zero bits over the origin, five-minute admission epoch and nonce. This raises bulk-Sybil cost and blocks arbitrary backdating; it does not establish one-person-one-identity.

## Steward checkpoint v1

For each minute, the lexicographically lowest current participant Peer ID is the replaceable steward. Every 30 seconds that Host may sign a `hall.checkpoint` containing:

- minute epoch;
- steward Peer ID;
- SHA-256 of ordered seat Peer IDs, queue Peer IDs and the latest 32 accepted message IDs;
- up to eight currently connected witness Peer IDs.

Receivers independently derive the state at the checkpoint time and accept it only if the signer is their expected steward and the hash matches. The last accepted checkpoint is exposed in the bounded snapshot. This detects event-set drift and provides a failover anchor; the witness list is observational in v1, not a quorum signature. Byzantine consensus and anonymous Sybil resistance remain out of scope for the invitation beta.

## Profiles and avatars

Avatar input is locally normalized to 96×96 WebP. The network accepts only JPEG, PNG or WebP base64 data URLs, capped at 12,288 characters (roughly 9 KiB binary). The Host hashes decoded bytes with SHA-256 and signs the resulting `sha256:<hex>` content ID alongside the initial profile.

Heartbeats omit unchanged profiles. Message records reference only the author Peer ID. Compact browser snapshots expose profile/avatar data only for visible speakers, recent authors and the local identity, so 500 queued avatars are not sent every three seconds. A later protocol may replace inline first-announcement bytes with on-demand block exchange without changing the content ID.

## Snapshot and direct state recovery

The Host retains at most 200 derived messages and 2,200 signed state events. Each active identity's join basis and latest heartbeat are protected from rolling-log eviction. Per-origin sequence high-water marks use a 1,500-entry ceiling: active identities are protected and the oldest inactive marks are evicted. Live replay of an evicted join remains blocked by the 30-second join freshness rule, while a historical catch-up join without a fresh heartbeat cannot become active. Each accepted state event advances a local cursor. Browser RPC begins with a reset snapshot and then receives new messages, eight seats, exact queue count/local position, at most 24 queue-preview records and filtered profile/avatar maps. A cursor older than retained history forces a bounded reset.

Late-node catch-up uses `/dsh-human-buffer/sync/hall/0.5.0`, a negotiated libp2p stream over an already authenticated connection. The requester sends a bounded JSON request frame (`version: 1`, the hall topic; at most 1 KiB) and half-closes its write side. The responder aborts as soon as the request crosses 1 KiB, rather than continuing to consume an oversized stream; after a valid FIN it sends one response and half-closes. This explicit handshake avoids a Yamux open/close race. A Host responds only once per minute per connected Peer ID. One response contains at most 1,300 individually signed events and 8 MiB: active join bases, latest heartbeats, recent messages and the latest checkpoint. Receivers raise the stream read buffer to the same 8 MiB hard limit because libp2p's 4 MiB default is too small for the 500-person worst case. The response is not republished to the public GossipSub topic, eliminating room-wide sync amplification. Receivers verify every event independently; the responding peer or router cannot forge a roster.

## Connectivity

Each Host uses Noise, Yamux, WebSockets, GossipSub and mDNS. A client keeps a small topic mesh (`D=6`, `Dlo=4`, `Dhi=12`), stops discovery auto-dialing at 12 peers, permits at most four parallel discovery dials and caps total connections at 64. Direct invites bind every advertised direct or `/p2p-circuit` address to the expected Peer ID, carry the creator's Ed25519 public key and signature, expire after 30 minutes, allow at most four addresses and reject malformed, privileged-port, wildcard, multicast and link-local targets.

`DSH_CARBON_CLUB_BOOTSTRAP` accepts up to eight comma-separated community multiaddresses. For each configured relay, the Host:

1. bootstraps and tags the peer for reconnection;
2. preconfigures a Circuit Relay v2 reservation;
3. runs AutoNAT reachability checks;
4. exposes DCUtR for direct-connection upgrades;
5. advertises relayed addresses before direct local addresses in invitations.

No default endpoint is mandatory. LAN discovery and direct invitations continue to work without community infrastructure.

The included community node has a persistent Peer ID but no user accounts, durable room database or moderation authority. It may retain up to the same bounded signed active-roster/recent-message set in memory and answer direct catch-up streams. Its high-fanout GossipSub mesh and Circuit Relay reservations are bounded and restart-empty. A relay observes network metadata and, because it joins the public GossipSub mesh, public-lobby payloads. Project payloads must be encrypted before publication.

## Project-room cryptographic foundation

The disabled project-room UI already has tested cryptographic primitives:

- a 256-bit random invitation secret;
- room ID derived from SHA-256 of that secret;
- an epoch key derived with HKDF-SHA-256;
- AES-256-GCM with a 96-bit random nonce;
- authenticated additional data binding protocol, room ID and epoch;
- root-secret rotation that produces a new room identity for remaining members.

This is not MLS and does not claim post-compromise security. The UI stays disabled until encrypted networking, membership changes and rekey distribution are integrated and independently reviewed.

## Moderation and evidence

The browser can hide a Peer ID locally and persists at most 256 local entries. It can also request the original signed event from the Host and copy a bounded evidence object containing the event, signature, public key and export time. Evidence is not uploaded automatically.

There is no central ban list or report server. Broad public operation requires a separate human response process. The low-age room remains disabled; UI link filtering is not a substitute for child-safety compliance and moderation.

## Honest limits

- Join work increases Sybil cost but does not prove unique humans.
- Checkpoint v1 is not Byzantine quorum consensus.
- Clock skew and temporarily different event subsets can still cause short-lived local/remote seat disagreement.
- Recent history and volunteer-router state are ephemeral and bounded by online peers.
- The 500-person claim is a state/serialization/router design target with a reproducible local fixture; it still requires a staged multi-device Internet soak before public launch.
- Arbitrary NAT reachability depends on several healthy community relays and local firewall policy.
- Public-lobby content is not end-to-end secret.
