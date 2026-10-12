# P5-001: Malformed Pagination Reported as Service Unavailability

Status: **RETEST PASS / CLOSED in Part 5**, following the independent 13 October 2026 retest. Proposed severity: **P2**, following the team's nonblocking-defect category. Implementation owner: **Member 1**. Retest owner: **Part 5**. This is a handoff record, not a claim that an issue has been assigned or a teammate notified.

## Original reproduction

- Environment: public Render service, automated Node.js 24.19.0 HTTP request, Windows 11.
- Timestamp: 2026-10-12T11:19:49.206Z (19:19:49 Singapore time).
- Request: `GET https://sc6113-escrow-dapp.onrender.com/api/orders?before=invalid`.
- Expected: HTTP 400, controlled JSON client-error message.
- Actual: HTTP 503, JSON error `invalid literal for int() with base 10: 'invalid'`.
- Evidence: [original defect record](defects.json), Part 5 E01 in [original live results](live-results.json).
- Impact: a malformed client parameter is classified as upstream service failure and exposes an implementation parsing message. Valid ordinary requests passed in the same run. No records, orders or funds were changed.

## Owner action and closure criteria

Member 1 implemented validation before RPC work in commit 2f615e1, preserving the distinction between invalid input (400) and upstream failure (503). Part 5 makes no application-code change.

The agreed closure criteria require owner deployment evidence plus a separately dated, passing reporter retest of malformed pagination, valid pagination and service health. Both are now satisfied. Original failed evidence remains unchanged.

The owner supplied deployed commit `9b9567e8d2913718bef9607ec6a7a586753c1f14` and Render deployment `dep-db6fkad9fdbs7380b8e0`, live at 23:19:16 Singapore time on 12 October 2026. Part 5 inspected the saved record/screenshot and independently ran 14 passing GET checks on 13 October at 00:19:50-00:20:47 Singapore time. R02 now returns controlled HTTP 400; R03-R08 cover additional invalid cursors; R09-R11 cover valid pagination; health and both saved hashes pass. See [retest and closure](RETEST_EN.md) and [raw results](p5-001-retest-2026-10-12T16-19-50-547Z.json). Deployment identity is attributed owner evidence, not direct private Render attestation.

The shared defect register remains unchanged; Member 6 can integrate the CLOSED status and this evidence. No teammate was messaged by this contribution.
