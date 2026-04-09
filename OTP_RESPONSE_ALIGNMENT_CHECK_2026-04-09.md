# OTP Verify Response Alignment Check (2026-04-09)

## Scope
Cross-system sanity check for server OTP verify response shape migration to:

```json
{ "status": "ok", "data": { "token": "<jwt>" } }
```

Target systems:
- BF-portal
- BF-client
- agent (this repository)

## Outcome
- **No code changes required** for runtime behavior in this repository.
- The agent code path remains **unaffected** by OTP verify response shape changes.

## Agent verification details
- `apiCall` returns `json.data` whenever a top-level `data` field exists.
  - For `{ status: "ok", data: { token } }`, it returns `{ token }`.
- The repository defines OTP endpoints as constants, but no in-repo OTP verify consumer logic was identified beyond endpoint declarations.
- The only direct OTP HTTP usage found is an e2e call to `/api/auth/otp/start` (not `/otp/verify`).

## Environment note
This workspace currently contains only the `agent` repository at `/workspace/agent`; BF-portal and BF-client repositories are not present here, so their test commands could not be executed in this environment.

## Commands run
- `npm ci`
- `npm run build && npm test`
- `npm ci && npm run typecheck && npm run build && npm run test:ci` (fails because `test:ci` script is missing)
- `cd client-app && npm ci && npm run build && npm run test` (fails because `client-app` directory is missing)
