# Backend and Cloud Deployment Evaluation

The Flask backend separates public off-chain descriptions from on-chain ownership, order state and balances. Its REST API authenticates metadata authors through wallet message signatures and obtains order and event data through a read-only Sepolia RPC connection. Wallet transaction signing remains separate from API login, and the backend does not hold the customer's or provider's private keys.

## Authentication and request protection

The login flow issues a challenge containing the application origin, wallet address, chain ID, a random nonce and an expiry. A valid signature establishes a server-signed session. Challenges are single-use, while authenticated writes require the configured Origin and a CSRF token. Live tests rejected a different signing wallet, a replayed login signature, absent or foreign Origin, unauthenticated writes, and missing or incorrect CSRF tokens. Successful login cookies carried Secure, HttpOnly and SameSite=Lax attributes. Logout removed the session identity, and the old CSRF token could not authorize a later write.

These tests used an automatically generated, unfunded account solely for message signing. They validate API behavior without creating blockchain transactions. They do not replace the frontend team's MetaMask interaction and physical-device tests. Challenge-expiry and request-limit coverage is provided by the existing repository API suite; those cases were not independently repeated in this live run.

## Data storage and integrity

Public metadata is stored as canonical JSON containing its kind, title, description and authenticated author. The application derives a Keccak-256 digest from the canonical bytes and addresses each record by that digest. The live acceptance run stored one clearly labelled QA record containing Chinese and Korean text, recomputed its hash independently, retrieved it through the public read endpoint, and checked that repeated submission returned the same digest. Malformed and unknown digests returned JSON errors with HTTP 400 and 404 respectively. Hash integrity does not establish the truth of submitted descriptions or guarantee permanent availability.

The configured cloud data store is PostgreSQL, with a dedicated sc6113_escrow_group schema. The earlier team evidence records that a QA record survived a Render service restart. This acceptance run retrieved that same record and verified its digest again. No new Render restart was performed; persistence therefore combines the original team's restart evidence with an independent later integrity check. Contracts were not yet configured during that historical restart check, so it supports metadata persistence only; current chain reads were checked separately. A separate schema avoids naming collisions but does not isolate permissions when database credentials are shared.

## Deployment and acceptance results

At 19:19 Singapore time on 12 October 2026, 30 bounded live API checks produced 29 passes and one nonblocking defect. The public configuration used chain ID 11155111, and all three contract addresses and ABIs matched source revision 99b4877. Served JavaScript and CSS also matched that snapshot. These observations confirm configuration and asset consistency, not the exact running backend commit; that requires the Render deployment record.

The service returned eight orders, 0.001 test ETH locked and zero claimable ETH at the observation time. The order endpoint took approximately 4.10 seconds and the event endpoint approximately 0.82 seconds in this single sample. Three further health and content-integrity observations were taken 20 seconds apart. These are short functional availability samples, not load-test results or an uptime guarantee. Cloud free-tier sleep, RPC availability and database lifetime remain operational dependencies.

## Defect and limitations

An invalid pagination parameter, GET /api/orders?before=invalid, returned HTTP 503 with a Python integer-parsing message instead of a controlled client-error response. This is classified as P2 for this acceptance because normal application-generated requests work and the check did not change funds or records. The recommended fix is to validate pagination before performing RPC work, return a clear HTTP 400 response for invalid input, and retain HTTP 503 for upstream failures. The original reporter should retest the deployed fix before closing the defect.

The existing GitHub Actions run for revision 99b4877 succeeded. An attempted local Python rerun was blocked before tests executed by Windows application-control policy preventing a native cryptography module from loading. Consequently, local execution is not reported as passed. The separate Node.js 24.19.0 and ethers 6.15.0 live acceptance results are recorded in evidence/live-results.json. The Part 5 package does not claim production security certification, a new restart test, or completion of the separate Gas optimization task.

## Publication update

At 20:07 Singapore time on 12 October 2026, six separately recorded read-only checks passed: health, configuration/ABIs, orders, events and both existing QA digests. The first health response took 31.677 seconds; its cause was not independently established. These checks created no metadata, login session or blockchain transaction and performed no restart or deployment. The historical 30-case result remains 29 PASS/one FAIL; P5-001 remains OPEN.

An initial restricted-network attempt obtained no HTTP responses and is classified NOT RUN for application acceptance. Its raw transport failures are retained separately. See evidence/DEPLOYMENT_EN.md and evidence/publication-read-2026-10-12T12-07-16-208Z.json for the successful observations and evidence limits.

## Evidence

- Live results: evidence/live-results.json
- Availability samples: evidence/stability-samples.json
- Reproduction script: acceptance/part5_live.cjs
- Prior cloud evidence: https://github.com/GU-CHE/sc6113-escrow-dapp/blob/99b4877f868d6811f6ed125379d8bc29e6690204/docs/CLOUD_VERIFICATION.json
- CI: https://github.com/GU-CHE/sc6113-escrow-dapp/actions/runs/38214701755
- Source: https://github.com/GU-CHE/sc6113-escrow-dapp/tree/99b4877f868d6811f6ed125379d8bc29e6690204

Automated execution and initial drafting were performed with Codex. Group members should record their own review, coordination and integration work accurately in the contribution report.
