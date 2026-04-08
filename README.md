## Deployment Rules

- main = production (protected)
- develop = staging
- NO direct deploys from main commits
- ONLY PR merges trigger deploy
- Production requires environment approval
- All required env vars must be present
