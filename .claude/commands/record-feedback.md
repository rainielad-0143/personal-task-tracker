---
description: Record AI-assist feedback (positive / negative / suggestion) to feedback/<name>.json
argument-hint: <member-name>
---

<context>
Project: Personal Task & Work Tracker (see ../../CLAUDE.md).
Phase 6 (Monitoring & Continuous Improvement) — turn corrections into structured data.
Feedback store: ../../feedback/<name>.json (template: ../../feedback/_template.json).
Scratch log: ./temp-feedback.md (read it — corrections are jotted there mid-session).
</context>

<task>
Record feedback for engineer: $ARGUMENTS
</task>

<instructions>
1. Resolve the file `feedback/$ARGUMENTS.json`. If missing, create it from `feedback/_template.json` with `"engineer": "$ARGUMENTS"`.
2. Gather feedback items from BOTH this conversation AND `.claude/temp-feedback.md`.
3. For each item, append one object to `feedbacks[]` using this shape:
   {
     "date": "YYYY-MM-DD",
     "issue_id": "<ticket or null>",
     "command": "<which command/skill, e.g. feature, fix-bug>",
     "category": "naming|type-safety|test|design|documentation|security|performance|project-rule|other",
     "description": "<concrete, specific>",
     "checklist_item_id": "<id or null>",
     "resolved_by_self_review": true|false,
     "action_taken": "<what was done>"
   }
   - `type` of feedback is implied: positive (AI did well), negative (needed correction), suggestion (process idea).
4. Write the JSON back (valid, pretty-printed). Do NOT invent feedback — only record what actually happened.
5. After saving, clear the transferred entries from `.claude/temp-feedback.md`.
</instructions>

<output_format>
Confirm the file path, how many entries were added, and a one-line summary of each.
</output_format>
