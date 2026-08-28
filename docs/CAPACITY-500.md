# 500-person lobby capacity budget

This document defines what “500 people” means for protocol `0.5`. It is a deterministic room-state and community-router target, not a claim that one laptop can maintain 499 direct connections or that every firewall can be crossed.

## Topology

- Every DSH client keeps a small GossipSub mesh (`D=6`, `Dlo=4`, `Dhi=12`) and no more than 64 total libp2p connections.
- Discovery auto-dialing stops at 12 peers and permits at most four simultaneous discovery dials.
- A public cohort should configure three or more independently operated WSS community routers.
- Each router may keep up to 600 lobby peers in its GossipSub mesh and 600 Circuit Relay reservations, with a default 1,200-connection process ceiling.
- Routers are replaceable. They have no DSH account, admission authority, durable database or signing authority over user events.

This avoids an O(N²) full mesh. Normal room traffic is O(N) fan-out at each volunteer router and a small fixed mesh at each client.

## State bounds

- Hard active-room capacity: 500 identities.
- Speaking seats: 8; maximum queue: 492.
- Candidate identities retained during admission churn: 750.
- Per-origin replay high-water marks: at most 1,500; active identities cannot be evicted.
- Each active identity protects one signed join basis and its latest signed heartbeat from log eviction.
- Retained derived chat window: 200 messages.
- Retained signed-event ceiling: 2,200.
- Direct catch-up response: at most 1,300 signed events and 8 MiB, once per requesting Peer ID per minute.
- Browser view: 8 seats, exact queue count, exact local queue position, at most 24 queue-preview records and 50 messages.

## Avatar budget

The browser normalizes an avatar to 96×96 WebP. The signed data URL is capped at 12,288 characters, roughly 9 KiB of binary content. Profiles and chat messages carry a content ID rather than repeating bytes. The worst-case capacity fixture uses an 8 KiB unique avatar for every simulated participant.

The current design still includes avatar bytes in the protected signed join basis. This deliberately favors a simple verifiable beta over a separate block-exchange protocol. A future protocol can fetch `sha256:` avatar blocks on demand without changing profile identifiers.

## Reproducible local gate

`node scripts/capacity-500.mjs` loads 501 candidates, admits exactly 500, runs four full heartbeat rounds and serializes both the compact browser view and direct sync state. The gate requires:

- exactly 500 active participants, 8 seats and 492 queued;
- a 24-record queue preview and exact local position 492;
- browser snapshot below 128 KiB in the worst-case avatar fixture;
- full signed-state sync below 8 MiB and no more than 1,201 active-basis/heartbeat/message/checkpoint events;
- event ingestion below 5 seconds and snapshot derivation below 500 ms on the development machine.

The benchmark is synthetic and deterministic. It tests state, memory and serialization bounds; it does not replace a real 500-device Internet soak. The unit suite additionally submits 5,000 valid-shaped messages from unadmitted rotating identities and churns 1,800 admitted identities to prove replay tracking remains bounded. `node scripts/p2p-router-failover.mjs` separately attaches two mDNS-disabled clients to two bootstrap/router nodes, removes one router and requires a signed hall message to arrive through the survivor.

## Expected steady-state traffic

With a 45-second heartbeat, 500 active identities emit about 11.1 presence events per second across the room. A client verifies one logical copy of each accepted event; GossipSub duplicates are rejected by message ID and room event ID. Chat traffic is additionally limited by eight seats, eight-second slow mode and two consecutive messages per speaker.

Actual relay egress depends on libp2p framing, duplicate paths, reconnects and avatars. Operators must measure their own node and publish CPU, memory, bandwidth and reservation saturation before joining the production bootstrap list.

## What remains a real-world gate

- A 50 → 100 → 250 → 500 staged soak with actual DSH instances across at least two networks.
- Loss/reconnect tests with one of three routers removed at each stage.
- WSS reverse-proxy, NAT and mobile-network trials.
- At least 24 hours of heartbeat churn without roster drift or event-loop starvation.
- Independent security review and a staffed abuse-report path.

Those gates require other machines or humans. The repository automates everything that can be meaningfully reproduced on one development host.
