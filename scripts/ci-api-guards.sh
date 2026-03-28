#!/usr/bin/env bash
set -euo pipefail

FETCH_COUNT=$( (rg "fetch\\(" src || true) | wc -l | tr -d ' ')
AXIOS_COUNT=$( (rg "axios.create" src || true) | wc -l | tr -d ' ')

if [ "$FETCH_COUNT" -ne 0 ]; then
  echo "FAIL: fetch usage detected"
  exit 1
fi

if [ "$AXIOS_COUNT" -ne 1 ]; then
  echo "FAIL: must have exactly one axios instance"
  exit 1
fi

if rg "Promise\\.all" src; then
  echo "FAIL: parallel execution not allowed"
  exit 1
fi

if rg "\\?\\." src/lib/validateOutput.ts; then
  echo "FAIL: optional chaining not allowed in output validation"
  exit 1
fi

echo "PASS: API guard checks passed"
