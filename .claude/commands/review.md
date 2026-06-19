---
description: Review a diff/PR against this project's conventions (correctness → security → tests → conventions)
argument-hint: <diff to review, or "the staged changes">
---

<context>
Project: Personal Task & Work Tracker (see ../CLAUDE.md).
Review against our conventions: types in sync FE/BE, tests for non-trivial logic,
Prisma migrations for schema changes, Conventional Commits, no secrets in code.
</context>

<diff>
$ARGUMENTS
</diff>

<review_rubric>
Check, in priority order: correctness/bugs → security → missing tests →
convention violations → simplification opportunities. Skip nitpicks.
</review_rubric>

<examples>
Good finding:
  [correctness] backend/src/time-entries/time-entries.service.ts:42
  endTime can be before startTime; add a validation guard and a test for the negative case.

Good finding:
  [convention] No migration found for the new `note` column on TimeEntry.
  Run `npx prisma migrate dev` and commit the migration.

Non-finding (do NOT report this kind):
  "Consider renaming this variable." — style nitpick, out of scope.
</examples>

<output_format>
A bulleted list of findings using the example shape: [category] file:line — issue + fix.
If nothing material is wrong, say so explicitly. End with one overall verdict line.
</output_format>
