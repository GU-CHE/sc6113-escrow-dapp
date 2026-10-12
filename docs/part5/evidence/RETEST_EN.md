# P5-001 Independent Retest and Closure

Status: **RETEST PASS / CLOSED in Part 5**. All fourteen checks passed. The shared defect register is owned by the report coordinator and remains unchanged by this contribution.

## Execution and decision

The original reporter's Part 5 retest ran on 13 October 2026, 00:19:50-00:20:47 Asia/Singapore (UTC: 2026-10-12T16:19:50.547Z to 2026-10-12T16:20:47.057Z). It used Windows 11 (win32 10.0.26200), Node.js v24.19.0 and repository-vendored ethers 6.15.0. The automated execution was assisted by Codex, independently of the owner's earlier 21-check run.

Source baseline: `41e887576f32e1eec45505c9e39b9b719039f92f`. Owner fix: `2f615e132d1d1eff95c787890798c0096fe55700`. PR #2 was merged on 12 October 2026 at 23:16:41 Singapore time. The new branch is `codex/part5-p5-001-retest` in the existing independent team checkout.

The owner supplied deployment commit `9b9567e8d2913718bef9607ec6a7a586753c1f14`, Render deployment `dep-db6fkad9fdbs7380b8e0` and service-live time 12 October 2026 at 23:19:16 Singapore time. Part 5 inspected the repository record and screenshot: the screenshot shows source `9b9567e`, the deployment ID and succeeded/live status. The live-log time is attributed to the owner's record. Part 5 did not directly inspect a private Render console or API, and HTTP responses do not attest the exact executing Git revision.

This attributed deployment evidence plus an independently passing live retest satisfies the agreed defect closure criteria. Closure is limited to P5-001 and does not certify every application requirement or long-term availability.

## Results

| Case | Request or purpose | Result |
|---|---|---|
| R01 | /health before retest | 200; configured and healthy; 42,679 ms. |
| R02 | /api/orders?before=invalid | 400; controlled error; no raw Python parsing exception. |
| R03-R08 | Empty, zero, negative, duplicate, decimal and uint256-overflow cursors | All 400 with controlled JSON errors. |
| R09 | /api/orders | 200; descending IDs 8 through 1; 8 total orders. |
| R10 | /api/orders?before=6 | 200; exclusive descending IDs 5 through 1. |
| R11 | /api/orders?before=1 | 200; empty order page. |
| R12-R13 | Historical and Part 5 QA content digests | Both 200; recomputed canonical Keccak and document equality passed. |
| R14 | /health after retest | 200; configured and healthy; 301 ms. |

R02 returned `{"error":"before must be a positive integer"}`. The overflow case returned the additional uint256-range qualification. The first request took 42.679 seconds; the cause was not independently established. This is a recorded latency, not an uptime or response-time guarantee. The unchanged 0.001 test ETH locked and zero claimable ETH are read observations, not Part 5 transactions.

[Raw results](p5-001-retest-2026-10-12T16-19-50-547Z.json) contain per-case UTC timestamps, HTTP status, latency, response-body SHA-256 and assertions. Health and error JSON bodies are retained; order evidence records IDs/counts and liability totals; content evidence records digest checks without translating or republishing canonical fixture text. [The helper](../acceptance/retest_p5_001.cjs) records its own SHA-256 and refuses to overwrite a result file.

## Regression coverage and limits

The source fix validates the cursor before chain access. Only pagination handling and its regression tests changed in application code since the original Part 5 baseline. Authentication/content-write evidence is reused; no fresh login or stored record is justified by this change.

GitHub confirmed [deployed-revision CI run 38269052633](https://github.com/GU-CHE/sc6113-escrow-dapp/actions/runs/38269052633) succeeded at `9b9567e8d2913718bef9607ec6a7a586753c1f14`, including contract and Python API test steps. The nine API test methods include invalid-cursor rejection before chain access and normal-pagination/RPC-failure behavior. These are attributed CI tests, not new local executions. Actual shared-cloud RPC failure was not induced. The previous Windows Python import failure remains NOT RUN; it was not bypassed.

No authentication, data write, blockchain transaction, service restart or deployment was performed in this retest. Both digest reads support continued availability and integrity after the owner's deployment; they are not a new restart acceptance test. Private database settings and current provider notices remain unverified by Part 5.

## Immutable history and integration

The original 30-check result remains 29 PASS / one FAIL, and the earlier six publication GETs remain separate. The owner's 21 checks are not counted as the reporter's fourteen checks. Original raw evidence, original manifests and the historical package-validation record are unchanged.

The coordinator can update the shared defect register to RETEST PASS / CLOSED using this report and integrate the revised REPORT_SECTION_EN.md. Part 5 has not edited that shared register or other members' files.

## References

- [Retest provenance and verified CI metadata](retest-provenance-2026-10-13.json).
- [Owner deployment record](https://github.com/GU-CHE/sc6113-escrow-dapp/blob/41e887576f32e1eec45505c9e39b9b719039f92f/docs/review/p5-001-deployment.json).
- [Owner Render screenshot](https://github.com/GU-CHE/sc6113-escrow-dapp/blob/41e887576f32e1eec45505c9e39b9b719039f92f/docs/review/render-p5-001-deployment.png).
- [Owner's earlier verification](https://github.com/GU-CHE/sc6113-escrow-dapp/blob/41e887576f32e1eec45505c9e39b9b719039f92f/docs/review/p5-001-live-verification.json).
- [Historical defect](defects.json) and [original immutable evidence manifest](original-evidence-manifest.json).
