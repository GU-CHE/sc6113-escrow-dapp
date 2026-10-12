# P5-001: Malformed Pagination Reported as Service Unavailability

Status: **OPEN**. Proposed severity: **P2**, following the team's nonblocking-defect category. Implementation owner: **Member 1**. Retest owner: **Part 5**. This is a handoff record, not a claim that an issue has been assigned or a teammate notified.

## Original reproduction

- Environment: public Render service, automated Node.js 24.19.0 HTTP request, Windows 11.
- Timestamp: 2026-10-12T11:19:49.206Z (19:19:49 Singapore time).
- Request: `GET https://sc6113-escrow-dapp.onrender.com/api/orders?before=invalid`.
- Expected: HTTP 400, controlled JSON client-error message.
- Actual: HTTP 503, JSON error `invalid literal for int() with base 10: 'invalid'`.
- Evidence: [original defect record](defects.json), Part 5 E01 in [original live results](live-results.json).
- Impact: a malformed client parameter is classified as upstream service failure and exposes an implementation parsing message. Valid ordinary requests passed in the same run. No records, orders or funds were changed.

## Owner action and retest criteria

Member 1 should validate pagination before RPC work and distinguish invalid input (400) from upstream failure (503). Part 5 makes no application-code change.

After the owner supplies the deployed fix and deployment identity, Part 5 will record a separate dated retest of malformed pagination, valid pagination and service health. Close the defect only when the deployed fix is established and those checks pass. Preserve the original failed evidence even after closure.

No owner-provided fix or deployment confirmation was available during this contribution. The unchanged source still parses `before` within a block that converts parsing errors to HTTP 503. Publication health/read checks are not a defect retest. The shared defect register remains unchanged; Member 6 can integrate this record.
