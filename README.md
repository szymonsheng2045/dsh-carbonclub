# Carbon Club

English | [中文](./README.zh.md)

Carbon Club (`dsh-human-buffer`) is a human-to-human waiting room for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It lives beside agent work without entering the agent's prompt, memory, session, or transcript.

> DSH on. Humans nearby. Eight seats talk; everyone else watches and queues.

## Developer preview

`0.5.0-beta.2` targets the current DSH developer preview (`0.1.1-rc.2`). It provides one signed public lobby with a hard cap of 500 active identities and eight speaking seats.

- A responsive, resizable drawer embedded in the DSH Web surface.
- Eight deterministic speaking seats; five-minute cap, idle release, cooldown, slow mode, and anti-monologue rules.
- Durable Ed25519 DSH identity, signed room events, replay protection, and deterministic state derivation.
- LAN discovery, direct invitations, remembered peers, community bootstrap, Circuit Relay v2, AutoNAT, and DCUtR.
- Small GossipSub client meshes and bounded volunteer routers instead of a 500-node full mesh.
- Content-addressed avatars, compact queue previews, local blocking, and signed-evidence export.
- Zero model calls. Club traffic remains outside the AI context boundary.
- Chinese and English UI.

The project, night, compute-tide, and low-age tabs are roadmap previews. The low-age room remains closed pending independent child-safety and legal review.

## Install

Install the prebuilt release archive into a DSH profile (no install-time build permission required):

```sh
curl -LO https://github.com/szymonsheng2045/dsh-carbonclub/releases/download/v0.5.0-beta.2/dsh-human-buffer-0.5.0-beta.2.tgz
dsh plugin --profile carbon-club add ./dsh-human-buffer-0.5.0-beta.2.tgz
dsh --profile carbon-club web
```

For source development:

```sh
git clone https://github.com/szymonsheng2045/dsh-carbonclub.git
cd dsh-carbonclub
pnpm install
pnpm check
dsh plugin --profile carbon-club-dev add .
dsh --profile carbon-club-dev web
```

The repository commits `lib/` so GitHub installs have prebuilt entry points. For a reproducible public-beta install, prefer the release archive or pin a commit.

## Community connectivity

Carbon Club has no mandatory central service. LAN peers discover each other directly; cross-Internet groups point at independently operated bootstrap/relay nodes. The first volunteer Mac relay is available for invitation testing:

```sh
DSH_CARBON_CLUB_BOOTSTRAP='/dns4/relay.laozi.art/tcp/443/wss/p2p/12D3KooWLdvJF8g2gt5j7qhrJHtbharz1Tv8dguzUoTt8Saz8uHU' dsh --profile carbon-club web
```

A relay provides discovery, byte forwarding, and a bounded in-memory cache of already signed events. It holds no account database, moderation authority, or durable history. A 500-person lobby should use at least three independently operated WSS nodes and ramp through 50, 100, 250, and 500-person trials.

The volunteer Mac is a replaceable starter node, not an availability guarantee or the planned three-node public topology. The former A2A hostname remains online only as a temporary rollback alias; new clients should use `relay.laozi.art`, and no new Carbon Club infrastructure may be placed under the A2A domain. See [Infrastructure boundaries](./docs/INFRASTRUCTURE-BOUNDARIES.md), [Community nodes](./docs/COMMUNITY-NODES.md), [Operating a relay](./docs/OPERATING-A-RELAY.md), [Protocol 0.5](./docs/PROTOCOL.md), [500-person capacity budget](./docs/CAPACITY-500.md), and the [public-beta gate](./docs/PUBLIC-BETA-CHECKLIST.md).

## Privacy and security

Public-lobby text is public to mesh participants. Noise protects transport hops; it is not end-to-end secrecy for a public room. Relay operators can observe Peer IDs, network addresses, timing, and traffic volume. The optional last-session note is transmitted only after explicit opt-in.

Report vulnerabilities through [GitHub private vulnerability reporting](https://github.com/szymonsheng2045/dsh-carbonclub/security/advisories/new). Read the [security policy](./SECURITY.md) and [review diagnostics contract](./docs/SECURITY-REVIEW.md) before inviting an untrusted audience.

## Community and support

Use [GitHub Discussions](https://github.com/szymonsheng2045/dsh-carbonclub/discussions) for ideas and operator coordination, and [GitHub Issues](https://github.com/szymonsheng2045/dsh-carbonclub/issues) for reproducible defects. The `dsh-plugin` repository topic makes the bundle discoverable in the DSH ecosystem.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Protocol changes require adversarial tests and a versioned topic bump when wire compatibility changes.

## License

[MIT](./LICENSE)
