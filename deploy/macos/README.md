# macOS relay tunnel

`run-cloudflared.sh` keeps a remotely managed Cloudflare Tunnel connected to a
loopback-only Carbon Club relay. It deliberately keeps the tunnel credential
outside the repository and passes it through `--token-file`, so it does not
appear in the process list.

Security requirements:

- Store the tunnel token in a dedicated file with mode `0600`.
- Route only the relay listener (for example `http://127.0.0.1:9090`).
- Never publish the review endpoint or the relay private key.
- Use a separate Cloudflare Tunnel and token for each project.
- Keep the origin listener on loopback when Cloudflare Tunnel is the only
  intended ingress.

The launcher requires `CARBON_TUNNEL_TOKEN_FILE` and
`CARBON_TUNNEL_LOG_FILE`. `CARBON_TUNNEL_METRICS_ADDRESS` defaults to
`127.0.0.1:20242`. On hosts affected by a mihomo TUN handshake issue, the
launcher briefly disables TUN while Cloudflare edge connections recover, then
restores it immediately.

The two example LaunchAgent files document the complete service boundary.
Replace the `__...__` placeholders, install the launcher outside macOS-protected
Documents/Desktop folders, and keep the installed plist, token, key and logs
private to the service user. A remotely managed tunnel should contain exactly
one published application route to the loopback relay. Do not route the review
port.
