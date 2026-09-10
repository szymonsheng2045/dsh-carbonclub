# Operating a community bootstrap/relay

**Candidate boundary:** this working tree is 0.5.1-beta.1, not a production upgrade instruction. Its state-cache topic/sync version differs from 0.5.0. Do not rebuild an existing public relay in place until the coordinated migration is approved; see [candidate notes](./CANDIDATE-0.5.1.zh.md).

The community node is replaceable connectivity infrastructure. It holds no DSH account, moderation authority or durable message database. It provides a stable bootstrap address, participates in the public-lobby GossipSub mesh, offers resource-limited Circuit Relay v2 reservations and keeps a bounded restart-empty cache of verified signed roster/recent-message events for late-node recovery. Every advertised bootstrap must provide all of these functions together: a GossipSub-only router is incompatible because each client also requests a `/p2p-circuit` reservation from every configured bootstrap address.

## Run locally

```sh
CARBON_RELAY_LISTEN=/ip4/0.0.0.0/tcp/9090/ws \
CARBON_RELAY_KEY_FILE=./data/carbon-relay.key \
pnpm relay
```

Keep the key file persistent and mode `0600`; replacing it changes the relay Peer ID and therefore its bootstrap multiaddress.

## Optional review diagnostics

There is no security backdoor. An operator may deliberately enable a read-only diagnostics window for a named reviewer:

```sh
umask 077
openssl rand -hex 32 > ./data/review.token
CARBON_RELAY_REVIEW_PORT=9091 \
CARBON_RELAY_REVIEW_TOKEN_FILE=./data/review.token \
pnpm relay
```

The listener is hard-bound to `127.0.0.1`, is disabled unless both settings are supplied, and accepts only `GET /healthz` plus the authenticated `GET /review/v1/report`. It returns aggregate health, public relay identity, declared limits and negative capability flags. It never returns messages, remote peer addresses or keys, and has no mutation or remote-control method. Do not add this port to a reverse proxy. See [SECURITY-REVIEW.md](./SECURITY-REVIEW.md).

## Verify a deployed relay

Two read-only checkers exist, and **both must run from a full repository checkout** (`pnpm install`, devDependencies included). They import `lib/index.js`, which statically references host-provided `@deepseek-ai/*` packages; a relay runtime directory only carries the relay runtime dependencies, so the scripts exit with an explicit diagnostic there instead of running. Never install extra dependencies into a frozen runtime directory just to run them.

Transport probe — WSS/Noise/Yamux, Circuit Relay v2 reservation, hall protocol version, and the exact Peer ID:

```sh
CARBON_RELAY_PROBE_ADDRESS=/dns4/relay.example/tcp/443/wss/p2p/<PeerID> \
CARBON_RELAY_EXPECTED_PEER_ID=<PeerID> \
node scripts/probe-public-relay.mjs
```

End-to-end acceptance — a real client joins the hall through the relay, publishes a message, and a second late-joining client syncs it back (which proves relay-side retention and the sync path):

```sh
CARBON_RELAY_ACCEPT_ADDRESS=/dns4/relay.example/tcp/443/wss/p2p/<PeerID> \
CARBON_RELAY_EXPECTED_PEER_ID=<PeerID> \
node scripts/p2p-relay-acceptance.mjs
```

Loopback addresses of the form `/ip4/127.0.0.1/tcp/<port>/ws/p2p/<PeerID>` are also accepted. When the operator additionally exports `CARBON_RELAY_REVIEW_TOKEN_FILE` (and `CARBON_RELAY_REVIEW_URL`), the acceptance script confirms each hop against the relay's own review report before proceeding; without it the script falls back to settle waits and at most two spaced publish attempts. Do not shorten those waits: the hall enforces an 8-second slow mode and a two-consecutive-message cap per origin, and a client publish is silently discarded (without error) whenever its GossipSub delivery set is empty — no mesh, fanout or direct peer for the topic — which is most common before the mesh forms, so aggressive retry loops defeat themselves.

If either script fails, re-run it once and correlate failures with the tunnel logs (`~/Library/Logs/dsh-carbon-cloudflared*.log`) before suspecting the relay: a public-ingress flap or tunnel reconnect interrupts the run, while the relay itself keeps serving loopback clients. Only then inspect the relay logs (`~/Library/Logs/dsh-carbon-relay*.log`).

## Container

Copy `deploy/relay.env.example` to `.env`, set a public DNS announcement, and run:

```sh
docker compose -f docker-compose.relay.yml up -d --build
```

Terminate TLS in Caddy or nginx and proxy public WSS traffic to port 9090. A secure DSH page cannot dial plaintext `ws` across the public Internet. Set `CARBON_RELAY_ANNOUNCE` to the externally dialable `/dns4/.../tcp/443/wss` address; the process appends its Peer ID.

## Configure a DSH client

Use a comma-separated list of independently operated addresses:

```sh
DSH_CARBON_CLUB_BOOTSTRAP='/dns4/relay-a.example/tcp/443/wss/p2p/12D3KooW...,/dns4/relay-b.example/tcp/443/wss/p2p/12D3KooW...' dsh web
```

The client preconfigures a relay reservation for each entry, while retaining LAN mDNS and direct invite paths. No default endpoint is hard-coded.

## Resource and privacy policy

- Default maximum reservations: 600 (configurable up to 1000).
- Default maximum process connections: 1200 (configurable up to 2000).
- Reservation lifetime: 1 hour.
- Relayed connection lifetime: 10 minutes.
- Relayed data limit: 16 MiB per connection.
- Lobby GossipSub router mesh: target 256, low 128, high 600.
- Catch-up: at most 1,300 signed events / 8 MiB / requesting Peer ID / minute.
- The relay can observe IP addresses, Peer IDs, timing and byte volume.
- Public-lobby text is visible to its GossipSub process. Project payloads must use application-layer encryption.

For a 500-person lobby, operate at least three independent WSS nodes on separate failure domains. Start with 100 participants per node, observe CPU/RSS/egress, then raise the published cohort limit. Publish software version, capacity, saturation and incident contact. A single volunteer relay is suitable only for testing.

The repository's 500-person fixture is a state/serialization benchmark, not a cloud sizing guarantee. See [CAPACITY-500.md](./CAPACITY-500.md) for the staged soak plan.
