# Part 3 — Contract and permission acceptance

Status date: 2026-10-13 (Asia/Shanghai). This folder is the submission package for team member 3. It covers the three-contract interaction, authorization, fund accounting, automated contract tests, security analysis and gas optimization evidence.

## Deliverables

- [CONTRACT_ACCEPTANCE_EN.md](CONTRACT_ACCEPTANCE_EN.md): complete English acceptance report, permission matrix, fund invariants, test-to-requirement traceability and limitations.
- [REPORT_SECTION_EN.md](REPORT_SECTION_EN.md): concise English section ready for the group technical report.
- [CONTRIBUTION_EN.md](CONTRIBUTION_EN.md): individual contribution draft with an explicit verification checklist; the member must add their real name and attest only work they personally reviewed.
- [evidence/gas-optimization.json](evidence/gas-optimization.json): reproducible optimizer-off versus optimizer-200 measurements.
- [`../../tests/contracts.test.cjs`](../../tests/contracts.test.cjs): 14 automated positive and negative contract tests.
- [`../../scripts/gas-analysis.cjs`](../../scripts/gas-analysis.cjs): deterministic local gas comparison generator.

Existing public-chain evidence is not duplicated: deployment receipts and bytecode checks are in [`../SEPOLIA_VERIFICATION.json`](../SEPOLIA_VERIFICATION.json), while 32 successful real-wallet business transactions and fund reconciliation are in [`../BUSINESS_ACCEPTANCE_ZH.md`](../BUSINESS_ACCEPTANCE_ZH.md).

## Reproduce

Use Node.js 22 where possible. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm run compile
pnpm test
pnpm run analyze:gas
```

Expected contract result: 14 passed, 0 failed. The gas script overwrites only `docs/part3/evidence/gas-optimization.json`. Ganache may print a native-module fallback warning on unsupported Node builds; this affects speed, not test semantics.

## Acceptance conclusion

Within the tested prototype scope, no P0 fund-loss/permission defect or blocking P1 contract defect was found. Local automation does not constitute an independent audit. The fixed single arbitrator, public on-chain hashes, lack of appeal/pause/upgrade mechanisms and key-compromise risk remain explicit design limitations.
