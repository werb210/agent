#!/usr/bin/env bash
set -euo pipefail

if grep -R "fetch(" src | grep -v "apiClient.ts"; then
  echo "FAIL: direct fetch usage found outside apiClient.ts"
  exit 1
fi

if grep -R "axios(" src; then
  echo "FAIL: axios usage found in src"
  exit 1
fi

echo "PASS: API guard checks completed"
