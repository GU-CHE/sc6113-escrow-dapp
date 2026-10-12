# Deployment, Persistence and Publication Record

## Source and historical deployment identity

| Item | Evidence and status |
|---|---|
| Reviewed source main | 99b4877f868d6811f6ed125379d8bc29e6690204; verified again before preparing the contribution. |
| Existing CI | Main run 38214701755 succeeded; see ci-verification.json. |
| Historical cloud record | CLOUD_VERIFICATION.json at 2026-10-12T06:50:02.616698+00:00 (14:50 SGT). |
| Historical deployed commit | 85a86bae4af8bcc07601c8d0be582e87b3879862, as recorded by the team. |
| Historical Render deployment | dep-db685lnlot8c7397utkg, as recorded by the team. |
| Owner-reported post-fix revision | 9b9567e8d2913718bef9607ec6a7a586753c1f14; owner record and saved Render screenshot inspected by Part 5. Direct private Render/API attestation remains NOT VERIFIED. |
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

P5-001 remained OPEN after the 12 October publication GETs. The later independent retest now passes and closes it in Part 5; see the update below. Member 1 supplied the fix and deployment, and Part 5 performed the targeted retest. Cloud free-tier behavior, RPC availability and data-store lifetime remain dependencies. A zero-event result can reflect the endpoint's latest-1,000-block window rather than lost transaction history.

## Post-fix deployment and independent retest

The repository baseline is now `41e887576f32e1eec45505c9e39b9b719039f92f`. PR #2 is merged at `b82971ab048b83e62d466a672653231caffbb531`. Source fix `2f615e132d1d1eff95c787890798c0096fe55700` is included in the owner-reported deployed revision `9b9567e8d2913718bef9607ec6a7a586753c1f14`. The later baseline changes only documentation/evidence relative to that deployed revision; it is not assumed to be the running revision.

Owner-provided Render deployment: `dep-db6fkad9fdbs7380b8e0`, service `srv-db5rv4ivcj2c7392k5r0`. Trigger time: 12 October 23:18:01 Singapore time. Owner-recorded actual service-live time: 23:19:16. Part 5 inspected [the record](https://github.com/GU-CHE/sc6113-escrow-dapp/blob/41e887576f32e1eec45505c9e39b9b719039f92f/docs/review/p5-001-deployment.json) and [the screenshot](https://github.com/GU-CHE/sc6113-escrow-dapp/blob/41e887576f32e1eec45505c9e39b9b719039f92f/docs/review/render-p5-001-deployment.png). The screenshot shows succeeded/live, source 9b9567e and the deployment ID; its Deployed field is trigger time, not the owner's separately recorded live-log time.

[Deployed-revision CI](https://github.com/GU-CHE/sc6113-escrow-dapp/actions/runs/38269052633) and [baseline CI](https://github.com/GU-CHE/sc6113-escrow-dapp/actions/runs/38269762536) were verified successful through GitHub. [Retest provenance](retest-provenance-2026-10-13.json) records the metadata and attribution.

The independent retest on 13 October at 00:19:50-00:20:47 Singapore time passed 14 GET checks; see [the closure record](RETEST_EN.md) and [raw observations](p5-001-retest-2026-10-12T16-19-50-547Z.json). The first health response took 42.679 seconds, with no independently established cause. Both prior content digests remain valid after the owner's deployment. This is a subsequent integrity read, not a new restart test. Part 5 performed no login, write, restart, deployment or blockchain transaction.

P5-001 is RETEST PASS / CLOSED in Part 5. Private database settings and direct runtime-revision attestation remain unverified. The owner's screenshot also shows an October 14 maintenance notice, but Part 5 has not checked whether it is still current. Shared infrastructure and original evidence are unchanged.
