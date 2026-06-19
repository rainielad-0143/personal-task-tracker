---
description: Add tests to existing logic — behavior over implementation, AAA layout, cover an edge case
argument-hint: <file(s) to cover + behavior to protect>
---

<context>
Project: Personal Task & Work Tracker (see ../CLAUDE.md).
Test commands: `npm run test` in frontend/ (vitest) or backend/ (jest).
</context>

<target>
$ARGUMENTS
</target>

<example_style>
describe('TimeEntriesService', () => {
  it('rejects an entry whose endTime is before startTime', async () => {
    // Arrange
    const dto = { taskId: 't1', startTime: '10:00', endTime: '09:00' };
    // Act + Assert
    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });
});
</example_style>

<instructions>
1. List the behaviors worth testing (happy path + edge/negative cases).
2. Write tests that match the example style above.
3. Cover at least one negative/edge case, not just the happy path.
4. Run the test command and report pass/fail.
</instructions>

<constraints>
- Test behavior, not implementation details.
- No new production code unless a test reveals a real bug — flag it if so.
- Propose a Conventional Commit message (test: ...).
</constraints>
