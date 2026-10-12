# Escrow Desk

SC6113 group project prototype: a single-delivery freelance escrow DApp using three interacting Solidity contracts, MetaMask, Flask, a persistent database, and a responsive HTML/CSS/JavaScript interface.

**Online preview:** https://sc6113-escrow-dapp.onrender.com

**Status (2026-10-12):** the Flask interface is deployed on Render with PostgreSQL. GitHub Actions passes 11 contract tests and 7 API tests. Cloud login, metadata storage and persistence after a service restart passed. The three Sepolia contracts and resolver binding are deployed: all four receipts succeeded, creation bytecodes match this repository, and contract bindings and the fixed administrator were checked through RPC. Public addresses are saved in `deployment.json`; receipts are in [Sepolia verification](docs/SEPOLIA_VERIFICATION.json). Real MetaMask business lifecycle and real mobile acceptance remain pending. Use test ETH only. See [Chinese handover](docs/HANDOVER_ZH.md).

## Quick start

Python 3.11 and Node.js 22 are recommended. No frontend build is required; ethers 6.15.0 is vendored with its MIT license.

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm install
npm run compile
npm test
python -m unittest discover -s tests -p 'test_*.py' -v
python app.py
```

Open http://127.0.0.1:5050. Without deployed contracts, the application displays its setup state.

### Local blockchain

In a separate terminal:

```sh
npm run chain
```

Then launch Flask with:

```sh
DEPLOYMENT_FILE=.local/deployment.json python app.py
```

Configure a **disposable** MetaMask environment with RPC `http://127.0.0.1:18545`, chain ID `1337`, currency `ETH`. Ganache deterministic wallets are publicly known and must never receive real assets. For local automated integration testing, use `npm run test:integration` while this local chain is running; this uses Ganache's unlocked test accounts, not user keys. Real device testing should use Sepolia and an HTTPS deployment.

## Sepolia and Render deployment

1. Push this repository to GitHub and connect it to Render.
2. Create a Python Web Service using `render.yaml`, or manually use build `pip install -r requirements.txt` and start `gunicorn --workers 1 --threads 4 --timeout 120 app:app`.
3. Set `SECRET_KEY` to a strong random value, `APP_ORIGIN` to the exact HTTPS service origin (no trailing slash), `RPC_URL` to a Sepolia HTTP RPC, and `DATABASE_URL` to a persistent PostgreSQL URL. Set `DATABASE_SCHEMA=sc6113_escrow_group` to keep this project's tables separate when sharing a database. The database user must be allowed to create this schema. Render's temporary filesystem is not a persistent production database. `postgres://` and `postgresql://` URLs are converted to the psycopg driver automatically.
4. Open the app's administrator deployment setup in a MetaMask-enabled browser, select Sepolia, and deploy. The selected wallet becomes the fixed administrator. The four transactions deploy RoleRegistry, EscrowOrders, DisputeResolver, then bind the resolver.
5. Download the resulting public `deployment.json`, replace the repository file, and redeploy. No private keys or secret RPC URL belong in this file.
6. Confirm `/health`, `/api/config`, and a full order lifecycle using separate customer and provider wallets. Save transaction hashes and deployment receipts in the submission evidence.

Contract deployments may also be performed in Remix, in the same order and with the same constructor arguments. Compile using Solidity 0.8.30, optimizer 200, EVM Shanghai. The API loads the ABIs in `static/contracts/`; regenerate them after any contract change and redeploy all three contracts together.

## Architecture and transaction types

- `RoleRegistry`: fixed admin; one-time customer/provider registration. Business roles cannot self-promote to admin.
- `EscrowOrders`: accepted orders, exact-value funding, delivery hash, approval, unfunded cancellation, expired undelivered refund, pull withdrawals and accounting totals.
- `DisputeResolver`: participant-only disputes/evidence, admin-only final full refund or full provider payment. It calls EscrowOrders; both contracts use the shared registry.
- Flask: nonce-based wallet sign-in, content-addressed immutable metadata, chain-derived order reads and decoded event history.
- Database: public metadata and single-use expiring login challenges. Critical ownership, state and money remain on chain.

The UI supports 12 business state-changing transaction types: register, create, accept, fund, submit, approve, cancel, refundExpired, openDispute, addEvidence, resolve, withdraw. Administrative `setResolver` is not needed for this count. Read calls, wallet connections and login signatures are not counted.

See [acceptance plan](docs/ACCEPTANCE.md), [architecture](docs/ARCHITECTURE.md), [user guide](docs/USER_GUIDE.md), and [limitations](docs/LIMITATIONS.md). These are implementation documents; the final 10–15 page course report, original problem evidence, individual contributions, slides and video still need the group's work.

## API

- `GET /health`: database health and whether deployment addresses are configured. This does **not** certify chain connectivity.
- `GET /api/config`: chain, public addresses and ABIs. RPC secrets are not returned.
- `POST /api/auth/challenge`: `{address}` → nonce and domain/chain-bound message, valid for five minutes.
- `POST /api/auth/verify`: `{nonce,signature}` → HttpOnly session and CSRF token. Challenges are consumed once.
- `GET /api/auth/me`, `POST /api/auth/logout`.
- `POST /api/content`: `{kind,title,description}` → server-canonicalized JSON and Keccak digest. Requires signed login, exact Origin and CSRF header.
- `GET /api/content/<digest>`: public immutable metadata; browser verifies its hash.
- `GET /api/orders?before=<id>`: up to 50 chain-derived orders, descending, with a next-page cursor and global totals.
- `GET /api/events`: latest 100 decoded events within the latest 1,000 blocks, bounded to avoid unbounded RPC work. Older transactions remain on the explorer.

## Security and scope

No wallet keys are requested by the application or stored by Flask. Withdrawals zero credits before external calls and reject re-entry. Wallet transaction signing is separate from wallet login signing. Funds cannot be cancelled after funding; undelivered overdue orders support customer refunds. Submitted work requires customer approval or human arbitration. A single fixed arbitrator is a trust assumption, and metadata availability depends on the database.

This is a course prototype without independent security audit, production abuse protection, or commercial/regulatory readiness. Local test success does not establish production safety. See `docs/LIMITATIONS.md` for exact remaining verification work.
