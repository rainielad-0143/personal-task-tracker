---
description: Analyze recorded feedback and propose improvements to review/test checklists
argument-hint: "[checklist-name] (optional; default = all)"
---

<context>
Project: Personal Task & Work Tracker (see ../../CLAUDE.md).
Phase 6 — convert recurring feedback into concrete checklist changes.
Inputs: all of ../../feedback/*.json (excluding _template.json).
Checklists live in: ../../review-notes.md, ../../test-plan.md, and these commands.
</context>

<task>
Propose checklist improvements for: $ARGUMENTS
</task>

<instructions>
1. Read every feedback/*.json and group entries by `category`.
2. Decide an action per group:
   - ADD NEW: `checklist_item_id == null` AND same category appears >= 2 times.
   - ENHANCE: `resolved_by_self_review == false` AND an existing `checklist_item_id` exists → clarify it.
3. Assign priority: High (>= 3 occurrences OR security) > Medium (2) > Low (1).
4. SKIP (avoid bloat): one-off + unlikely to recur, temporary issues, or anything a
   linter/formatter already catches.
5. Present proposals for human review — do NOT silently edit checklists.
</instructions>

<output_format>
A table: Priority | Category | Action (ADD/ENHANCE) | Proposed checklist item | Evidence (#occurrences + example).
Then ask which proposals to apply before editing any file.
</output_format>
