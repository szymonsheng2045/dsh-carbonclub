# Security Policy

## Supported versions

Only the latest `0.5.x` beta is supported. It targets a 500-person public lobby, but it is not an audited anonymity or child-safety system.

## Reporting

Do not publish exploitable vulnerabilities, private keys, room invitations, IP addresses, session titles, or complete signed-message sets in public Issues. Submit a minimal reproduction through [GitHub private vulnerability reporting](https://github.com/szymonsheng2045/dsh-carbonclub/security/advisories/new) or email **szymonsheng2045@gmail.com**; the maintainer aims to acknowledge receipt within seven days. Do not deploy this beta directly to an untrusted open audience before the independent security review and staged cross-network testing complete.

## Security boundaries

- The DSH credential store holds Ed25519 private keys; never copy them into Issues.
- Public-lobby text is public to mesh participants; Noise encrypts transport hops only and does not provide end-to-end secrecy for a public GossipSub topic.
- Project-room encryption primitives exist for integration tests only; the project-room UI is not open yet.
- Bootstrap/relay nodes can observe Peer IDs, addresses, timing, and byte volume, and keep only a bounded in-memory cache of signed active rosters and recent messages — no account database or permanent history.
- Public Circuit Relay v2 is open to pseudonymous peers, but relayed circuits terminate only at peers with a valid, live reservation on that relay; it is not a proxy to arbitrary IPs. Reservations, circuit lifetime, circuit traffic, STOP streams, and history-sync throughput all have hard ceilings to constrain abuse.
- Local blocking changes local display only; it is not a network-wide ban.
- Steward checkpoints detect and bound state divergence among honest nodes; they are not Byzantine majority consensus.
- A signature proves control of a pseudonymous key, not eligibility for admission. Non-join events require a retained join basis; replay watermarks and ingress identity windows have hard limits.

## Privacy design and legal compliance

This software is designed around the following principles to align with major cybersecurity and data-protection regimes:

- **No account system**: identity is a locally generated Ed25519 pseudonymous keypair. The software does not collect real names, phone numbers, email addresses, or identity documents.
- **Minimal data retention**: community relays keep only a bounded in-memory cache of signed active rosters and recent messages (cleared on process restart). No permanent message history, user profiles, or behavioral logs are built.
- **User data stays local**: chat history lives on the user's own device, managed and deleted by the user; the software offers no cloud sync or remote backup.
- **Transport encryption**: inter-node traffic is encrypted with Noise. Public-lobby content is visible to all participants of that room and is not end-to-end confidential; users must not post private information in the public lobby.
- **Children's protection**: this software is not directed at children under 13; the low-age room stays closed until an independent child-safety and legal review completes.
- **Content responsibility**: users are responsible for what they publish and must not post content prohibited by local law. For operations and abuse reports, contact szymonsheng2045@gmail.com.

Referenced frameworks include China's Cybersecurity Law, Data Security Law and Personal Information Protection Law; the U.S. Children's Online Privacy Protection Act (COPPA) and state privacy laws; Malaysia's Personal Data Protection Act 2010 (PDPA); and Thailand's Personal Data Protection Act B.E. 2562 (PDPA). This project is decentralized open-source software, not a centrally operated network service: no central server collects or processes personal data in bulk. The statements above describe product design facts and do not constitute legal advice. Users remain responsible for compliance obligations in their own jurisdictions.
