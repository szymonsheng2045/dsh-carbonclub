# Public community beta gate

Target: one public-lobby protocol with a hard capacity of 500 identities and eight speaking seats. Distribution should still ramp through 50, 100, 250 and 500-person cohorts.

## Implemented and tested

- Durable local Ed25519 identity; signed events bind public key to Peer ID.
- Eight deterministic seats, queue, five-minute lease, idle expiry, cooldown, slow mode and anti-monologue rule.
- Fresh joins require a 16-bit Hashcash-style admission proof; joins older than 30 seconds and backdated join times are rejected.
- Signed steward checkpoints bind each minute's seat/queue/recent-message state hash; the lowest current participant is the replaceable steward.
- Authenticated-publisher pre-verification and verified-origin post-verification ingress windows with hard identity ceilings, 64-connection client cap, bounded discovery dialing and once-per-minute direct state response.
- Content-addressed avatars, strict JPEG/PNG/WebP data URL shape, 12 KiB data-URL cap and no avatar repetition in heartbeat or message records.
- Protected active join/heartbeat bases, bounded 2,200-event ledger, 1,500-origin replay ceiling and 1,300-event/8 MiB direct catch-up stream.
- Cursor-based Host/browser deltas; exact queue count/local position, 24-record queue preview and filtered profile/avatar maps.
- Local block controls and exportable original signed evidence.
- LAN discovery, signed direct invitation, remembered peers, configurable bootstrap, Circuit Relay v2 reservation, AutoNAT and DCUtR services.
- A restart-empty community router/relay, hardened container recipe, malformed-message survival + late-node recovery smoke test, forged-origin and rotating-key memory-DoS regressions, and two-router live failover test.
- A worst-case 501-candidate/500-admitted capacity fixture with unique 8 KiB avatars and four complete heartbeat rounds.
- AES-256-GCM/HKDF project-room invitation and epoch primitives with tamper and rotation tests; project-room UI remains disabled.
- Bilingual UI, privacy opt-in for the last completed session name, package export verification and CI.

## External go-live work

- Before every public build, run `pnpm probe:relay` with
  `CARBON_RELAY_PROBE_ADDRESS` set to the published WSS multiaddress and
  `CARBON_RELAY_EXPECTED_PEER_ID` set to the documented relay identity; require
  a successful Noise/Yamux connection and Circuit Relay v2 reservation.
- Recruit at least three independent bootstrap/router operators, put WSS/TLS in front of them, publish incident contacts, and run staged 50 → 100 → 250 → 500 multi-network trials.
- Arrange independent security review of cryptography, libp2p configuration and invite dialing.
- Establish a human abuse-report response process before distributing invitations beyond a trusted cohort.
- Monitor the final source repository's private vulnerability-reporting channel and publish response expectations.
- Keep the `dsh-plugin` repository topic and install metadata current; obtain any future first-party marketplace approval if DeepSeek introduces one.
- Run an external 24-hour 500-instance soak with router-loss and reconnect injection; one development laptop cannot honestly substitute for this gate.

## Explicitly out of scope for this beta

- Byzantine quorum consensus or Sybil-proof anonymous admission. The proof raises attack cost; it does not establish one-person-one-identity.
- Guaranteed reachability across every NAT/firewall.
- Durable server-side history or cross-device message backup.
- Enabled project, night, price-tide or low-age rooms.
- Child-directed service. The low-age concept stays closed pending independent legal and safety review.
