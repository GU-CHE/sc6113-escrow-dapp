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
| F5 REST and input errors | Part 5 A03, A05, A13-A14, H04-H05, D04-D05, E01 | Historical live run | Normal reads/input errors PASS; E01 FAIL is P5-001 OPEN. No claim that all F5 behavior passes. |
| F10 online configuration and deployment evidence | Part 5 D01-D03, D07; ci-verification.json; DEPLOYMENT_EN.md | Historical run and separately dated publication reads | Health/config/assets PASS at recorded times. Exact current backend commit and private Render values remain NOT VERIFIED. |
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

The current main and 23 supporting reference blobs match the previously reviewed baseline. Existing live and CI evidence covers authentication and content writes, so those cases are not repeated merely for publication. The prior native-module policy failure is not bypassed or reattempted.

P5-001 remains an implementation-owner dependency. Current private deployment identity and operational notices need Member 1's evidence before being claimed as verified. A normal content re-read cannot close the absence of a new restart observation, and none is required for this user-approved historical-evidence approach.

No Part 5 completion claim covers F8 gas optimization, business-order execution, contract-role authorization, wallet UI behavior or physical-device testing. The coordinator retains overall submission acceptance responsibility.
