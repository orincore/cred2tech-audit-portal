#!/bin/bash
# Applies or removes an edge-level (Nginx + ufw) block for a single IP,
# effective across every vhost on the box (all vhosts share the Nginx
# blocked-ips.conf include). Invoked only by the audit-portal's IP-monitoring
# API via Node's execFile (argv-based call — the IP never passes through a
# shell), which already validates the IP with net.isIP(); this script
# re-validates it as a second line of defense before ever touching Nginx
# config or ufw, and only ever edits its own dedicated include file plus a
# single ufw rule for that exact IP.
set -euo pipefail

ACTION="${1:-}"
IP="${2:-}"
BLOCKLIST_FILE="/etc/nginx/blocked-ips.conf"

if [[ "$ACTION" != "block" && "$ACTION" != "unblock" ]]; then
  echo "usage: apply-ip-block.sh <block|unblock> <ip>" >&2
  exit 1
fi

if [[ ! "$IP" =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]] && [[ ! "$IP" =~ ^[0-9a-fA-F:]+$ ]]; then
  echo "refusing: '$IP' is not a plausible IPv4/IPv6 address" >&2
  exit 1
fi

if [[ "$IP" == "127.0.0.1" || "$IP" == "::1" || "$IP" == "0.0.0.0" ]]; then
  echo "refusing: '$IP' is a loopback/wildcard address" >&2
  exit 1
fi

if hostname -I 2>/dev/null | grep -qw "$IP"; then
  echo "refusing: '$IP' is this server's own address" >&2
  exit 1
fi

touch "$BLOCKLIST_FILE"

if [[ "$ACTION" == "block" ]]; then
  grep -qxF "deny $IP;" "$BLOCKLIST_FILE" || echo "deny $IP;" >> "$BLOCKLIST_FILE"
  ufw insert 1 deny from "$IP" to any >/dev/null
else
  sed -i "\#^deny $IP;\$#d" "$BLOCKLIST_FILE"
  ufw delete deny from "$IP" to any >/dev/null 2>&1 || true
fi

nginx -t
systemctl reload nginx
echo "ok"
