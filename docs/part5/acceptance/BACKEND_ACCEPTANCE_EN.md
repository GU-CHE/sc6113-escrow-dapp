# Backend and Deployment Acceptance

SC6113 Group Project - Part 5. Acceptance covers wallet login, content hashes, database persistence, online service behavior and deployment records. On 12 October 2026 at 19:19 Singapore time, 30 live API checks produced 29 passes and one open P2 defect.

No business order or funds were changed. The only new application content was one explicitly labelled public QA metadata record. An unfunded disposable account was used for message signing. Persistence evidence combines an existing team restart record with an independent later hash check; no new Render restart was performed.

## Environment and versions

| Item | Recorded value |
|---|---|
| Live service | https://sc6113-escrow-dapp.onrender.com |
| Reference revision | 99b4877f868d6811f6ed125379d8bc29e6690204 |
| Network | Sepolia, chain ID 11155111 |
| Execution environment | Windows 11; Node.js 24.19.0; repository-vendored ethers 6.15.0 |
| Method | Automated HTTP requests and in-memory wallet message signing, assisted by Codex. This is API acceptance, not manual MetaMask interaction. |
| Deployed version evidence | Public addresses, ABIs, app.js and styles.css matched the reference snapshot. The exact running backend revision requires a Render deployment record. |
| Local Python attempt | The existing seven-test API suite did not execute: Windows application control blocked a native cryptography module during import. No local pass is claimed. |
| Existing CI | GitHub Actions succeeded for revision 99b4877. This existing CI result is separate from the 29 live checks passed in this acceptance run. |

## Acceptance coverage

Case IDs below belong to this Part 5 package. They do not replace similarly named cases in the team's ACCEPTANCE.md. Expected results, observations and timestamps are recorded in evidence/live-results.json.

| Area | Cases | Result |
|---|---|---|
| HTTPS and database health | D01, D07 | PASS. The health status was ok before and after the checks. |
| Configuration and assets | D02, D03 | PASS. Addresses, ABIs and static assets matched; CSP and nosniff headers were present. |
| Chain reads | D04, D05 | PASS. Orders and decoded events were returned within the configured result bounds. |
| Historical persistence record | D06 | PASS. The existing QA record was readable and its Keccak digest matched. |
| Origin and invalid input | A01-A05 | PASS. Expected JSON errors used HTTP 403, 400, 401 and 415. |
| Authentication | A06-A10 | PASS. Challenge binding, wrong-signer rejection, valid login, replay rejection and session identity. |
| Write protection | A11-A14 | PASS. Missing/incorrect CSRF, invalid content kind and oversized descriptions were rejected. |
| Content integrity | H01-H05 | PASS. Unicode hashing, authenticated authorship, repeated submission, public reads and invalid/unknown hashes. |
| Logout | A15-A17 | PASS. Logout cleared the session; the previous CSRF token could no longer authorize writes. |
| Invalid pagination | E01 | FAIL. Expected HTTP 400; observed HTTP 503. Recorded as open defect P5-001. |

Challenge expiry, per-address challenge limits and database schema validation are covered by the existing repository API suite; they were not independently repeated in these 30 live checks. The attempted local rerun was blocked before execution.

Three additional health and saved-content reads passed, with a 20-second wait between samples. These observations are recorded in evidence/stability-samples.json. They are short functional availability samples, not load testing, a restart test or an uptime guarantee.

## Database persistence evidence

The existing docs/CLOUD_VERIFICATION.json contains previousRestartPersistenceCheck at 00:58:43 Singapore time on 12 October 2026. The team's docs/TEST_RESULTS.md records a service restart at approximately 00:57. This report cites those historical records; no new restart was performed.

At that historical check, contractsConfigured was false. The record therefore supports metadata persistence only. Current contract configuration and chain reads were checked separately in D02, D04 and D05.

Historical QA digest: 0x064677800197721a97440bcca0e89acd5efc1a7dce2783ac732395f670064c3c

In D06, the stored canonical content was retrieved and its Keccak-256 digest was recomputed successfully. The supported conclusion is an existing team restart test plus a later independent integrity check, not a new restart acceptance run.

New QA digest: 0xc2380eb31e0e845572b21e4460ffd7143966bcf5c702b1c3e158f4bef4f6602f

A later operator-recorded restart can be followed by part5_live.cjs --verify-digest with the recorded digest. Without a separately recorded restart event, that command verifies a normal content read only.

## Deployment and online observations

| Contract | Public Sepolia address |
|---|---|
| RoleRegistry | 0x301B9E840e8FCf727c4b31c9AF75477D64FD4810 |
| EscrowOrders | 0xf56A0BDED64dA25261FE4DAd31a72D521ED0680B |
| DisputeResolver | 0xA0B660Bb047a7Bebc461630D4c7B3F3072EC25a8 |

Public configuration and ABIs matched deployment.json and the source snapshot. Contract receipts and bytecode verification are supported by the team's existing SEPOLIA_VERIFICATION.json; they were not re-executed in this acceptance run.

The order endpoint returned eight orders, 0.001 test ETH locked and zero claimable ETH. One order request took 4.10 seconds and one event request 0.82 seconds. The event endpoint covers at most 100 events within the latest 1,000 blocks. These single samples do not establish throughput or an SLA; older transactions need explorer links or retained evidence.

Render uses Flask, Gunicorn and PostgreSQL. The health endpoint checks database connectivity and whether addresses are configured; D04/D05 additionally tested actual chain reads. A dedicated database schema avoids naming collisions, but shared credentials do not provide permission isolation. Free-tier sleep, RPC availability and database lifetime remain operational dependencies.

The team's cloud verification record at 14:50 Singapore time on 12 October lists backend commit 85a86bae4af8bcc07601c8d0be582e87b3879862 and Render deployment dep-db685lnlot8c7397utkg. This is historical deployment evidence. This run neither inspected the Render console nor deployed the service.

## Defect P5-001

Proposed severity: P2. Status: OPEN. GET /api/orders?before=invalid was expected to return HTTP 400 with a controlled parameter error. It returned HTTP 503 with the message: invalid literal for int() with base 10: 'invalid'. Valid application-generated requests worked, and the probe changed no orders, funds or stored content.

Recommended fix: validate the pagination parameter before performing RPC calls; return HTTP 400 for invalid input and retain HTTP 503 for upstream failures. After deployment of a fix, retest invalid input and valid pagination before closing the issue. No fix or successful retest is claimed in this report.

## Deliverables and contribution

The package contains this English report, an editable Markdown version, an English integration section, the 30 original JSON results, availability samples, reproduction scripts and a defect record. The report coordinator can integrate acceptance/REPORT_SECTION_EN.md while retaining the evidence scope and limitations.

Automated execution and initial drafting were assisted by Codex. Members should describe their actual review, coordination, retesting and report integration work accurately. Automated API requests are not manual MetaMask tests, and the historical team restart is not a new individual execution.

Gas optimization F8 is outside this login, hashing, database and deployment acceptance scope. If separately assigned to Part 5, it requires its own experiment and comparison criteria.

All authored submission documents, filenames, headings and instructions are in English. Original execution evidence and hash values are unchanged. The multilingual test fixture remains semantically identical and is represented with Unicode escape sequences in the reproduction script.

## Publication update

At 20:07 Singapore time on 12 October 2026, six separately recorded read-only checks passed: health, configuration/ABIs, orders, events and both existing QA digests. The first health response took 31.677 seconds; its cause was not independently established. These checks created no metadata, login session or blockchain transaction and performed no restart or deployment. The historical 30-case result remains 29 PASS/one FAIL; P5-001 remains OPEN.

An initial restricted-network attempt obtained no HTTP responses and is classified NOT RUN for application acceptance. Its raw transport failures are retained separately. See evidence/DEPLOYMENT_EN.md and evidence/publication-read-2026-10-12T12-07-16-208Z.json for the successful observations and evidence limits.

## Evidence index

| Artifact | Purpose |
|---|---|
| evidence/live-results.json | Expected and observed results for all 30 live checks. |
| evidence/stability-samples.json | Three subsequent health and content-integrity observations. |
| evidence/ci-verification.json | Confirmed existing CI status and run URL. |
| evidence/defects.json | P5-001 reproduction, impact and suggested retest. |
| evidence/provenance.json | Scope, execution method and restart/deployment boundaries. |
| evidence/local-python-attempt_EN.txt | English diagnostic summary of the blocked local test attempt. |
| evidence/COVERAGE_EN.md | Shared-case mapping, evidence scope and remaining dependencies. |
| evidence/DEPLOYMENT_EN.md | Historical and current deployment/persistence evidence. |
| evidence/publication-read-*.json | Separately dated read-only publication observations. |

CI run: https://github.com/GU-CHE/sc6113-escrow-dapp/actions/runs/38214701755

Source snapshot: https://github.com/GU-CHE/sc6113-escrow-dapp/tree/99b4877f868d6811f6ed125379d8bc29e6690204

Shared source and deployment evidence are referenced at the pinned revision rather than duplicated in this contribution. Reproduction helpers read the existing repository files. All paths in the evidence table are relative to docs/part5/.
