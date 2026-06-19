---
description: Reproduce, diagnose, and fix a bug — failing test first, root cause over symptoms
argument-hint: <what's broken: expected vs actual, repro steps>
---

<context>
Project: Personal Task & Work Tracker (see ../CLAUDE.md).
Stack: React + Vite + TypeScript (frontend/), NestJS + Prisma + PostgreSQL (backend/).
</context>

<bug_report>
$ARGUMENTS
</bug_report>

<instructions>
Work through this step by step and show your reasoning at each step:
1. Reproduce: write a failing test (or describe the exact repro) that demonstrates the bug.
2. Diagnose: trace the root cause — explain WHY it happens, not just where.
3. Fix: make the smallest change that addresses the root cause.
4. Verify: confirm the failing test now passes and no existing tests break.
5. Guard: note any related cases that could share the same root cause.
</instructions>

<constraints>
- Prefer a failing test before the fix (red → green).
- Schema-related fixes go through a Prisma migration.
- Keep the fix minimal and focused; no unrelated refactors.
- Propose a Conventional Commit message (fix: ...).
</constraints>
