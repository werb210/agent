#!/usr/bin/env bash
set -euo pipefail

API_LAYER_PATHS=(src/lib src/actions src/integrations/bfServerClient.ts)

if rg "fetch\(" "${API_LAYER_PATHS[@]}"; then
  echo "❌ fetch() is forbidden in API layer"
  exit 1
fi

count=$(rg "axios.create" src/lib/api.ts | wc -l | tr -d ' ')
if [[ "$count" != "1" ]]; then
  echo "❌ Expected exactly one axios.create in src/lib/api.ts, found $count"
  exit 1
fi

if rg "from ['\"]axios['\"]" src/actions src/integrations/bfServerClient.ts src/lib --glob '!src/lib/api.ts'; then
  echo "❌ axios import is forbidden outside src/lib/api.ts for BF API layer"
  exit 1
fi

echo "✅ API guard checks passed"
