#!/usr/bin/env bash
set -euo pipefail

FETCH_MATCHES=$(rg -n "fetch\\(" src || true)
if [ -n "$FETCH_MATCHES" ]; then
  DISALLOWED=$(echo "$FETCH_MATCHES" | rg -v "^src/lib/apiClient.ts:" || true)
  if [ -n "$DISALLOWED" ]; then
    echo "FAIL: direct fetch usage detected outside src/lib/apiClient.ts"
    echo "$DISALLOWED"
    exit 1
  fi
fi

if rg -n "axios\\(" src; then
  echo "FAIL: axios() usage detected"
  exit 1
fi

if rg -n "XMLHttpRequest" src; then
  echo "FAIL: XMLHttpRequest usage detected"
  exit 1
fi

if rg -n "withCredentials|credentials:\\s*[\"']include[\"']|document\\.cookie|cookie" src; then
  echo "FAIL: cookie-based auth usage detected"
  exit 1
fi

echo "PASS: API guard checks passed"
