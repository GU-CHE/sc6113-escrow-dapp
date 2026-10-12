# Part 5 Coverage and Evidence Matrix

Reference revision: `99b4877f868d6811f6ed125379d8bc29e6690204`. Shared cases come from [the team's acceptance checklist](https://github.com/GU-CHE/sc6113-escrow-dapp/blob/99b4877f868d6811f6ed125379d8bc29e6690204/docs/ACCEPTANCE.md). Requirement labels F1/F5/F10 follow the reviewed team requirements and business-acceptance mapping.

**Namespaces matter:** `team A01` is signature acceptance; `Part 5 A01` is missing-Origin rejection. Likewise, Part 5 D01-D07 are backend checks, not the team's desktop/mobile D01-D03. References below explicitly identify the namespace.

## Requirement mapping

| Shared case / requirement | Part 5 evidence | Time and environment | Result and limit |
|---|---|---|---|
| Team A01; F1 API authentication | Part 5 A06-A10, A15-A17 in live-results.json; CI test_wrong_signature_and_expiration | Live: 2026-10-12 19:19 SGT, Windows/Node 24.19.0/ethers 6.15.0; existing CI: Ubuntu/Python 3.11, run 38214701755 | Live login, signer, replay, session and logout PASS. Expiry is attributed CI coverage, not a new live test. Does not establish on-chain roles. |
| Team A02; F1/F5 request protection | Part 5 A01-A02, A04, A11-A12, A17 | Same historical live run | PASS: missing/foreign Origin, unauthenticated writes and absent/incorrect CSRF rejected. |
| Team A03; F5 immutable metadata | Part 5 H01-H05; A13-A14; CI test_immutable_content_persists | Same historical live run; cited CI | PASS: canonical Unicode hash, session-bound author, idempotent digest, public read, malformed/unknown hashes and content bounds. Only one labelled QA record was created. |
| Team A04; F5 persistence | Historical CLOUD_VERIFICATION previousRestartPersistenceCheck; TEST_RESULTS restart record; Part 5 D06 | Team restart approximately 2026-10-12 00:57 SGT; recorded read 00:58:43; independent D06 19:19:42 SGT | Attributed historical persistence evidence plus later hash verification. No fresh restart; the original restart predates configured contracts. |
| F5 REST and input errors | Part 5 A03, A05, A13-A14, H04-H05, D04-D05, E01 | Historical live run | Original E01 FAIL is retained. Independent R02-R11 now PASS after the owner fix; P5-001 is CLOSED in Part 5. This does not certify all F5 behavior. |
| F10 online configuration and deployment evidence | Part 5 D01-D03, D07; ci-verification.json; DEPLOYMENT_EN.md | Historical run and separately dated publication reads | Health/config/assets PASS at recorded times. Owner deployment record/screenshot now identify 9b9567e; R01/R14 independently PASS after deployment. Direct private runtime attestation and database values remain NOT VERIFIED. |
| Short functional availability | stability-samples.json | Three historical reads, 20 seconds apart | PASS; no uptime guarantee, load test or additional restart claim. |
| Challenge limits and schema rejection | Existing CI test_challenge_limit and test_shared_database_schema_rejects_unsafe_targets | Ubuntu/Python 3.11, main revision 99b4877 | Existing suite succeeded. No new live limit exercise or shared-database access performed. |

## Evidence sources and interpretation

- [live-results.json](live-results.json): 30 original checks, 29 PASS/one FAIL; individual UTC timestamps and actual observations.
- [stability-samples.json](stability-samples.json): three short follow-up health/hash samples.
- [ci-verification.json](ci-verification.json): existing successful [main CI run](https://github.com/GU-CHE/sc6113-escrow-dapp/actions/runs/38214701755). The workflow executes the seven API tests; it also runs other owners' contract checks, which this contribution does not claim as new Part 5 execution.
- [local-python-attempt_EN.txt](local-python-attempt_EN.txt): historical local suite NOT RUN because Windows blocked a native module before tests executed. This English diagnostic summary is not a replacement for the locally retained original trace.
- [provenance.json](provenance.json): historical execution boundaries; its one-record count applies to the original run, not publication.
- [original-evidence-manifest.json](original-evidence-manifest.json): preserved original file hashes.
- Separately dated `publication-read-*.json` files: current read-only observations; see DEPLOYMENT_EN.md for classification. These do not change the historical 29/1 total.

## Gap decisions

The original publication used main 99b4877 and its 23 supporting reference blobs. The retest baseline is now 41e8875, including the owner pagination fix and tests. Only pagination handling changed in app.py, so earlier live evidence and successful deployed-revision CI remain the basis for unchanged authentication/content writes; no fresh login or write was needed. The prior native-module policy failure is not bypassed or reattempted.

P5-001 is RETEST PASS / CLOSED in Part 5 after the owner deployment and fourteen independent passing GET checks. Deployment identity is supported by the attributed owner record/screenshot; direct runtime attestation and current provider notices remain unverified. A normal content re-read cannot close the absence of a new restart observation, and none is required for this user-approved historical-evidence approach.

No Part 5 completion claim covers F8 gas optimization, business-order execution, contract-role authorization, wallet UI behavior or physical-device testing. The coordinator retains overall submission acceptance responsibility.

## Post-fix requirement mapping

| Requirement | New evidence | Result and boundary |
|---|---|---|
| F5 input handling; original E01 | R02-R08 in p5-001-retest-2026-10-12T16-19-50-547Z.json | Seven invalid-cursor cases return controlled JSON 400; P5-001 CLOSED. |
| F5 read regression | R09-R11 | Normal, exclusive and empty pagination PASS; no transaction or application write. |
| F5 content integrity; persistence follow-up | R12-R13 | Both existing canonical hashes PASS after the owner's deployment; no new restart claim. |
| F10 live service and deployment provenance | R01/R14; retest-provenance-2026-10-13.json | Health PASS before/after. Owner deployment identity attributed; first response 42.679 seconds. |
| RPC-error regression | Owner-revision CI run 38269052633; test_valid_pagination_and_rpc_failure | Existing CI PASS with simulated 503. Shared live RPC not disrupted; no new local Python execution. |

All new cases ran on 13 October 2026 at 00:19:50-00:20:47 Singapore time, Windows/Node 24.19.0/ethers 6.15.0. See [the retest interpretation](RETEST_EN.md). Original reports remain historical evidence; current documents distinguish their prior OPEN status from the closure decision.
