# Local verification results

Date: 2026-10-12. Host: macOS arm64; Solidity 0.8.30, optimizer 200, EVM Shanghai; Ganache 7.9.2; ethers 6.15.0; Python 3.9 local virtual environment. Deployment target uses Python 3.11.

- Contract suite: **11 tests passed**, including role escalation, unauthorized calls, exact funding, cancellation, both dispute outcomes, deadline refund, rejecting receiver credit preservation, reentrancy and final liabilities.
- Flask suite: **7 tests passed**, including valid login, consumed nonce replay, wrong signer, expiry, Origin/session/CSRF protection, immutable content/hash round trip, input bounds, challenge count and unsafe schema rejection.
- Local integration: **passed** wallet signature → Flask session → persistent metadata → funded order → submitted work → approved settlement → withdrawal → API chain reads and decoded events. Test runs only against chain ID 1337 and restores a chain snapshot afterwards.
- JavaScript syntax and Solidity compilation: passed.
- GitHub Actions: commit `15ace65` passed compilation, all 11 contract tests and all 7 Flask tests on Ubuntu / Python 3.11 (run 38157296518).
- Cloud: Render deployed commit `15ace65` using Python 3.11.11 and PostgreSQL. HTTPS assets, database health, signed login, nonce replay rejection, CSRF rejection and Secure/HttpOnly/SameSite cookies passed. A clearly labeled QA metadata record retained its verified hash after a Render service restart at 00:57 Singapore time. Evidence: `CLOUD_VERIFICATION.json`.
- Online responsive check: 390px viewport, document width 390px; no page-wide horizontal overflow. Missing-wallet guidance checked. This is viewport emulation, not physical-device or wallet transaction acceptance.
- Browser inspection: local desktop public reads and no-wallet guidance checked. Responsive checks use browser viewport emulation and do not constitute real mobile wallet acceptance.

Ganache's unavailable native uWS/bigint bindings fall back to JavaScript on this local Node build. Local Python emits a LibreSSL/urllib3 warning; Render runs Python 3.11.11. These did not fail the tests.

- Sepolia deployment: four user-confirmed transactions succeeded at blocks 11897155, 11897157, 11897160 and 11897162. All three contract creation bytecodes match repository artifacts. Registry/resolver/orders bindings and administrator role verified by read-only RPC. Evidence: `SEPOLIA_VERIFICATION.json`. No business orders existed at the checked block; this is deployment verification, not full business acceptance.

Pending: real MetaMask business transaction confirmation/cancellation/account switching, physical phone acceptance, original problem evidence, final report/slides/video and group contribution records.
