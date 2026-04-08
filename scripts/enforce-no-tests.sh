#!/usr/bin/env bash
set -euo pipefail

if find src -type f \( -name "*.test.ts" -o -name "*.test.tsx" \) | grep -q .; then
  echo "Test files detected. CI is build-only."
  exit 1
fi

if grep -r "vitest" .; then
  echo "Vitest usage detected. Not allowed."
  exit 1
fi
