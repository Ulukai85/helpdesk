---
name: feedback-apply-all-at-once
description: User approves a full list of refactor changes upfront and expects them all applied in one go without intermediate confirmation
metadata:
  type: feedback
---

When the user presents an approved list of changes (e.g. "the user has approved ALL changes, please apply every one of them"), apply everything in a single session without stopping to confirm individual items.

**Why:** The user has already reviewed and signed off the audit. Re-asking wastes time.

**How to apply:** Read all affected files first, then batch the edits, verify with a build/test run at the end, and report results once.
