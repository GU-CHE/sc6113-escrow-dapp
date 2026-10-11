# Acceptance checklist

Status date: 2026-10-12. Render interface and cloud database are deployed and checked. Public contract deployment, real-wallet transactions and physical-device checks are pending. Local automated results apply to their tested environment.

## Team roles

1. Development and integration: source, ABI, deployment and fixes.
2. Business acceptance: requirement coverage, primary lifecycle and measurable evaluation.
3. Contract and permission acceptance: automated tests, liabilities, unauthorized actors.
4. Frontend and wallet acceptance: rejection, switching, responsive UI, real phone.
5. Backend and deployment acceptance: API, signatures, database restart, online service.
6. Coordination and demonstration: defect log, retests, report, slides, video and submission links.

## Required test runs

| ID | Scenario | Expected result | Environment / evidence |
|---|---|---|---|
| B01 | Create → accept → fund → deliver → approve → withdraw | Correct states and exact payout; no double withdrawal | Automated local; repeat on Sepolia |
| B02 | Unfunded cancellation | Acceptance/funding blocked afterwards | Automated local; browser pending |
| B03 | Dispute and refund customer | Admin ruling creates only customer credit | Automated local; browser pending |
| B04 | Dispute and pay provider | Admin ruling creates only provider credit | Automated local; browser pending |
| B05 | Funded but overdue, no delivery | Customer refund allowed only after deadline | Automated local |
| S01 | Stranger performs participant operations | Revert without state/credit change | Automated local |
| S02 | Self-register admin, re-register, rebind resolver | All rejected | Automated local |
| S03 | Wrong funding amount, repeated funding and payout | All rejected | Automated local |
| S04 | Reentrant or rejecting withdrawal recipient | No double payout; failed payout preserves credit | Automated local |
| A01 | Valid signature, replay, wrong signer, expired nonce | Only fresh valid signature signs in | Automated Flask tests |
| A02 | Missing Origin, session or CSRF | Write rejected | Automated Flask tests |
| A03 | Immutable metadata round trip and hash | Repeated content keeps same hash; stored bytes match hash | Automated Flask tests |
| A04 | Database persists across service restart | Metadata remains available | Passed on Render / PostgreSQL, 2026-10-12 |
| W01 | MetaMask rejection and wrong network | Clear error, no false successful state | Real MetaMask: pending |
| W02 | Account/network switch and session expiry | Actions require correct reconnection | Real MetaMask: pending |
| W03 | Gas estimate and receipt | Review before signing; confirmed state only after receipt | Real MetaMask: pending |
| D01 | Desktop complete lifecycle on Render | All primary actions work online | Pending |
| D02 | Phone ordinary browser | Layout, scrolling, list/detail readable | Physical phone: pending |
| D03 | Phone MetaMask browser | Connect, execute critical transaction, see confirmed result | Physical phone: pending |

## Bug reporting

Record ID, severity, environment/browser/device, wallet role, order ID, exact steps, expected/actual behavior, screenshot or transaction hash, assignee and retest status. P0 means money/permission fault or blocked main flow; P1 means a required feature or deployment fault; P2 means nonblocking polish. Original reporter retests fixes.

## Submission gate

- All P0 and blocking P1 fixed and retested.
- Three deployed interacting contracts, three roles and documented transaction types.
- Final source/ABI/config all correspond to deployed contracts.
- Render URL, deployment receipts, test results and evidence saved.
- Desktop full acceptance and agreed real-phone coverage completed.
- Technical report 10–15 pages, diagrams, GitHub, user manual, individual contribution report.
- Slides and 10-minute video/live demonstration. YouTube link checked while logged out, or Zoom arrangements confirmed.

The teacher has not explicitly required two full device suites; real mobile checks above are the group's plan for the responsive requirement. Confirm deadline, transaction-type counting and presentation timing with the teacher.
