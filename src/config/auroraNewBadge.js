// src/config/auroraNewBadge.js
//
// Single named flag controlling the temporary "New"/"Nýtt" badge on the
// Northern Lights card (Ticket 398, #398). Deliberately a plain constant,
// not wall-clock logic — flip AURORA_NEW_BADGE_ENABLED to false during the
// review window instead of adding date-based rendering, which would make
// tests/screenshots nondeterministic.
//
// REVIEW/REMOVE BY: 2026-09-30 — revisit whether this badge is still
// warranted and either remove it or extend this date.

export const AURORA_NEW_BADGE_ENABLED = true;
export const AURORA_NEW_BADGE_REVIEW_DATE = "2026-09-30";
