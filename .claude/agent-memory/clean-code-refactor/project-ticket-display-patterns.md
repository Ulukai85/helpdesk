---
name: project-ticket-display-patterns
description: Enum-to-label and sentinel-value patterns discovered during tickets/reply refactor session
metadata:
  type: project
---

`ticketColumns.tsx` is the canonical home for all ticket display constants — `STATUS_LABEL`, `STATUS_VARIANT`, and `CATEGORY_LABEL`. When adding new enums or display-facing values for tickets, add them here and import project-wide.

**Why:** Centralising display constants prevents drift between the table badge, the Select options in `UpdateTicket`, and component tests. Prior to this session, `STATUS_OPTIONS` in `UpdateTicket` was using raw enum strings (`"OPEN"`) as labels while `CATEGORY_OPTIONS` used `CATEGORY_LABEL`.

**How to apply:** Any time a ticket enum value needs human-readable display text, first check `ticketColumns.tsx` for an existing map before defining an inline label. Add the map there if it doesn't exist.

Sentinel constants for nullable Select fields (`UNASSIGNED = 'unassigned'`, `NO_CATEGORY = 'none'`) belong as named module-level constants in the component that owns the Select, not as inline string literals scattered across callbacks.

Related: [[project-avoid-form-data-shadowing]]
