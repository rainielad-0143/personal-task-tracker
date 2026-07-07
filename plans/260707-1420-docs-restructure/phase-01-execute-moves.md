# Phase 01 — Execute Moves + Fix Links

_Mechanical reorg. Run top-to-bottom from repo root. All moves use `git mv` to preserve history._

## Step 1 — Create folders & move docs

```bash
cd task-tracker
mkdir -p docs/product docs/specs docs/qa docs/reference

# product
git mv requirements.md docs/product/requirements.md
git mv issues.md        docs/product/issues.md

# specs (cluster — sibling links between these survive)
git mv spec.md              docs/specs/spec.md
git mv spec-tasks.md        docs/specs/spec-tasks.md
git mv spec-tickets.md      docs/specs/spec-tickets.md
git mv spec-time-entries.md docs/specs/spec-time-entries.md
git mv spec-daily-reports.md docs/specs/spec-daily-reports.md
git mv spec-dashboard.md    docs/specs/spec-dashboard.md

# qa (cluster — sibling links between these survive)
git mv test-plan.md    docs/qa/test-plan.md
git mv bug-report.md   docs/qa/bug-report.md
git mv review-notes.md docs/qa/review-notes.md

# reference
git mv mcp-and-skills.md docs/reference/mcp-and-skills.md
```

## Step 2 — Remove orphan dir

```bash
rmdir reports        # empty + untracked; canonical reports home is plans/reports/ per conventions
```

## Step 3 — Fix CROSS-GROUP links (6 edits)

Sibling links (same folder) are already correct — do NOT touch them. Only these cross folders:

| File | Old link | New link |
|------|----------|----------|
| `docs/specs/spec.md` (~L5) | `(requirements.md)` | `(../product/requirements.md)` |
| `docs/specs/spec-tasks.md` (~L6) | `(requirements.md)` | `(../product/requirements.md)` |
| `docs/product/requirements.md` (~L70) | `(spec.md#shared-conventions)` | `(../specs/spec.md#shared-conventions)` |
| `docs/product/issues.md` (~L5) | `(spec.md)` | `(../specs/spec.md)` |
| `docs/qa/test-plan.md` (~L4) | `(spec.md)` | `(../specs/spec.md)` |
| `docs/qa/review-notes.md` (~L4) | `(spec.md)` | `(../specs/spec.md)` |

> On `issues.md:5` and `test-plan.md:4`/`review-notes.md`, the `(requirements.md)` /
> `(bug-report.md)` links on those same lines are same-folder siblings — leave them.

## Step 4 — Fix external references (files that stay in place)

| File | Change |
|------|--------|
| `.claude/commands/improve-checklist.md` (L10) | `../../review-notes.md, ../../test-plan.md` → `../../docs/qa/review-notes.md, ../../docs/qa/test-plan.md` **(functional path — must fix)** |
| `CLAUDE.md` (L31) | Update prose refs: `spec.md`→`docs/specs/spec.md`, `requirements.md`→`docs/product/requirements.md`, `issues.md`→`docs/product/issues.md`, `bug-report.md`→`docs/qa/bug-report.md` |
| `README.md` (L12, L113) | `spec.md`/`requirements.md` → `docs/specs/spec.md` / `docs/product/requirements.md` |

Optional: fix the stale CI note in CLAUDE.md (`Day5/Rainiel/**` path filters) — no live workflow uses it.

## Step 5 — Verify

```bash
# 1. Root is clean (only README.md + CLAUDE.md remain as loose .md)
ls -1 *.md            # → CLAUDE.md, README.md only

# 2. No dangling relative links to old root locations
grep -rnE '\]\((spec[^)]*|requirements|issues|bug-report|review-notes|test-plan|mcp-and-skills)\.md' docs/ \
  | grep -v '\.\./'   # any hit WITHOUT ../ that crosses a folder = a link to re-check

# 3. History preserved
git log --follow --oneline docs/specs/spec.md | head -3

# 4. Code/CI untouched
cd backend && npm test && cd ../frontend && npm test
```

## Todo

- [ ] Step 1 — mkdir + git mv (14 files)
- [ ] Step 2 — rmdir reports/
- [ ] Step 3 — 6 cross-group link edits
- [ ] Step 4 — 3 external-ref edits (improve-checklist.md is the critical one)
- [ ] Step 5 — verify (clean root, no dangling links, history, tests)
- [ ] Commit: `docs: reorganize documentation under docs/ (specs, product, qa, reference)`
