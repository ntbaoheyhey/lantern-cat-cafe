#!/bin/sh
# Public nonce availability only. Never print nonce bodies or credentials.
set -eu
root=${1:-${SUPABASE_URL:-https://qoalewtxflagoprrxrgh.supabase.co}}
root=${root%/}
if ! code=$(curl --silent --show-error --connect-timeout 5 --max-time 15 \
  --request POST --header 'content-type: application/json' \
  --output /dev/null --write-out '%{http_code}' "$root/functions/v1/auth-nonce" 2>/dev/null); then
  printf '%s\n' 'FAIL auth-nonce transport unavailable'
  exit 1
fi
case "$code" in
  2??) printf 'PASS auth-nonce HTTP %s\n' "$code" ;;
  *) printf 'FAIL auth-nonce HTTP %s\n' "$code"; exit 1 ;;
esac
