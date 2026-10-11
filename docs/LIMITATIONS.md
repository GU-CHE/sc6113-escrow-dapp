# Verification limits and operational assumptions

- Course prototype using test ETH, without independent security audit or production certification.
- Real Sepolia contract deployment and Render deployment require the user's accounts and wallet confirmations; not yet completed by local tests.
- Real MetaMask, signature cancellation, account switching and physical mobile tests still require group acceptance.
- Local wallets, Ganache addresses and local test transactions are not public deployment evidence.
- One fixed administrator arbitrates subjectively. No admin rotation, appeal, partial settlement or multiple milestones.
- Submitted work can wait indefinitely for approval or arbitration; arbitrator availability is an explicit dependency. Missed-delivery refunds apply only before submission.
- Public metadata is immutable by digest but stored off chain. Database backups, retention, moderation and availability need operational planning.
- Bounded challenge count and per-nonce attempts are implemented; distributed/IP rate limiting, sustained abuse tests and security monitoring are not.
- The UI records confirmation after one receipt. Production finality, reorg recovery, RPC failover and deep historical event indexing are not implemented.
- Orders are read 50 per page; recent event window is 1,000 blocks with at most 100 events. Public RPC limits can interrupt reads; use an appropriate Sepolia RPC provider.
- PostgreSQL is required for persistent Render operation. Free database/service lifecycle and availability must be checked before submission. Do not rely on ephemeral SQLite storage in cloud hosting.
- A dedicated PostgreSQL schema prevents table-name collisions when sharing a database. Shared credentials still allow access to the entire database; this is data organization, not a security boundary. Projects share database capacity, availability and expiry.
- Git history records actual commits only. AI assistance and individual testing/report contributions must be disclosed accurately; no fabricated user research or impact numbers.
