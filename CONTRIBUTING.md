# Contributing

Use Node 22.19+ and pnpm 11. Run `pnpm install`, then `pnpm check` before proposing a change.

Protocol changes must update `docs/PROTOCOL.md`, add adversarial tests, and bump the versioned GossipSub topic when wire compatibility changes. Never route club messages into a DSH session, model request, memory, transcript, analytics payload, or third-party moderation API.

Security-sensitive changes should include malformed input, replay, stale-clock, resource-limit and multi-node tests. Keep relay nodes replaceable and free of accounts, history and moderation authority.
