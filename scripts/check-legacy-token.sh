#!/usr/bin/env bash
set -euo pipefail

if rg -n "getAgentToken" src tests; then
  echo "FAIL: legacy getAgentToken usage detected"
  exit 1
fi

echo "PASS: no legacy getAgentToken references"
