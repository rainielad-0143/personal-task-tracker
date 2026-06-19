---
name: deploy-check
description: >-
  Verify deployment readiness for the Task Tracker before triggering a Phase 5
  deploy. Activate when the user says "deploy-check", "is this ready to ship/
  deploy", "pre-deploy check", or asks to verify a branch/PR before deploying.
  Runs local quality gates + (via GitHub MCP) checks CI status, open PRs, and
  blocking issues, then returns a GO / NO-GO readiness report.
---

# deploy-check — pre-deployment readiness gate

AI verification step for **Phase 5 (Deployment & CI/CD)**. The goal is a human-
reviewable GO / NO-GO verdict *before* anyone runs `deploy-backend.yml` /
`deploy-frontend.yml`, so broken builds never reach an environment.

## When to use
- Before triggering any deploy workflow (dev / staging / production).
- When asked "is `<branch>` ready to deploy?" or to "verify the PR before shipping".

## Inputs
- `branch` (default: current branch)
- `environment` (default: `dev`) — production raises the bar (see Gates).

## Steps

1. **Local quality gates** (run from `Day5/Rainiel/`):
   - Backend: `cd backend && npm ci && npx prisma generate && npm run lint && npm test && npm run build`
   - Frontend: `cd frontend && npm ci && npm run lint && npm test && npm run build`
   - Record pass/fail + key numbers (test counts, build output). If a step can't
     run locally (e.g. known sandbox limitation), say so explicitly — do NOT mark it green.

2. **Repo signals via GitHub MCP** (server `github` in `.mcp.json`):
   - CI status / latest check runs for the target branch's head commit.
   - Open PR for the branch: is it approved? are required checks green? merge conflicts?
   - Open issues labelled `bug` / `blocker` that target this release.
   If the GitHub MCP token isn't configured, note it and fall back to `gh` CLI
   (`gh run list`, `gh pr view`) — never fabricate status.

3. **Migration check (backend):** if `backend/prisma/migrations/` changed vs the
   deployed ref, flag that `npx prisma migrate deploy` must run on the target.

4. **Health-endpoint sanity:** confirm `GET /health` exists (backend/src/health)
   so the workflow's verify step has something to probe.

## Gates (NO-GO if any fail)
- Any lint / test / build step fails.
- CI red on the target commit.
- `production`: PR must be approved AND all required checks green AND no open
  `blocker` issues. (`dev` may proceed with warnings.)

## Output format
A short report:

```
## Deploy readiness: <branch> → <environment>
VERDICT: GO | NO-GO | GO-WITH-WARNINGS

| Gate              | Result | Notes |
| ----------------- | ------ | ----- |
| backend lint/test/build | ... | 13 tests |
| frontend lint/test/build | ... | ... |
| CI on HEAD        | ... | ... |
| PR approved       | ... | ... |
| pending migrations| ... | ... |
| /health present   | ... | ... |

Blockers: <list or none>
Next step: <exact gh workflow run command, or what to fix first>
```

Always end with the precise next command, e.g.:
`gh workflow run deploy-backend.yml -f environment=dev -f branch=<branch>`
