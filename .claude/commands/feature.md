---
description: Plan-then-implement a feature across the NestJS backend and/or React frontend
argument-hint: <feature description from the user's perspective>
---

<context>
Project: Personal Task & Work Tracker (see ../CLAUDE.md).
Stack: React + Vite + TypeScript (frontend/), NestJS + Prisma + PostgreSQL (backend/).
Relevant domain: Tasks | Time Entries | Daily Reports | Tickets (infer from the request).
</context>

<task>
$ARGUMENTS
</task>

<constraints>
- Keep frontend and backend types in sync; prefer shared DTO shapes.
- All non-trivial logic must have tests.
- Schema changes go through a Prisma migration — never edit the DB by hand.
- Follow Conventional Commits for any commit message you propose.
- Do not commit secrets; use .env.
</constraints>

<instructions>
Think step by step before writing code:
1. Restate the feature and list any assumptions or open questions.
2. Outline the plan: data model (Prisma) → backend (DTO, service, controller) →
   frontend (API call, component, state) → tests.
3. Pause and show me the plan. Wait for my "go" before implementing.
4. After approval, implement it and list the tests you added.
</instructions>

<output_format>
A short numbered plan first, then — after approval — a summary of changed files with a
one-line reason each, and the proposed Conventional Commit message.
</output_format>
