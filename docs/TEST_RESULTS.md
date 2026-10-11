# Local verification results

Date: 2026-10-12. Host: macOS arm64; Solidity 0.8.30, optimizer 200, EVM Shanghai; Ganache 7.9.2; ethers 6.15.0; Python 3.9 local virtual environment. Deployment target uses Python 3.11.

- Contract suite: **11 tests passed**, including role escalation, unauthorized calls, exact funding, cancellation, both dispute outcomes, deadline refund, rejecting receiver credit preservation, reentrancy and final liabilities.
- Flask suite: **6 tests passed**, including valid login, consumed nonce replay, wrong signer, expiry, Origin/session/CSRF protection, immutable content/hash round trip, input bounds and challenge count.
- Local integration: **passed** wallet signature → Flask session → persistent metadata → funded order → submitted work → approved settlement → withdrawal → API chain reads and decoded events. Test runs only against chain ID 1337 and restores a chain snapshot afterwards.
- JavaScript syntax and Solidity compilation: passed.
- Browser inspection: local desktop public reads and no-wallet guidance checked. Responsive checks use browser viewport emulation and do not constitute real mobile wallet acceptance.

Ganache's unavailable native uWS/bigint bindings fall back to JavaScript on this local Node build. Local Python emits a LibreSSL/urllib3 warning; Render is configured for Python 3.11. These did not fail the tests. Cloud runtime installation and behavior still require deployment validation.

Pending: public Sepolia deployment, Render deployment, CI results, real MetaMask transaction confirmation/cancellation/account switching, persistent cloud database restart, physical phone acceptance, original problem evidence, final report/slides/video and group contribution records.
