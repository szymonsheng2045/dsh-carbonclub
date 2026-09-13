# Carbon Club

English | [中文](./README.zh.md)

Carbon Club (`dsh-human-buffer`) is a human-to-human waiting room for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It lives beside agent work without entering the agent's prompt, memory, session, or transcript.

> DSH on. Humans nearby. Eight seats talk; everyone else watches and queues.

## Current release

**v0.6.8** is published. Versus 0.5.1-beta.1 it targets the current DSH developer preview and fixes an independently reviewed set of defects: presence that could not heal after a one-way partition, a start/stop race that leaked the checkpoint timer, two missing remote-contract methods, unvalidated relay ceilings, a remembered-peer cap mismatch, an entry point that did not exist on the new-session screen, an IME Escape that closed the drawer, untranslated host errors, and a session-list flash. The hall protocol stays 0.5.1, so 0.6.8 and 0.5.1-beta.1 clients share one lobby; the 0.5.0 coexistence and rollback path is unchanged in the [upgrade and rollback guide](./docs/UPGRADING-0.5.1.zh.md).

`0.6.8` targets the current DSH developer preview (`0.1.5-rc.1`). It provides one signed public lobby with a hard cap of 500 active identities and eight speaking seats.

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
curl -LO https://github.com/szymonsheng2045/dsh-carbonclub/releases/download/v0.6.8/dsh-human-buffer-0.6.8.tgz
dsh plugin --profile carbon-club add ./dsh-human-buffer-0.6.8.tgz
# A custom profile created by `dsh plugin` ships only @deepseek-ai/dsh-base — with no
# application layer the boot idles silently. Add the web app bundle once (idempotent):
node -e "const fs=require('fs'),os=require('os'),p=(process.env.DSH_HOME??os.homedir()+'/.dsh')+'/profiles/carbon-club/package.json',m=JSON.parse(fs.readFileSync(p,'utf8')),b=m.dsh.profile.bundles;if(!b.includes('@deepseek-ai/dsh-web-app'))b.splice(1,0,'@deepseek-ai/dsh-web-app');fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n')"
dsh --profile carbon-club
```

Note: `dsh --profile carbon-club web` is rejected by the launcher (`web` is an alias for the built-in web profile); app flags such as `--host`, `--port` and `--no-open` follow the profile name directly.

For source development:

```sh
git clone https://github.com/szymonsheng2045/dsh-carbonclub.git
cd dsh-carbonclub
pnpm install
pnpm check
dsh plugin --profile carbon-club-dev add .
node -e "const fs=require('fs'),os=require('os'),p=(process.env.DSH_HOME??os.homedir()+'/.dsh')+'/profiles/carbon-club-dev/package.json',m=JSON.parse(fs.readFileSync(p,'utf8')),b=m.dsh.profile.bundles;if(!b.includes('@deepseek-ai/dsh-web-app'))b.splice(1,0,'@deepseek-ai/dsh-web-app');fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n')"
dsh --profile carbon-club-dev
```

The repository commits `lib/` so GitHub installs have prebuilt entry points. For a reproducible public-beta install, prefer the release archive or pin a commit.

## Community connectivity

Carbon Club has no mandatory central service. LAN peers discover each other directly; cross-Internet groups point at independently operated bootstrap/relay nodes. The first volunteer Mac relay (0.5.1) is available for public testing:

```sh
DSH_CARBON_CLUB_BOOTSTRAP='/dns4/relay-051.laozi.art/tcp/443/wss/p2p/12D3KooWABxQrMHAVgbeqiVctkAPBFPSPSqCJi1SC4YRZh1hsMrh' dsh --profile carbon-club
```

> This variable must come from the launching environment. `dsh` classifies it as
> bootstrap-only and **refuses to boot at all** if any `.env` layer sets it — including
> `$DSH_HOME/.env`. Export it in your shell instead (`~/.zshrc` works), which is also how
> the club keeps reaching the public lobby without a wrapper script.

```sh
```

The legacy 0.5.0 entry `relay.laozi.art` keeps serving older clients through the transition window (at least two weeks); the 0.5.0 rollback path is documented in the [upgrade and rollback guide](./docs/UPGRADING-0.5.1.zh.md).

A relay provides discovery, byte forwarding, and a bounded in-memory cache of already signed events. It holds no account database, moderation authority, or durable history. A 500-person lobby should use at least three independently operated WSS nodes and ramp through 50, 100, 250, and 500-person trials.

The volunteer Mac is a replaceable starter node, not an availability guarantee or the planned three-node public topology. The former A2A hostname remains online only as a temporary rollback alias; new clients should use `relay.laozi.art`, and no new Carbon Club infrastructure may be placed under the A2A domain. See [Infrastructure boundaries](./docs/INFRASTRUCTURE-BOUNDARIES.md), [Community nodes](./docs/COMMUNITY-NODES.md), [Operating a relay](./docs/OPERATING-A-RELAY.md), [Protocol 0.5](./docs/PROTOCOL.md), [500-person capacity budget](./docs/CAPACITY-500.md), and the [public-beta gate](./docs/PUBLIC-BETA-CHECKLIST.md).

## Privacy and security

Public-lobby text is public to mesh participants. Noise protects transport hops; it is not end-to-end secrecy for a public room. Relay operators can observe Peer IDs, network addresses, timing, and traffic volume. The optional last-session note is transmitted only after explicit opt-in.

Report vulnerabilities through [GitHub private vulnerability reporting](https://github.com/szymonsheng2045/dsh-carbonclub/security/advisories/new) or by email to szymonsheng2045@gmail.com. Read the [security policy](./SECURITY.md) and [review diagnostics contract](./docs/SECURITY-REVIEW.md) before inviting an untrusted audience.

## Community and support

Use [GitHub Discussions](https://github.com/szymonsheng2045/dsh-carbonclub/discussions) for ideas and operator coordination, [GitHub Issues](https://github.com/szymonsheng2045/dsh-carbonclub/issues) for reproducible defects, and szymonsheng2045@gmail.com for operations and abuse reports. The `dsh-plugin` repository topic makes the bundle discoverable in the DSH ecosystem.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Protocol changes require adversarial tests and a versioned topic bump when wire compatibility changes.

## License

[MIT](./LICENSE)
