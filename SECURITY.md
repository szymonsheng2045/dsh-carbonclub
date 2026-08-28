# Security policy

## Supported release

Only the newest `0.5.x` beta is supported. It targets a 500-participant public lobby, but is not an audited anonymity or child-safety system.

## Reporting

Do not publish an exploitable report, private key, room invitation, IP address, session title, or signed message corpus in a public issue. Send a minimal reproduction through [GitHub private vulnerability reporting](https://github.com/szymonsheng2045/dsh-carbonclub/security/advisories/new). You should receive an acknowledgement within seven days. Do not deploy this beta to an untrusted open audience before an independent security review and staged multi-network trial.

## Security boundary

- The DSH credential store holds the Ed25519 private identity. Never copy its value into an issue.
- Public-lobby text is public to mesh participants. Noise encrypts transport hops; it is not end-to-end secrecy for the public GossipSub topic.
- Project-room crypto primitives are available for integration testing, but the project-room UI is not enabled yet.
- A bootstrap/relay sees Peer IDs, addresses, timing and byte counts. It keeps only a bounded in-memory cache of signed active-roster/recent-message events so late peers can recover; it has no account database or durable room history.
- Local blocking only changes the local display. It is not a network-wide ban.
- Steward checkpoints detect and bound honest-state divergence; they are not Byzantine quorum consensus.
- A signature proves control of a pseudonymous key, not admission. Non-join events are accepted only for an identity with a retained join basis; replay high-water marks and ingress identity windows are hard-bounded against key-rotation memory exhaustion.
