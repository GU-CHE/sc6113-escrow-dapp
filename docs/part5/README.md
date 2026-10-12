# Part 5: Backend and Deployment Acceptance

This contribution covers API authentication, request protection, content integrity, persistence and deployment evidence for the SC6113 group escrow DApp. It is separate from Individual Assignment 2. Application code and other members' documents are unchanged.

## Results and reading order

The original live run on 12 October 2026 at 19:19 Singapore time recorded **29 PASS and one FAIL across 30 checks**. P5-001 was the proposed P2 finding: malformed pagination returned HTTP 503 instead of the expected controlled HTTP 400. On 13 October 2026 at 00:19-00:20 Singapore time, fourteen independent post-fix GET checks passed; P5-001 is now **RETEST PASS / CLOSED in Part 5**. See the [retest and closure record](evidence/RETEST_EN.md). Three later short availability samples passed. New publication observations are separately dated and do not replace these results.

1. [Acceptance report](acceptance/BACKEND_ACCEPTANCE_EN.md) and [PDF](output/pdf/Part5_Backend_Deployment_Acceptance_EN.pdf).
2. [Coverage and evidence matrix](evidence/COVERAGE_EN.md), including the shared A01-A04 case mapping.
3. [Deployment and persistence record](evidence/DEPLOYMENT_EN.md).
4. [Defect handoff](evidence/DEFECT_HANDOFF_EN.md).
5. [Report integration section](acceptance/REPORT_SECTION_EN.md) and [contribution statement](CONTRIBUTION_EN.md).

The existing team restart is reused with attribution. No new restart, deployment or blockchain transaction was performed for this publication. Deployment identity is now supported by the owner-supplied Render record and screenshot, attributed in the retest record. Public HTTP responses alone do not attest the exact running backend commit.

## Current retest reproduction

```sh
node docs/part5/acceptance/retest_p5_001.cjs
```

This runs fourteen read-only checks and saves a fresh dated JSON in the operating system's temporary directory. PART5_OUTPUT_DIR selects another output directory. It records malformed and valid pagination, health before/after and two existing content digests; it does not sign in or write application data. All authored Part 5 prose, filenames, helpers and publication text are English. Existing multilingual fixture semantics and raw historical evidence are preserved.

## Earlier reproduction helpers

Use Node.js 22 or later from the repository root. The historical live run used Node.js 24.19.0 and the repository's vendored ethers 6.15.0. No npm installation is needed for these helpers.

```sh
node docs/part5/acceptance/publication_read.cjs
```

This historical publication helper performs six bounded GET checks: health, public configuration/ABIs, orders, events and two existing content digests. It saves a dated result in the operating system's temporary directory. Set PART5_OUTPUT_DIR to an empty output directory to keep a run elsewhere. The helper creates a new file and refuses to overwrite one.

```sh
node docs/part5/acceptance/part5_live.cjs --verify-digest 0x064677800197721a97440bcca0e89acd5efc1a7dce2783ac732395f670064c3c
```

This verifies a normal content read. It proves a new restart only when accompanied by a separately recorded operator restart event. `part5_stability.cjs` optionally takes three health/content samples 20 seconds apart; it does not establish long-term uptime.

The full historical live test is retained for a necessary future rerun:

```sh
node docs/part5/acceptance/part5_live.cjs --live-write
```

Unlike the default read-only helper, this explicitly selected mode signs in with an ephemeral unfunded account and creates one public QA metadata record. Use it only when a changed implementation or uncovered requirement justifies a new write. It sends no blockchain transaction. Keys, authentication material and cookies remain in memory. New outputs go to a fresh temporary directory by default; original evidence is never overwritten. A failing case gives a nonzero exit code. The original pagination failure is preserved; the separate post-fix retest now passes.

The adapted helpers use the checkout's current deployment configuration and vendored library. Their new execution records identify the checked-out revision. They do not retroactively describe the exact script bytes used for the historical run.

## PDF and evidence maintenance

The PDF is generated from the acceptance Markdown with Python, ReportLab and pypdf:

```sh
python docs/part5/acceptance/build_report.py
```

Render and inspect the generated pages after content changes. These are document-generation dependencies, not additions to the application's requirements.

[Original evidence manifest](evidence/original-evidence-manifest.json) records the byte lengths and SHA-256 hashes of seven preserved files. [Original file manifest](evidence/file-manifest.json) inventories the historical PR #2 payload at commit 368d2385, not the revised documents. The [current retest manifest](evidence/file-manifest-retest-2026-10-13.json) inventories the updated payload, excluding itself. The original package-validation.json is also historical; [new retest validation](evidence/retest-package-validation-2026-10-13.json) covers this update. [Repository baseline](evidence/repository-baseline.json) records the source revision, clean isolated checkout and unchanged reference blobs.

Shared repository source, vendor assets and historical deployment files are linked rather than copied. The earlier portable ZIP is not the GitHub payload.

The scoped `.gitattributes` disables line-ending conversion only within this Part 5 directory, preserving evidence and manifest byte hashes across platforms.

## Boundaries and remaining inputs

Member 1 owns implementation fixes, Render operations and current deployment confirmation. Part 5 owns defect reproduction and retesting. Member 6 integrates the report and shared defect register. No reviewer request or teammate message is sent by this contribution.

The owner has provided a deployment identity and screenshot; Part 5 has inspected and attributed them. Direct private Render/API attestation and private database settings remain NOT VERIFIED. The documented shared PostgreSQL schema provides naming separation, not independent credentials or infrastructure. No shared database resources were changed.

[PR #1](https://github.com/GU-CHE/sc6113-escrow-dapp/pull/1) and [PR #2](https://github.com/GU-CHE/sc6113-escrow-dapp/pull/2) are merged. The owner subsequently integrated reviews and supplied the P5-001 fix/deployment evidence. This contribution changes only owned Part 5 files. Gas optimization F8, contract permissions and frontend/device acceptance are outside Part 5's completion claim.
