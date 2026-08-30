#!/bin/bash

# Run the Carbon Club Cloudflare Tunnel without putting its token on the
# process command line. The optional TUN workaround is only used on hosts
# where a local mihomo-compatible control socket is present.
set -eu
umask 077

CLOUDFLARED_BIN="${CLOUDFLARED_BIN:-/opt/homebrew/bin/cloudflared}"
TOKEN_FILE="${CARBON_TUNNEL_TOKEN_FILE:?CARBON_TUNNEL_TOKEN_FILE is required}"
LOG_FILE="${CARBON_TUNNEL_LOG_FILE:?CARBON_TUNNEL_LOG_FILE is required}"
METRICS_ADDRESS="${CARBON_TUNNEL_METRICS_ADDRESS:-127.0.0.1:20242}"
METRICS_URL="http://${METRICS_ADDRESS}/metrics"
TUN_SOCKET="${CARBON_TUN_SOCKET:-/tmp/tyty.sock}"
TUN_API="${CARBON_TUN_API:-http://localhost/configs}"

if [ ! -x "$CLOUDFLARED_BIN" ]; then
  echo "cloudflared is not executable: $CLOUDFLARED_BIN" >&2
  exit 1
fi
if [ ! -f "$TOKEN_FILE" ] || [ -L "$TOKEN_FILE" ] || [ ! -r "$TOKEN_FILE" ]; then
  echo "tunnel token must be a regular, non-symlink file" >&2
  exit 1
fi
TOKEN_MODE="$(/usr/bin/stat -f '%Lp' "$TOKEN_FILE")"
TOKEN_OWNER="$(/usr/bin/stat -f '%u' "$TOKEN_FILE")"
if [ "$TOKEN_MODE" != "600" ]; then
  echo "tunnel token permissions must be 600 (found $TOKEN_MODE)" >&2
  exit 1
fi
if [ "$TOKEN_OWNER" != "$(/usr/bin/id -u)" ]; then
  echo "tunnel token must be owned by the service user" >&2
  exit 1
fi

/usr/bin/touch "$LOG_FILE"
/bin/chmod 600 "$LOG_FILE"

TUN_CHANGED=false
CF_PID=""

set_tun() {
  [ -S "$TUN_SOCKET" ] || return 0
  /usr/bin/curl -sS --max-time 3 --unix-socket "$TUN_SOCKET" \
    -X PATCH -H 'Content-Type: application/json' \
    -d "{\"tun\":{\"enable\":$1}}" "$TUN_API" >/dev/null 2>&1 || true
}

tun_is_enabled() {
  [ -S "$TUN_SOCKET" ] || return 1
  /usr/bin/curl -sS --max-time 3 --unix-socket "$TUN_SOCKET" "$TUN_API" 2>/dev/null \
    | /usr/bin/grep -Eq '"enable"[[:space:]]*:[[:space:]]*true'
}

restore_tun() {
  if [ "$TUN_CHANGED" = true ]; then
    set_tun true
    TUN_CHANGED=false
  fi
}

shutdown() {
  restore_tun
  if [ -n "$CF_PID" ]; then
    /bin/kill "$CF_PID" 2>/dev/null || true
    wait "$CF_PID" 2>/dev/null || true
  fi
  exit 0
}

healthy_connections() {
  /usr/bin/curl -sS --max-time 2 "$METRICS_URL" 2>/dev/null \
    | /usr/bin/awk '$1 == "cloudflared_tunnel_ha_connections" { print int($2); exit }'
}

wait_for_connections() {
  target="$1"
  attempts="$2"
  attempt=0
  while [ "$attempt" -lt "$attempts" ]; do
    count="$(healthy_connections || true)"
    if [ -n "$count" ] && [ "$count" -ge "$target" ]; then
      return 0
    fi
    /bin/sleep 2
    attempt=$((attempt + 1))
  done
  return 1
}

trap shutdown INT TERM HUP
trap restore_tun EXIT

if tun_is_enabled; then
  TUN_CHANGED=true
  set_tun false
  /bin/sleep 2
fi

"$CLOUDFLARED_BIN" tunnel \
  --protocol http2 \
  --metrics "$METRICS_ADDRESS" \
  --loglevel info \
  run --token-file "$TOKEN_FILE" >>"$LOG_FILE" 2>&1 &
CF_PID=$!

wait_for_connections 4 30 || true
restore_tun

# Keep at least two edge connections. The workaround is brief and restores
# TUN immediately, including on signals and error exits.
while /bin/kill -0 "$CF_PID" 2>/dev/null; do
  /bin/sleep 30
  count="$(healthy_connections || true)"
  if [ -n "$count" ] && [ "$count" -lt 2 ] && tun_is_enabled; then
    TUN_CHANGED=true
    set_tun false
    wait_for_connections 4 10 || true
    restore_tun
  fi
done

wait "$CF_PID"
