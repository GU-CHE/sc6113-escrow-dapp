"""Cloud metadata smoke test. Creates no blockchain transactions and never prints keys/cookies.

Run with --write to save one clearly labeled public QA metadata record.
Run with --digest HASH after restarting the Render service to verify persistence.
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import requests
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3

ORIGIN = 'https://sc6113-escrow-dapp.onrender.com'
parser = argparse.ArgumentParser()
parser.add_argument('--write', action='store_true')
parser.add_argument('--digest')
args = parser.parse_args()
session = requests.Session()

def get(path):
    r = session.get(ORIGIN+path, timeout=60)
    r.raise_for_status()
    return r

def post(path, data, csrf=None):
    headers = {'Origin': ORIGIN}
    if csrf:
        headers['X-CSRF-Token'] = csrf
    return session.post(ORIGIN+path, json=data, headers=headers, timeout=30)

health = get('/health').json()
assert health['status'] == 'ok'
config = get('/api/config').json()
assert config['chainId'] == 11155111
page = get('/')
assert 'Escrow Desk' in page.text
assert "frame-ancestors 'none'" in page.headers['Content-Security-Policy']
for path in ('/static/app.js', '/static/styles.css', '/static/contracts/RoleRegistry.deploy.json'):
    get(path)
result = {'timeUTC':datetime.now(timezone.utc).isoformat(), 'origin':ORIGIN,
          'health':health, 'assets':'passed', 'chainId':config['chainId']}
if args.write:
    assert post('/api/content',{}).status_code == 401
    wallet = Account.create()  # Disposable, unfunded identity for message signing only.
    challenge = post('/api/auth/challenge', {'address':wallet.address}).json()
    assert challenge['message'].startswith(ORIGIN+'\n')
    signature = Account.sign_message(encode_defunct(text=challenge['message']),wallet.key).signature.hex()
    signed = post('/api/auth/verify', {'nonce':challenge['nonce'],'signature':signature})
    signed.raise_for_status()
    cookie = signed.headers['Set-Cookie']
    assert 'Secure' in cookie and 'HttpOnly' in cookie and 'SameSite=Lax' in cookie
    csrf = signed.json()['csrf']
    assert post('/api/auth/verify', {'nonce':challenge['nonce'],'signature':signature}).status_code == 401
    assert post('/api/content',{}).status_code == 403
    record = post('/api/content', {'kind':'terms','title':'QA cloud persistence check',
        'description':'Public automated QA metadata only. No service order, funds, or blockchain transaction.'},csrf)
    record.raise_for_status()
    args.digest = record.json()['digest']
    assert post('/api/auth/logout', {},csrf).status_code == 200
    result['authentication'] = 'signature, replay rejection, CSRF and cookie flags passed'
if args.digest:
    stored = get('/api/content/'+args.digest).json()
    assert Web3.to_hex(Web3.keccak(text=stored['canonical'])) == args.digest
    result.update(digest=args.digest, metadataHashVerified=True)
Path('.local').mkdir(exist_ok=True)
Path('.local/cloud-smoke.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(result, indent=2))
