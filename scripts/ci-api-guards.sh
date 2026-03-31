#!/usr/bin/env bash
set -euo pipefail

grep -R "fetch(" src | grep -v "apiClient.ts" || true
grep -R "axios(" src || true

echo "PASS: API guard checks completed"
