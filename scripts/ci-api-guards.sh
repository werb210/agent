#!/usr/bin/env bash
set -euo pipefail

if rg "fetch\(" src; then
  echo "❌ fetch() is forbidden in src"
  exit 1
fi

count=$(rg "axios.create" src | wc -l | tr -d ' ')
if [[ "$count" != "1" ]]; then
  echo "❌ Expected exactly one axios.create in src, found $count"
  exit 1
fi

echo "✅ API guard checks passed"
