# Day 5 — MCP & Agent Skills

**Feature:** Task Management (CRUD) — Personal Task & Work Tracker
**Author:** Rainiel
**Date:** 2026-06-19

Applying one MCP integration and one Agent Skill to the real Day-4 feature, then
shipping it through a Phase 5 (Deploy/CI-CD) + Phase 6 (Monitoring) workflow.

---

## 1. MCP sketch — GitHub MCP

**What it connects to:** the GitHub repo (`framgia/sph-aidd-training`) — issues, PRs,
commit/check-run status, releases.

**What it lets the AI do that it can't today:** right now Claude only sees local
files. With the GitHub MCP it can read the Day-2 issues, check whether the PR for a
branch is approved and whether CI is green *on the head commit*, and find open
`bug`/`blocker` issues — i.e. answer "is this safe to deploy?" from live repo state
instead of guessing. It also lets the deploy-readiness check (below) pull real
signals rather than relying on `gh` shelled out by hand.

**Wired up:** project-scoped, committable config at [`.mcp.json`](.mcp.json):

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}" }
    }
  }
}
```

Token is read from the environment, never hardcoded. To enable: export a PAT with
`repo` scope (or put it in the gitignored `.claude/settings.local.json`) and restart
Claude Code.

---

## 2. Agent Skill proposal — `deploy-check`

| Field | Value |
| :-- | :-- |
| **Name** | `deploy-check` |
| **Trigger** | "deploy-check", "is this ready to ship/deploy", "pre-deploy check", "verify the PR before shipping" |
| **Automates** | The Phase 5 **AI-verification** gate: runs local quality gates (lint/test/build, both apps) + reads GitHub signals (CI status, PR approval, blocking issues) + checks for pending Prisma migrations and a `/health` endpoint |
| **Expected output** | A GO / NO-GO / GO-WITH-WARNINGS readiness report + the exact `gh workflow run …` command to fire next (or what to fix first) |

Drafted end-to-end at [`.claude/skills/deploy-check/SKILL.md`](.claude/skills/deploy-check/SKILL.md).
It pairs with the GitHub MCP from §1 and the deploy workflows from §3.

---

## 3. Applied to a real task — deploy-check run

Ran the skill's gates against the live branch before a (template) deploy.

**Target:** `feat/day4-rainiel` → `dev`

| Gate | Result | Notes |
| :-- | :-- | :-- |
| backend lint | ✅ | eslint clean |
| backend test | ✅ | 3 suites / **15 tests** (incl. 2 new `/health` tests) |
| backend build | ✅ | `nest build` ok |
| frontend lint | ✅ | eslint clean |
| frontend build | ✅ | `tsc -b && vite build` ok |
| frontend unit test | ⚠️ | **env-blocked** — vitest worker spawn times out on this WSL2 `/mnt/d` path (parenthesised `training(2)` dir). Reproduces on Day4 too → environment issue, not a code regression. Suite was green at Day 4. |
| CI on HEAD | ❌ | No project CI at repo root — only Dependency-Graph runs exist. (Fixed: added `ci.yml`, see §4.) |
| PR status | ℹ️ | Day-4 PR #222 already **MERGED** |
| pending migrations | ✅ | none (health is a controller, no schema change) |
| `/health` present | ✅ | added `backend/src/health` this session |

**VERDICT: GO-WITH-WARNINGS (dev).** Backend fully green; frontend ships on a clean
build with the unit-test caveat above. Would be **NO-GO for production** until the
CI workflow is live at repo root and the frontend suite runs in CI.

**Next command:**
`gh workflow run deploy-backend.yml -f environment=dev -f branch=feat/day4-rainiel`

---

## 4. Supporting artifacts added this session

- **Health endpoint** — `backend/src/health/` (`GET /health` pings the DB; 200 when
  up, 500 when the DB is down) so the deploy pipeline's verify step has a real probe.
- **Phase 5 CI/CD** — [`.github/workflows/`](.github/workflows/): `deploy-backend.yml`,
  `deploy-frontend.yml` (build → backup → deploy → verify health → **auto-rollback on
  failure**), and `ci.yml` (lint+test+build gate). *Templates live under `Day5/Rainiel/`;
  GitHub only runs workflows from the repo root, so they must be copied there to fire.*
- **Phase 6 monitoring** — `feedback/_template.json`, `feedback/reports/`,
  `.claude/temp-feedback.md`, and commands `/record-feedback`, `/improve-checklist`,
  `/aggregate-feedback` for the continuous-improvement loop.

---

## 5. Results note — what worked / what didn't / what I'd improve

**What worked**
- The GitHub MCP + `deploy-check` pairing turns "I think it's fine" into a checklist
  with real evidence. It immediately surfaced a genuine gap: there was **no project
  CI** gating merges (the CLAUDE.md described a `ci.yml` that never existed).
- Adding a real `/health` endpoint made the Phase 5 verify/rollback step concrete
  instead of hand-wavy — the workflow's `curl -f` now probes something real.
- A skill that ends with the *exact next command* removes the "now what?" step.

**What didn't**
- Frontend `vitest` can't spawn workers in this sandbox (`training(2)` parens / WSL
  `/mnt` IO) — `--pool=forks/threads` and `singleFork` all time out. Build is fine.
- The cloud deploy steps are placeholders (no real Azure/AWS/GCP target in training),
  so the auto-rollback path is structurally correct but untested against a live env.
- MCP token isn't committed (correctly), so in a fresh/headless session the skill
  falls back to `gh` CLI for repo signals.

**What I'd improve**
- Make CI run the frontend suite in a clean Linux runner (no parens path) to confirm
  the env theory, and add a smoke e2e (Playwright `tasks.spec.ts`) to the verify step.
- Move the workflows to the repo root behind path filters so they actually run.
- Have `deploy-check` post its report as a PR comment via the GitHub MCP (close the loop).
