---
description: Aggregate feedback into AI-effectiveness metrics + a trend report
argument-hint: "[last-month | all] (default = all)"
---

<context>
Project: Personal Task & Work Tracker (see ../../CLAUDE.md).
Phase 6 — measure AI-assisted development effectiveness for the retrospective.
Inputs: ../../feedback/*.json (excluding _template.json).
Output report: ../../feedback/reports/YYYY-MM-DD.md (keep old reports for trend comparison).
</context>

<task>
Aggregate metrics for period: $ARGUMENTS
</task>

<instructions>
1. Load all feedback (filter by period if `last-month` is given).
2. Compute:
   - AI accuracy rate = positive / total
   - Human override rate = negative / total
   - Self-review catch rate = resolved_by_self_review true / total negatives
   - Top issue categories (count desc)
   - Trend over time (by week/month) if enough data
3. Write the report to feedback/reports/<today>.md and also print the summary.
4. Feed the result into the sprint retrospective: what AI did well, top 3 negative
   categories + root cause, checklist effectiveness, and 1-3 action items for next sprint.
</instructions>

<output_format>
Markdown report: a metrics table, top categories list, short trend note, and a
bulleted "Action items for next sprint" section.
</output_format>
