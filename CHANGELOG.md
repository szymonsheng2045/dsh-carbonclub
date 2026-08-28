# Changelog

## 0.5.0-beta.1

- Updated the DSH development surface and isolated runtime to `0.1.1-rc.2`.
- Raised the deterministic lobby capacity to 500 participants while retaining eight speaking seats.
- Protected each active member's signed join basis and latest heartbeat from rolling-log eviction.
- Replaced public-topic history rebroadcast with a bounded 8 MiB direct sync stream carrying at most 1,300 verified events.
- Added bounded 24-entry browser queue previews, exact queue count/local position, profile filtering and delta merging.
- Reduced normalized avatar wire size to roughly 9 KiB and added a worst-case 500-avatar capacity budget.
- Bounded discovery dialing and client connection counts; tuned volunteer GossipSub routers and relay reservations for a 500-person lobby.
- Added memory-only verified event caching to volunteer routers so late nodes can recover without a durable application server.
- Added a framed Yamux sync handshake and raised the bounded read buffer from libp2p's 4 MiB default to the 8 MiB protocol ceiling.
- Added 500-person state-engine/load gates, strict relay-only late-node restoration and two-router live failure-continuity coverage.
- Added relay health telemetry, hardened Compose limits and an example Caddy WSS reverse-proxy configuration.
- Moved per-origin throttling behind room signature verification, added an authenticated-publisher prefilter, and hardened relay JSON ingestion against malformed public messages.
- Rejected room events without an admitted join basis, bounded inactive replay high-water marks and ingress-window identities, and added a key-rotation memory-DoS regression.
- Made Relay sync reject oversized request streams while bytes arrive instead of after the remote peer closes.
- Bounded client and Relay sync-rate identity tables with expiry.

## 0.4.0-beta.1

- First invitation-scale public community beta of the live signed lobby.
- Added 16-bit join admission work, join freshness and signed steward checkpoints.
- Added content-addressed 32 KiB avatars, profile/message deduplication and cursor-based browser deltas.
- Added per-origin ingress and history-sync limits, local blocking and signed evidence export.
- Added signed expiring direct/relay invitations.
- Added configurable bootstrap, Circuit Relay v2, AutoNAT, DCUtR, a stateless community relay and container recipe.
- Added tested AES-256-GCM/HKDF project-room invitation and rotation primitives; project room remains disabled.
- Added bilingual public-beta boundaries, security/conduct/contribution policies and CI.
