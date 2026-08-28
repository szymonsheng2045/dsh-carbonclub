# Review diagnostics contract

Carbon Club does not contain a hidden security backdoor. Public source and reproducible tests are the primary review surface. Relay operators may additionally enable a narrow diagnostics endpoint for a specifically authorized reviewer.

## Safety boundary

- Disabled by default; both `CARBON_RELAY_REVIEW_PORT` and `CARBON_RELAY_REVIEW_TOKEN_FILE` are required.
- Bound in code to `127.0.0.1`, irrespective of operator environment.
- A token of at least 32 bytes is required for the report.
- `GET /healthz` returns no body. Authenticated `GET /review/v1/report` returns only aggregate counters, declared capacity limits, software version, public relay identity and privacy capability flags.
- It never returns message text, session titles, avatars, IP addresses, remote peer identities, private keys or the review token.
- It implements no command, configuration change, moderation action, filesystem access, code execution or other mutation. Non-GET requests are rejected.

Reviewers should obtain access through a temporary operator-controlled local or SSH session. The review port must not be published through Cloudflare Tunnel, a reverse proxy, router port-forward or container service mapping.

## Reproducible checks

From a release checkout:

```sh
pnpm install --frozen-lockfile
pnpm check
```

`pnpm test:review` separately verifies unauthenticated rejection, token access, loopback binding and rejection of mutation requests. Source review must still cover the cryptography, libp2p configuration, DSH integration, dependency lock and deployment environment; a healthy report is not a security certification.
