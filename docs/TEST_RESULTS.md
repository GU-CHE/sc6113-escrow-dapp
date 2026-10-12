# Local verification results

Date: 2026-10-12. Host: macOS arm64; Solidity 0.8.30, optimizer 200, EVM Shanghai; Ganache 7.9.2; ethers 6.15.0; Python 3.9 local virtual environment. Deployment target uses Python 3.11.

- Contract suite: **11 tests passed**, including role escalation, unauthorized calls, exact funding, cancellation, both dispute outcomes, deadline refund, rejecting receiver credit preservation, reentrancy and final liabilities.
- Flask suite: **9 tests passed**, including valid login, consumed nonce replay, wrong signer, expiry, Origin/session/CSRF protection, immutable content/hash round trip, input bounds, challenge count, unsafe schema rejection, invalid pagination before RPC access, valid cursor semantics and actual RPC failure status.
- Local integration: **passed** wallet signature → Flask session → persistent metadata → funded order → submitted work → approved settlement → withdrawal → API chain reads and decoded events. Test runs only against chain ID 1337 and restores a chain snapshot afterwards.
- JavaScript syntax and Solidity compilation: passed.
- GitHub Actions: commit `15ace65` passed compilation, all 11 contract tests and all 7 Flask tests on Ubuntu / Python 3.11 (run 38157296518).
- Cloud: Render initially deployed commit `15ace65` using Python 3.11.11 and PostgreSQL. HTTPS assets, database health, signed login, nonce replay rejection, CSRF rejection and Secure/HttpOnly/SameSite cookies passed. A clearly labeled QA metadata record retained its verified hash after a Render service restart at 00:57 Singapore time. Evidence: `CLOUD_VERIFICATION.json`.
- Online responsive check: 390px viewport, document width 390px; no page-wide horizontal overflow. Missing-wallet guidance checked. This is viewport emulation, not physical-device or wallet transaction acceptance.
- Browser inspection: local desktop public reads and no-wallet guidance checked. Responsive checks use browser viewport emulation and do not constitute real mobile wallet acceptance.

Ganache's unavailable native uWS/bigint bindings fall back to JavaScript on this local Node build. Local Python emits a LibreSSL/urllib3 warning; Render runs Python 3.11.11. These did not fail the tests.

- Sepolia deployment: four user-confirmed transactions succeeded at blocks 11897155, 11897157, 11897160 and 11897162. All three contract creation bytecodes match repository artifacts. Registry/resolver/orders bindings and administrator role verified by read-only RPC. Evidence: `SEPOLIA_VERIFICATION.json`. No business orders existed at the checked block; this is deployment verification, not full business acceptance.

Current business acceptance: B00–B05 passed on Sepolia through real MetaMask, with 25 screenshots and 32 independently verified transactions; see `BUSINESS_ACCEPTANCE_ZH.md` and `review/PR_REVIEW_ZH.md`. This supersedes the earlier no-business-orders snapshot above.

Pending: independent wallet rejection/account/network switching and physical phone acceptance, F8 optimization comparison, final report/slides/video, group contribution records and reporter retest of P5-001.

- Sepolia-enabled cloud: Render commit `85a86ba` went live at 14:49 Singapore time. `/health` reports configured contracts, `/api/config` matches the verified addresses, and online order/event reads return actual Sepolia state. The prior QA metadata record remains available with its verified hash. The API unit-test fixture now explicitly provides an unconfigured temporary deployment file, independent of live repository addresses.

- P5-001 release: commit `9b9567e8d2913718bef9607ec6a7a586753c1f14` passed GitHub Actions run 38269052633 (11 contract + 9 API tests), then Render deployment `dep-db6fkad9fdbs7380b8e0` became live at 23:19:16 Singapore time. Owner performed 21 successful read-only online checks; independent Member 5 retest remains pending. Evidence: `P5-001_DEPLOYMENT.md`.
