# Operating a community bootstrap/relay

The community node is replaceable connectivity infrastructure. It holds no DSH account, moderation authority or durable message database. It provides a stable bootstrap address, participates in the public-lobby GossipSub mesh, offers resource-limited Circuit Relay v2 reservations and keeps a bounded restart-empty cache of verified signed roster/recent-message events for late-node recovery. Every advertised bootstrap must provide all of these functions together: a GossipSub-only router is incompatible because each client also requests a `/p2p-circuit` reservation from every configured bootstrap address.

## Run locally

```sh
CARBON_RELAY_LISTEN=/ip4/0.0.0.0/tcp/9090/ws \
CARBON_RELAY_KEY_FILE=./data/carbon-relay.key \
pnpm relay
```

Keep the key file persistent and mode `0600`; replacing it changes the relay Peer ID and therefore its bootstrap multiaddress.

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
