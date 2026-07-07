# Plan: Documentation / File-Structure Restructure

_Owner: Carlo (lead) · 2026-07-07 · solo training project, KISS_

## Goal

Clean up the **repo root** — 13 loose markdown files — by giving docs a real home
under `docs/`, without touching `backend/` or `frontend/` code and without breaking
the dense web of relative links between the docs.

## Diagnosis

- Code (`backend/`, `frontend/`) is clean & conventional — **out of scope**.
- Root has 13 stray `.md` files + an empty untracked `reports/` dir.
- Docs are **heavily cross-linked** (relative markdown links + `spec.md#shared-conventions`
  anchors). Links between files in the **same** target folder survive a move; links that
  **cross** folders must be rewritten. This drives the grouping.
- **CI is unaffected**: `ci.yml` filters on `backend/**`, `frontend/**`, `.github/workflows/**`
  only. No doc paths. (The `Day5/Rainiel/**` note in CLAUDE.md is stale — no live workflow uses it.)
- `feedback/` stays at root — it's a functional data dir wired into 3 slash commands, not docs.

## Target tree (root after reorg)

```
task-tracker/
├── README.md            ← stays (entry point)
├── CLAUDE.md            ← stays (AI conventions)
├── .github/ .claude/ .mcp.json .gitignore   ← stay
├── backend/  frontend/                       ← untouched
├── feedback/                                 ← stays (slash-command data dir)
├── plans/                                    ← plans live here (this plan included)
└── docs/                                     ← NEW home for all documentation
    ├── product/
    │   ├── requirements.md
    │   └── issues.md
    ├── specs/
    │   ├── spec.md            (index + shared conventions)
    │   ├── spec-tasks.md
    │   ├── spec-tickets.md
    │   ├── spec-time-entries.md
    │   ├── spec-daily-reports.md
    │   └── spec-dashboard.md
    ├── qa/
    │   ├── test-plan.md
    │   ├── bug-report.md
    │   └── review-notes.md
    └── reference/
        └── mcp-and-skills.md
```

## Grouping rationale

| Group | Files | Why |
|-------|-------|-----|
| `docs/product/` | requirements.md, issues.md | Scope & issue breakdown (the "what/why") |
| `docs/specs/` | spec.md + 5 module specs | Self-contained cluster; sibling links survive intact |
| `docs/qa/` | test-plan.md, bug-report.md, review-notes.md | Test/QA artifacts, tightly inter-linked |
| `docs/reference/` | mcp-and-skills.md | Standalone tooling reference |

Grouping keeps each tight link-cluster together, so only a handful of **cross-group**
links need editing (enumerated in phase-01).

## Phases

| Phase | File | Status |
|-------|------|--------|
| 01 — Execute moves + fix links | [phase-01-execute-moves.md](phase-01-execute-moves.md) | ☐ pending |

Single phase — this is a mechanical reorg, not a feature. Execute top-to-bottom, then verify.

## Success criteria

- Root has **no** loose `.md` except `README.md` + `CLAUDE.md`.
- All docs under `docs/` with git history preserved (`git mv`).
- No broken markdown links (verified by the checklist in phase-01).
- `npm test` / CI unaffected (no code or workflow path touched).
