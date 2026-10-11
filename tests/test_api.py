import tempfile
import unittest
from pathlib import Path
from eth_account import Account
from eth_account.messages import encode_defunct
from sqlalchemy import update
from app import create_app

ORIGIN='http://127.0.0.1:5050'
class ApiTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.app=create_app({'TESTING':True,'SECRET_KEY':'test-only','DATABASE_URL':'sqlite:///'+str(Path(self.tmp.name)/'test.db')})
        self.client=self.app.test_client()
        self.wallet=Account.create()
    def tearDown(self):
        self.app.extensions['db'].dispose()
        self.tmp.cleanup()
    def post(self,path,data,csrf=None):
        h={'Origin':ORIGIN}
        if csrf:h['X-CSRF-Token']=csrf
        return self.client.post(path,json=data,headers=h)
    def login(self):
        c=self.post('/api/auth/challenge',{'address':self.wallet.address}).get_json()
        sig=Account.sign_message(encode_defunct(text=c['message']),self.wallet.key).signature.hex()
        r=self.post('/api/auth/verify',{'nonce':c['nonce'],'signature':sig})
        self.assertEqual(r.status_code,200)
        return r.get_json(),c,sig
    def test_signin_replay_logout(self):
        user,c,sig=self.login()
        self.assertEqual(user['address'],self.wallet.address)
        self.assertEqual(self.post('/api/auth/verify',{'nonce':c['nonce'],'signature':sig}).status_code,401)
        self.assertEqual(self.client.get('/api/auth/me').get_json()['address'],self.wallet.address)
        self.assertEqual(self.post('/api/auth/logout',{},user['csrf']).status_code,200)
        self.assertIsNone(self.client.get('/api/auth/me').get_json()['address'])
    def test_wrong_signature_and_expiration(self):
        c=self.post('/api/auth/challenge',{'address':self.wallet.address}).get_json()
        sig=Account.sign_message(encode_defunct(text=c['message']),Account.create().key).signature.hex()
        self.assertEqual(self.post('/api/auth/verify',{'nonce':c['nonce'],'signature':sig}).status_code,401)
        t=self.app.extensions['challenges']
        with self.app.extensions['db'].begin() as conn:conn.execute(update(t).values(expires=0))
        sig=Account.sign_message(encode_defunct(text=c['message']),self.wallet.key).signature.hex()
        self.assertEqual(self.post('/api/auth/verify',{'nonce':c['nonce'],'signature':sig}).status_code,401)
    def test_origin_auth_csrf(self):
        self.assertEqual(self.client.post('/api/auth/challenge',json={'address':self.wallet.address}).status_code,403)
        self.assertEqual(self.post('/api/content',{}).status_code,401)
        user,_,_=self.login()
        self.assertEqual(self.post('/api/content',{}).status_code,403)
        self.assertEqual(self.post('/api/content',{},user['csrf']).status_code,400)
    def test_immutable_content_persists(self):
        user,_,_=self.login()
        data={'kind':'terms','title':'Logo','description':'Deliver one logo'}
        result=self.post('/api/content',data,user['csrf']).get_json()
        self.assertEqual(len(result['digest']),66)
        self.assertEqual(self.post('/api/content',data,user['csrf']).get_json()['digest'],result['digest'])
        second=self.app.test_client()
        stored=second.get('/api/content/'+result['digest']).get_json()
        self.assertEqual(stored['canonical'],result['canonical'])
        from web3 import Web3
        self.assertEqual(Web3.to_hex(Web3.keccak(text=stored['canonical'])),result['digest'])
        self.assertEqual(stored['document']['author'],self.wallet.address)
    def test_input_limits_and_unconfigured_chain(self):
        self.assertEqual(self.post('/api/auth/challenge',{'address':'fake'}).status_code,400)
        self.assertEqual(self.client.get('/api/orders').status_code,503)
        self.assertFalse(self.client.get('/api/config').get_json()['configured'])
        self.assertEqual(self.client.get('/api/content/invalid').status_code,400)
        user,_,_=self.login()
        self.assertEqual(self.post('/api/content',{'kind':'terms','title':'X','description':'x'*4001},user['csrf']).status_code,400)
    def test_challenge_limit(self):
        for _ in range(5):self.assertEqual(self.post('/api/auth/challenge',{'address':self.wallet.address}).status_code,200)
        self.assertEqual(self.post('/api/auth/challenge',{'address':self.wallet.address}).status_code,429)
    def test_shared_database_schema_rejects_unsafe_targets(self):
        for schema in ('public', 'pg_catalog', 'x;drop schema public', 'UPPERCASE'):
            with self.assertRaisesRegex(RuntimeError, 'dedicated lowercase'):
                create_app({'DATABASE_URL':'sqlite:///:memory:', 'DATABASE_SCHEMA':schema})
        with self.assertRaisesRegex(RuntimeError, 'only with PostgreSQL'):
            create_app({'DATABASE_URL':'sqlite:///:memory:', 'DATABASE_SCHEMA':'sc6113_escrow_group'})
if __name__=='__main__':unittest.main()
