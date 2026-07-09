#!/usr/bin/env bash
# Regenerate the local dev TLS cert around this machine's stable Bonjour
# hostname (e.g. my-mac.local) instead of a DHCP-assigned IP, so on-device
# testing keeps working when the LAN IP changes. Requires mkcert.
set -euo pipefail

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert is not installed. Install it: brew install mkcert nss" >&2
  exit 1
fi

host="$(scutil --get LocalHostName 2>/dev/null || hostname -s).local"
mkdir -p certs

mkcert -cert-file certs/dev.pem -key-file certs/dev-key.pem \
  "$host" "*.local" localhost 127.0.0.1 ::1

echo
echo "Cert covers: $host, *.local, localhost, 127.0.0.1, ::1"
echo "On a device on the same Wi-Fi, open: https://$host:5173"
echo "(One-time: trust the mkcert root CA on that device — see docs/dev-https.md)"
