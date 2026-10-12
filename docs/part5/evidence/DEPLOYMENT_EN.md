# Deployment, Persistence and Publication Record

## Source and historical deployment identity

| Item | Evidence and status |
|---|---|
| Reviewed source main | 99b4877f868d6811f6ed125379d8bc29e6690204; verified again before preparing the contribution. |
| Existing CI | Main run 38214701755 succeeded; see ci-verification.json. |
| Historical cloud record | CLOUD_VERIFICATION.json at 2026-10-12T06:50:02.616698+00:00 (14:50 SGT). |
| Historical deployed commit | 85a86bae4af8bcc07601c8d0be582e87b3879862, as recorded by the team. |
| Historical Render deployment | dep-db685lnlot8c7397utkg, as recorded by the team. |
| Current exact backend revision | NOT VERIFIED. No Render console/deployment-log inspection was performed. |
| Current private Render/database settings | NOT VERIFIED. Source configuration and historical handover are not proof of current private values. |
| New Render restart or deployment | None performed by Part 5 for this publication. |

Pinned sources: [cloud verification](https://github.com/GU-CHE/sc6113-escrow-dapp/blob/99b4877f868d6811f6ed125379d8bc29e6690204/docs/CLOUD_VERIFICATION.json), [test results](https://github.com/GU-CHE/sc6113-escrow-dapp/blob/99b4877f868d6811f6ed125379d8bc29e6690204/docs/TEST_RESULTS.md), [deployment configuration](https://github.com/GU-CHE/sc6113-escrow-dapp/blob/99b4877f868d6811f6ed125379d8bc29e6690204/deployment.json), [Render configuration](https://github.com/GU-CHE/sc6113-escrow-dapp/blob/99b4877f868d6811f6ed125379d8bc29e6690204/render.yaml).

## Publication-time read-only observations

Service: https://sc6113-escrow-dapp.onrender.com

Run: 2026-10-12T12:07:16.208Z to 2026-10-12T12:07:53.838Z (20:07 Singapore time, 12 October 2026). Environment: win32 10.0.26200, Node.js v24.19.0, ethers 6.15.0. Evidence: [publication-read-2026-10-12T12-07-16-208Z.json](publication-read-2026-10-12T12-07-16-208Z.json).

| Case | GET endpoint | HTTP | Response ms | Result |
|---|---|---|---|---|
| P01 | /health | 200 | 31677 | PASS |
| P02 | /api/config | 200 | 570 | PASS |
| P03 | /api/orders | 200 | 4134 | PASS |
| P04 | /api/events | 200 | 639 | PASS |
| P05 | /api/content/0x064677800197721a97440bcca0e89acd5efc1a7dce2783ac732395f670064c3c | 200 | 269 | PASS |
| P06 | /api/content/0xc2380eb31e0e845572b21e4460ffd7143966bcf5c702b1c3e158f4bef4f6602f | 200 | 282 | PASS |

All six checks passed. The first health request took 31.677 seconds; this may be consistent with service wake-up, but the cause was not independently established. The response was successful. Do not omit the first request or treat later faster requests as an uptime or latency guarantee.

Public Sepolia chain ID 11155111, the three addresses and ABIs matched the checked-out deployment reference. Current order/event results and timings are recorded in the JSON, separate from the older eight-order/22-event snapshot. Neither configuration consistency nor health establishes the exact live backend commit. Health checks database reachability and configured addresses; the order/event GETs provide separate chain-read evidence.

An initial restricted-network attempt at 12:07:01 UTC received no HTTP response: every fetch failed locally in 3-48 ms. Its raw file [publication-read-2026-10-12T12-07-01-782Z.json](publication-read-2026-10-12T12-07-01-782Z.json) is preserved. Although the helper recorded six FAIL entries, application checks in that attempt are classified **NOT RUN (transport blocked)**, not six service failures. The subsequent network-enabled run above provides the six actual HTTP observations. No result was overwritten.

## Persistence chain of evidence

1. The team's TEST_RESULTS.md records a Render restart at approximately 00:57 SGT on 12 October 2026.
2. CLOUD_VERIFICATION.json records the prior persistence read at 00:58:43 SGT with digest `0x064677800197721a97440bcca0e89acd5efc1a7dce2783ac732395f670064c3c` and metadataHashVerified=true. contractsConfigured=false at that historical time limits this evidence to metadata persistence.
3. Part 5 D06 independently read that digest and recomputed Keccak at 19:19:42 SGT.
4. Publication case P05 verified the same digest again. P06 verified the separate Part 5 QA digest `0xc2380eb31e0e845572b21e4460ffd7143966bcf5c702b1c3e158f4bef4f6602f`.

This is attributed historical restart evidence plus later integrity reads. It is not a fresh restart, backup-restoration test or database migration test.

## Operational limits and handoff

The repository handover describes PostgreSQL shared with an individual assignment under a dedicated sc6113_escrow_group schema. This avoids table-name collisions; it does not establish separate credentials, permissions, capacity or infrastructure. No schema, credential, migration or other project's data was changed.

The historical handover mentions maintenance at 2026-10-14 09:00 SGT and database expiry on 2026-11-06. These notices were not reverified in the provider console. Member 1 should confirm current notices and exact active deployment evidence before a demonstration. Do not treat the dates as freshly verified infrastructure facts.

P5-001 remains OPEN. Publication GETs do not retest malformed pagination or close that finding. Member 1 owns the fix and deployment; Part 5 owns the targeted retest. Cloud free-tier behavior, RPC availability and data-store lifetime remain dependencies. A zero-event result can reflect the endpoint's latest-1,000-block window rather than lost transaction history.
