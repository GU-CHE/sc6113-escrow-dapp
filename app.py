"""Public testnet escrow UI and authenticated, content-addressed metadata API."""
import json
import os
import re
import secrets
import time
from pathlib import Path
from datetime import timedelta
from urllib.parse import urlsplit

from eth_account import Account
from eth_account.messages import encode_defunct
from flask import Flask, jsonify, render_template, request, session
from sqlalchemy import create_engine, MetaData, Table, Column, String, Text, Integer, select, delete, insert, text
from sqlalchemy.exc import IntegrityError
from web3 import Web3

ROOT = Path(__file__).resolve().parent
STATES = ['Created', 'Accepted', 'Funded', 'Submitted', 'Disputed', 'Released', 'Refunded', 'Cancelled']
HASH = re.compile(r'^0x[0-9a-fA-F]{64}$')


def create_app(overrides=None):
    app = Flask(__name__)
    production = bool(os.getenv('RENDER'))
    origin = os.getenv('APP_ORIGIN', 'http://127.0.0.1:5050').rstrip('/')
    app.config.update(SECRET_KEY=os.getenv('SECRET_KEY') or (None if production else secrets.token_hex(32)),
                      APP_ORIGIN=origin, SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='Lax',
                      SESSION_COOKIE_SECURE=origin.startswith('https://'), PERMANENT_SESSION_LIFETIME=timedelta(hours=2),
                      MAX_CONTENT_LENGTH=16384, DATABASE_URL=os.getenv('DATABASE_URL', 'sqlite:///'+str(ROOT/'instance/escrow.db')),
                      DEPLOYMENT_FILE=os.getenv('DEPLOYMENT_FILE', str(ROOT/'deployment.json')))
    if overrides:
        app.config.update(overrides)
    if not app.config['SECRET_KEY']:
        raise RuntimeError('SECRET_KEY is required on Render')
    if production and (not app.config['APP_ORIGIN'].startswith('https://') or not os.getenv('DATABASE_URL')):
        raise RuntimeError('Set HTTPS APP_ORIGIN and persistent DATABASE_URL on Render')
    (ROOT/'instance').mkdir(exist_ok=True)
    database = app.config['DATABASE_URL']
    if database.startswith('postgres://'):
        database = database.replace('postgres://', 'postgresql+psycopg://', 1)
    elif database.startswith('postgresql://'):
        database = database.replace('postgresql://', 'postgresql+psycopg://', 1)
    engine = create_engine(database, pool_pre_ping=True)
    meta = MetaData()
    challenges = Table('challenges', meta, Column('nonce', String(64), primary_key=True), Column('address', String(42), nullable=False),
                       Column('message', Text, nullable=False), Column('expires', Integer, nullable=False), Column('attempts', Integer, nullable=False))
    contents = Table('contents', meta, Column('digest', String(66), primary_key=True), Column('author', String(42), nullable=False),
                     Column('body', Text, nullable=False), Column('created', Integer, nullable=False))
    meta.create_all(engine)
    app.extensions.update(db=engine, challenges=challenges, contents=contents)
    deployment = json.loads(Path(app.config['DEPLOYMENT_FILE']).read_text())
    if deployment['chainId'] not in (1337, 11155111):
        raise RuntimeError('Only local chain and Sepolia are allowed')
    abis = {name: json.loads((ROOT/f'static/contracts/{name}.abi.json').read_text()) for name in deployment['addresses']}
    configured = all(Web3.is_address(v) for v in deployment['addresses'].values())
    rpc_url = os.getenv('RPC_URL', deployment.get('rpcUrl', 'http://127.0.0.1:8545'))
    w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={'timeout': 12}))
    contracts = {name: w3.eth.contract(address=Web3.to_checksum_address(addr), abi=abis[name]) for name, addr in deployment['addresses'].items()} if configured else {}
    app.extensions.update(chain=w3, contracts=contracts)

    def fail(message, status=400):
        return jsonify(error=message), status

    def body():
        data = request.get_json(silent=True)
        return data if isinstance(data, dict) else {}

    def chain_ready():
        if not configured:
            raise ValueError('Contracts are not deployed yet. Configure deployment.json first.')
        if w3.eth.chain_id != deployment['chainId']:
            raise ValueError('RPC network does not match deployment configuration')

    @app.before_request
    def guard():
        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            if request.headers.get('Origin') != app.config['APP_ORIGIN']:
                return fail('Origin not allowed', 403)
            if not request.is_json:
                return fail('JSON required', 415)
            if request.path not in ('/api/auth/challenge', '/api/auth/verify'):
                if not session.get('address'):
                    return fail('Sign in with your wallet first', 401)
                csrf = request.headers.get('X-CSRF-Token', '')
                if not csrf or not secrets.compare_digest(csrf, session.get('csrf', '')):
                    return fail('Invalid CSRF token', 403)

    @app.after_request
    def headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Referrer-Policy'] = 'same-origin'
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https: http://127.0.0.1:8545; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        if request.path.startswith('/api/'):
            response.headers['Cache-Control'] = 'no-store'
        return response

    @app.errorhandler(413)
    def large(_):
        return fail('Request too large', 413)

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/health')
    def health():
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
        return jsonify(status='ok', contractsConfigured=configured)

    @app.route('/api/config')
    def config():
        return jsonify(chainId=deployment['chainId'], network=deployment['network'], addresses=deployment['addresses'],
                       abis=abis, configured=configured, explorer='https://sepolia.etherscan.io' if deployment['chainId']==11155111 else '')

    @app.route('/api/auth/challenge', methods=['POST'])
    def challenge():
        address = body().get('address', '')
        if not isinstance(address, str) or not Web3.is_address(address):
            return fail('Invalid wallet address')
        address = Web3.to_checksum_address(address)
        now = int(time.time())
        nonce = secrets.token_hex(24)
        with engine.begin() as conn:
            conn.execute(delete(challenges).where(challenges.c.expires < now))
            # Bounded outstanding challenges per wallet; failed attempts have a separate limit.
            if len(conn.execute(select(challenges.c.nonce).where(challenges.c.address==address)).fetchall()) >= 5:
                return fail('Too many login requests; wait five minutes', 429)
            message = f"{app.config['APP_ORIGIN']}\nEscrow Desk wallet sign-in\nAddress: {address}\nChain ID: {deployment['chainId']}\nNonce: {nonce}\nExpires: {now+300}\nThis signature only signs you in. It does not authorize a payment."
            conn.execute(insert(challenges).values(nonce=nonce, address=address, message=message, expires=now+300, attempts=0))
        return jsonify(nonce=nonce, message=message)

    @app.route('/api/auth/verify', methods=['POST'])
    def verify():
        data = body()
        nonce, signature = data.get('nonce'), data.get('signature')
        if not isinstance(nonce, str) or len(nonce)>64 or not isinstance(signature, str) or len(signature)>300:
            return fail('Invalid sign-in request')
        now = int(time.time())
        with engine.begin() as conn:
            row = conn.execute(select(challenges).where(challenges.c.nonce==nonce)).mappings().first()
            if not row or row['expires'] < now or row['attempts'] >= 5:
                return fail('Login challenge expired or invalid', 401)
            conn.execute(challenges.update().where(challenges.c.nonce==nonce).values(attempts=challenges.c.attempts+1))
        try:
            recovered = Account.recover_message(encode_defunct(text=row['message']), signature=signature)
        except Exception:
            return fail('Invalid wallet signature', 401)
        if recovered.lower() != row['address'].lower():
            return fail('Signature does not match wallet', 401)
        with engine.begin() as conn:
            result = conn.execute(delete(challenges).where(challenges.c.nonce==nonce, challenges.c.expires>=now))
            if result.rowcount != 1:
                return fail('Challenge already used', 401)
        session.clear()
        session.permanent = True
        session['address'] = recovered
        session['csrf'] = secrets.token_hex(24)
        return jsonify(address=recovered, csrf=session['csrf'])

    @app.route('/api/auth/me')
    def me():
        return jsonify(address=session.get('address'), csrf=session.get('csrf'))

    @app.route('/api/auth/logout', methods=['POST'])
    def logout():
        session.clear()
        return jsonify(ok=True)

    @app.route('/api/content', methods=['POST'])
    def save_content():
        data = body()
        kind, title, description = data.get('kind'), data.get('title'), data.get('description')
        if kind not in ('terms','delivery','dispute','evidence','ruling'):
            return fail('Invalid content kind')
        if not isinstance(title, str) or not 1 <= len(title.strip()) <= 120:
            return fail('Title must contain 1–120 characters')
        if not isinstance(description, str) or not 1 <= len(description.strip()) <= 4000:
            return fail('Description must contain 1–4000 characters')
        document = {'kind':kind,'title':title.strip(),'description':description.strip(),'author':session['address']}
        canonical = json.dumps(document, ensure_ascii=False, sort_keys=True, separators=(',',':'))
        digest = Web3.to_hex(Web3.keccak(text=canonical))
        try:
            with engine.begin() as conn:
                conn.execute(insert(contents).values(digest=digest,author=session['address'],body=canonical,created=int(time.time())))
        except IntegrityError:
            pass
        return jsonify(digest=digest, canonical=canonical)

    @app.route('/api/content/<digest>')
    def content(digest):
        if not HASH.fullmatch(digest):
            return fail('Invalid hash')
        with engine.connect() as conn:
            row = conn.execute(select(contents).where(contents.c.digest==digest.lower())).mappings().first()
        if not row:
            return fail('Metadata not found; on-chain record remains available',404)
        return jsonify(digest=row['digest'], canonical=row['body'], document=json.loads(row['body']))

    @app.route('/api/orders')
    def list_orders():
        try:
            chain_ready()
            contract = contracts['EscrowOrders']
            count = contract.functions.orderCount().call()
            # Bounded newest-first window. Older orders remain accessible by ID.
            start = min(max(int(request.args.get('before', count+1)),1),count+1)
            result = []
            for i in range(start-1,max(start-51,0),-1):
                o = contract.functions.getOrder(i).call()
                result.append(dict(id=i, customer=o[0],provider=o[1],amountWei=str(o[2]),deadline=o[3],state=STATES[o[4]],termsHash=Web3.to_hex(o[5]),deliveryHash=Web3.to_hex(o[6])))
            return jsonify(orders=result,total=count,nextBefore=result[-1]['id'] if result and result[-1]['id']>1 else None,
                           lockedWei=str(contract.functions.lockedTotal().call()),claimableWei=str(contract.functions.claimableTotal().call()))
        except ValueError as exc:
            return fail(str(exc),503)
        except Exception:
            app.logger.exception('Order read failed')
            return fail('Blockchain temporarily unavailable; retry later',503)

    @app.route('/api/events')
    def events():
        try:
            chain_ready()
            latest = w3.eth.block_number
            first = max(int(deployment.get('startBlock',0)), latest-999)
            logs = w3.eth.get_logs({'fromBlock':first,'toBlock':latest,'address':list(deployment['addresses'].values())})
            items=[]
            for entry in logs:
                for name, contract in contracts.items():
                    if contract.address.lower()!=entry['address'].lower():
                        continue
                    for abi in abis[name]:
                        if abi.get('type')!='event':
                            continue
                        try:
                            decoded = getattr(contract.events,abi['name'])().process_log(entry)
                            args={k:Web3.to_hex(v) if isinstance(v,bytes) else v for k,v in decoded['args'].items()}
                            items.append(dict(contract=name,event=abi['name'],args=args,block=entry['blockNumber'],txHash=Web3.to_hex(entry['transactionHash']),logIndex=entry['logIndex']))
                            break
                        except Exception:
                            continue
            return jsonify(events=items[-100:][::-1],fromBlock=first,toBlock=latest,limit=100)
        except Exception:
            app.logger.exception('Event read failed')
            return fail('Event history unavailable; retry later',503)

    return app


app = create_app()
if __name__ == '__main__':
    app.run(host='127.0.0.1',port=int(os.getenv('PORT','5050')),debug=False)
