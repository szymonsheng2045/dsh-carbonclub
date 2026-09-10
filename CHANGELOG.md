# Changelog

## 0.5.1-beta.1 — 2026-09-10

- Bound pending client verification to 64 tasks and actively expire silent client/router sync streams after 10 seconds. Added burst, deadline, and real-relay regressions following a DeepSeek model review (not an independent security audit).
- Introduced signed carbon2 invitations bound to the hall protocol, with bilingual mismatch errors. Registered Identify listeners before bootstrap startup and avoided duplicate Identify streams; optional relay reservation failures now preserve local connectivity.
- Added archived 0.5.0/current 0.5.1 coexistence tests, public-document link checks, rebuild-before-pack, and a separate release-documentation version gate following Kimi review.
- Applied the same-IP churn mitigation to the shipped community relay; added a 16-cycle relay-only delivery regression and strengthened client churn assertions to verify each new guest's exact message. Disabling P6 removes a concentration penalty and still needs independent security review; PoW does not eliminate Sybil or eclipse attacks.
- Restricted packaged documentation to an explicit public allowlist; excluded internal handoff and QA records and added packaging guards.
- Fixed silent message loss under connection churn: gossipsub retains a disconnected peer's IP for up to one hour when its score is non-positive, so stale entries accumulated until every honest peer sharing one NAT/LAN/loopback address crossed the graylist threshold and all of its RPCs were dropped. IP-colocation scoring is now disabled; bulk-Sybil cost remains with the admission proof of work and inbound rate limits. Covered by the new `test:churn` loopback regression.
- Corrected simultaneous expiry: offline queued identities cannot be promoted into an already-expired seat and receive an undeserved cooldown. Topic and sync channel now use 0.5.1; coordinated migration is required.
- Added explicit capacity/cooldown admission failures, bounded browser Host requests, unknown-result timeout guidance, and protocol compatibility hints.
- Allowed standard WSS port 443 in signed invitations while retaining restrictions on other privileged ports and insecure WS 443.
- Added loopback-only DSH test configuration, a real UI peer fixture, controlled process-suspension soak and delayed-link/disconnect regression.
- Prepared human-owned community operations, independent-review handoff and staged theme-room plans. No new room is enabled, and no production node was changed.

- Fixed local queue presence beyond the 24-person browser preview, including heartbeat and leave behavior.
- Serialized profile, message and leave mutations; rejected stale Host/poll responses and duplicate sends.
- Bounded incremental browser profile/avatar caches and retained drafts typed while a message is sending.
- Added persistent chat nicknames with language-independent defaults, IME-safe Enter handling and multiline rendering.
- Fixed collapsed mobile overlays intercepting the workspace, unread-message scrolling, resize listener cleanup and clipboard error feedback.
- Aligned idle warnings with the protocol: warning at 90 seconds, release at 120 seconds; clarified capacity and queue labels.
- Added browser regression fixtures and a dated QA record. These changes have not been released or deployed.

- Documented strict Carbon Club/A2A domain, tunnel and credential ownership boundaries.
- Added a release check that rejects A2A domain dependencies from Carbon Club runtime and deployment files.
- Cut the official community bootstrap over to `relay.laozi.art` while retaining the former A2A hostname only as a temporary rollback alias.
- Isolated the Carbon Club cloudflared process from the user's default A2A configuration and pinned its origin to `127.0.0.1:9090`.
- Added an operator probe that verifies public WSS, Noise, Yamux, the expected Peer ID and Circuit Relay v2 reservation.

## 0.5.0-beta.2

- Added an opt-in, token-protected review endpoint bound exclusively to the relay operator's loopback interface.
- Exposed only aggregate health, declared limits, public relay identity and explicit privacy capability flags; the endpoint has no message, key or remote-control surface.
- Added an automated safety-contract smoke test covering loopback health, authentication and mutation rejection.

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
