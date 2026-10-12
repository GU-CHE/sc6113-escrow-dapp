/* Part 5: bounded live API acceptance. No blockchain transactions.
   Disposable unfunded signing keys, cookies, nonces and CSRF remain in memory. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {isDeepStrictEqual} = require('node:util');
const {createHash} = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.resolve(ROOT, '..', '..');
const ethers = require(path.join(SOURCE, 'static', 'vendor', 'ethers.umd.min.js'));
const ORIGIN = 'https://sc6113-escrow-dapp.onrender.com';
const REVISION = require('node:child_process').execFileSync('git', ['rev-parse', 'HEAD'], {cwd:SOURCE, encoding:'utf8'}).trim();
const OUTPUT = path.resolve(process.env.PART5_OUTPUT_DIR || path.join(os.tmpdir(), 'sc6113-part5', new Date().toISOString().replace(/[:.]/g,'-')));
fs.mkdirSync(OUTPUT, {recursive:true});
const rows = [], jar = new Map();
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'));
function assert(ok, message) { if (!ok) throw new Error(message); }
async function request(method, endpoint, data, options={}) {
  const headers = {'User-Agent':'SC6113-Part5-Acceptance/1.0'};
  if(options.origin !== null) headers.Origin = options.origin || ORIGIN;
  if(jar.size) headers.Cookie = [...jar].map(([k,v])=>`${k}=${v}`).join('; ');
  if(options.csrf !== undefined) headers['X-CSRF-Token'] = options.csrf;
  let body;
  if(options.raw !== undefined) { body=options.raw; headers['Content-Type']='text/plain'; }
  else if(data !== undefined) { body=JSON.stringify(data); headers['Content-Type']='application/json'; }
  const start=Date.now();
  const r=await fetch(ORIGIN+endpoint,{method,headers,body,signal:AbortSignal.timeout(55000)});
  const bytes=Buffer.from(await r.arrayBuffer());
  const text=bytes.toString('utf8');
  for(const cookie of r.headers.getSetCookie()) {
    const first=cookie.split(';')[0], split=first.indexOf('=');
    if(split>0) {
      const key=first.slice(0,split), value=first.slice(split+1);
      if(!value || /Max-Age=0/i.test(cookie)) jar.delete(key); else jar.set(key,value);
    }
  }
  let json; try{json=JSON.parse(text);}catch{}
  return {status:r.status,headers:r.headers,bytes,text,json,ms:Date.now()-start};
}
function expectStatus(r, code) {
  assert(r.status===code,`Expected HTTP ${code}, got ${r.status}: ${r.text.slice(0,180)}`);
  return {http:r.status,responseMs:r.ms};
}
function expectError(r, code) {
  const out=expectStatus(r,code);
  assert(r.headers.get('content-type')?.startsWith('application/json'),'Error should use JSON');
  assert(typeof r.json?.error==='string','Missing error message');
  return {...out,error:r.json.error};
}
async function check(id,title,expected,fn) {
  const row={id,title,expected,timeUTC:new Date().toISOString()}; const t=Date.now();
  try{row.observed=await fn();row.status='PASS';}
  catch(e){row.observed=e.message;row.status='FAIL';}
  row.elapsedMs=Date.now()-t;rows.push(row);console.log(`${id} ${row.status} ${title}`);
  return row;
}
async function hashRead(digest) {
  const r=await request('GET','/api/content/'+digest);expectStatus(r,200);
  assert(ethers.keccak256(ethers.toUtf8Bytes(r.json.canonical))===digest,'Keccak mismatch');
  assert(r.json.digest===digest,'Returned digest mismatch');
  assert(isDeepStrictEqual(JSON.parse(r.json.canonical),r.json.document),'Canonical JSON differs');
  return {digest,hashVerified:true,responseMs:r.ms};
}
async function health(){const r=await request('GET','/health');expectStatus(r,200);assert(r.json.status==='ok'&&r.json.contractsConfigured===true,'Health/configuration failure');return {...r.json,responseMs:r.ms};}
async function config(){
  const r=await request('GET','/api/config');expectStatus(r,200);const b=r.json;
  const local=readJSON(path.join(SOURCE,'deployment.json'));
  assert(b.chainId===11155111&&b.configured===true,'Expected configured Sepolia');
  for(const [name,addr] of Object.entries(local.addresses)){
    assert(b.addresses[name]===addr,`Address mismatch: ${name}`);
    const abi=readJSON(path.join(SOURCE,'static','contracts',`${name}.abi.json`));
    assert(isDeepStrictEqual(b.abis[name],abi),`ABI mismatch: ${name}`);
  }
  assert(!['rpcUrl','DATABASE_URL','SECRET_KEY','RPC_URL'].some(k=>k in b),'Private configuration exposed');
  return {chainId:b.chainId,addresses:b.addresses,abisMatchSnapshot:true,privateConfigurationAbsent:true};
}
async function assets(){
  const assetSHA256={};
  for(const p of ['static/app.js','static/styles.css']){
    const r=await request('GET','/'+p);expectStatus(r,200);
    assert(r.bytes.equals(fs.readFileSync(path.join(SOURCE,p))),`Asset mismatch: ${p}`);
    assetSHA256[p]=createHash('sha256').update(r.bytes).digest('hex');
  }
  const r=await request('GET','/');expectStatus(r,200);
  assert(r.text.includes('Escrow Desk'),'Missing application title');
  const csp=r.headers.get('content-security-policy')||'';
  assert(csp.includes("frame-ancestors 'none'")&&csp.includes("script-src 'self'"),'CSP missing');
  assert(r.headers.get('x-content-type-options')==='nosniff','nosniff missing');
  return {assetSHA256,CSP:csp,nosniff:true};
}
async function orders(){
  const r=await request('GET','/api/orders');expectStatus(r,200);const b=r.json;
  assert(Array.isArray(b.orders)&&b.orders.length<=50,'Invalid order page');
  assert(Number.isInteger(b.total)&&b.total>=b.orders.length,'Invalid count');
  assert(BigInt(b.lockedWei)>=0n&&BigInt(b.claimableWei)>=0n,'Invalid liabilities');
  assert(r.headers.get('cache-control')==='no-store','API response may be cached');
  return {orderCount:b.total,lockedWei:b.lockedWei,claimableWei:b.claimableWei,
    orderStates:Object.fromEntries(b.orders.map(x=>[x.id,x.state])),responseMs:r.ms};
}
async function events(){
  const r=await request('GET','/api/events');expectStatus(r,200);const b=r.json;
  assert(b.events.length<=100&&b.toBlock-b.fromBlock<=999,'Event bounds exceeded');
  assert(b.events.every(x=>/^0x[0-9a-f]{64}$/i.test(x.txHash)),'Invalid transaction hash');
  return {eventsCount:b.events.length,fromBlock:b.fromBlock,toBlock:b.toBlock,responseMs:r.ms};
}
async function main(){
  const verifyIndex=process.argv.indexOf('--verify-digest');
  if(verifyIndex>=0){
    const digest=process.argv[verifyIndex+1];
    await check('R01','Saved QA record digest verification','Same canonical content and digest',()=>hashRead(digest));
    const output={timeUTC:new Date().toISOString(),origin:ORIGIN,
      scope:'Read-only. Actual restart must be supported by a separate operator event.',results:rows};
    fs.writeFileSync(path.join(OUTPUT,'digest-read-results.json'),JSON.stringify(output,null,2), {flag:'wx'});
    if(rows.some(r=>r.status==='FAIL')) process.exitCode=1;
    console.log('Evidence: '+OUTPUT); return;
  }
  if (!process.argv.includes('--live-write')) throw new Error('Full acceptance creates one public QA record. Use --live-write only for an authorized missing-case rerun; use publication_read.cjs for read-only checks.');
  await check('D01','HTTPS service and database health','HTTP 200 and configured contracts',health);
  await check('D02','Public deployment configuration and ABI','Sepolia addresses and ABI match snapshot',config);
  await check('D03','Published assets and response protection','Source assets, CSP, nosniff',assets);
  await check('D04','Live chain-derived order read','Valid bounded data',orders);
  await check('D05','Live decoded event read','At most 100 events over 1,000 blocks',events);
  const legacy=readJSON(path.join(SOURCE,'docs','CLOUD_VERIFICATION.json')).digest;
  await check('D06','Prior restart QA record remains readable','Known record hash remains valid',()=>hashRead(legacy));
  await check('A01','Missing Origin','JSON 403',async()=>expectError(await request('POST','/api/auth/challenge',{address:'invalid'},{origin:null}),403));
  await check('A02','Foreign Origin','JSON 403',async()=>expectError(await request('POST','/api/auth/challenge',{address:'invalid'},{origin:'https://example.invalid'}),403));
  await check('A03','Malformed wallet address','JSON 400',async()=>expectError(await request('POST','/api/auth/challenge',{address:'invalid'}),400));
  await check('A04','Unauthenticated metadata write','JSON 401',async()=>expectError(await request('POST','/api/content',{}),401));
  await check('A05','Non-JSON write','JSON 415',async()=>expectError(await request('POST','/api/auth/challenge',undefined,{raw:'not-json'}),415));
  const wallet=ethers.Wallet.createRandom(), other=ethers.Wallet.createRandom();
  let challenge,signature,csrf,digest;
  await check('A06','Login challenge binding','Origin, address, Sepolia and expiry',async()=>{
    const r=await request('POST','/api/auth/challenge',{address:wallet.address});expectStatus(r,200);challenge=r.json;
    assert(challenge.message.startsWith(ORIGIN+'\n')&&challenge.message.includes(wallet.address)&&challenge.message.includes('Chain ID: 11155111')&&challenge.message.includes('Expires:'),'Challenge binding mismatch');
    return {originAndChainBound:true,address:wallet.address};
  });
  if(challenge){
    const bad=await other.signMessage(challenge.message);signature=await wallet.signMessage(challenge.message);
    await check('A07','Wrong signer rejected','JSON 401',async()=>expectError(await request('POST','/api/auth/verify',{nonce:challenge.nonce,signature:bad}),401));
    await check('A08','Valid signed login and session protection','HTTP 200 and secure cookie flags',async()=>{
      const r=await request('POST','/api/auth/verify',{nonce:challenge.nonce,signature});expectStatus(r,200);csrf=r.json.csrf;
      assert(r.json.address===wallet.address,'Wrong authenticated wallet');
      const cookie=r.headers.getSetCookie().join(';');
      assert(['Secure','HttpOnly','SameSite=Lax'].every(x=>cookie.includes(x)),'Missing cookie flag');
      return {http:200,address:wallet.address,Secure:true,HttpOnly:true,SameSite:'Lax'};
    });
    await check('A09','Login signature replay rejected','JSON 401',async()=>expectError(await request('POST','/api/auth/verify',{nonce:challenge.nonce,signature}),401));
  }
  if(csrf){
    await check('A10','Session identifies verified wallet','Same authenticated identity',async()=>{const r=await request('GET','/api/auth/me');expectStatus(r,200);assert(r.json.address===wallet.address&&r.json.csrf===csrf,'Session mismatch');return {address:r.json.address,sessionRecognized:true};});
    await check('A11','Missing CSRF rejected','JSON 403',async()=>expectError(await request('POST','/api/content',{}),403));
    await check('A12','Wrong CSRF rejected','JSON 403',async()=>expectError(await request('POST','/api/content',{},{csrf:'invalid'}),403));
    await check('A13','Authenticated malformed body rejected','JSON 400',async()=>expectError(await request('POST','/api/content',{},{csrf}),400));
    await check('A14','Oversized description rejected','JSON 400',async()=>expectError(await request('POST','/api/content',{kind:'terms',title:'QA',description:'x'.repeat(4001)},{csrf}),400));
    // Unicode hash fixture, escaped without changing the original test bytes.
    const data={kind:'terms',title:'QA Part 5 backend persistence acceptance',description:'Public QA metadata only. No service order, payment, personal data, or blockchain transaction. \u5185\u5bb9\u54c8\u5e0c\u9a8c\u8bc1 \u00b7 \ubc31\uc5d4\ub4dc \uac80\uc218.'};
    await check('H01','Canonical Unicode metadata and Keccak integrity','Hash and verified author match',async()=>{
      const r=await request('POST','/api/content',data,{csrf});expectStatus(r,200);digest=r.json.digest;
      assert(ethers.keccak256(ethers.toUtf8Bytes(r.json.canonical))===digest,'Keccak mismatch');
      assert(JSON.parse(r.json.canonical).author===wallet.address,'Author not bound to session');
      return {digest,unicodeHashVerified:true,authorBoundToVerifiedSession:true};
    });
    if(digest){
      await check('H02','Repeated content is idempotent','Same digest',async()=>{const r=await request('POST','/api/content',data,{csrf});expectStatus(r,200);assert(r.json.digest===digest,'Digest changed');return {digest,sameContentSameDigest:true};});
      await check('H03','Public metadata read and integrity','Exact hash and JSON match',()=>hashRead(digest));
    }
    await check('H04','Malformed digest rejected','JSON 400',async()=>expectError(await request('GET','/api/content/not-a-hash'),400));
    await check('H05','Unknown digest handled','JSON 404',async()=>expectError(await request('GET','/api/content/0x'+'0'.repeat(64)),404));
    await check('A15','Logout succeeds','HTTP 200',async()=>expectStatus(await request('POST','/api/auth/logout',{},{csrf}),200));
    await check('A16','Logout clears session','No identity or CSRF',async()=>{const r=await request('GET','/api/auth/me');expectStatus(r,200);assert(r.json.address===null&&r.json.csrf===null,'Session persists');return {signedOut:true};});
    await check('A17','Old CSRF cannot write after logout','JSON 401',async()=>expectError(await request('POST','/api/content',data,{csrf}),401));
  }
  await check('E01','Invalid pagination is a client error','JSON HTTP 400 for before=invalid',async()=>expectError(await request('GET','/api/orders?before=invalid'),400));
  await check('D07','Service healthy after bounded acceptance','HTTP 200',health);
  const result={timeUTC:new Date().toISOString(),origin:ORIGIN,sourceRevision:REVISION,node:process.version,platform:`${os.platform()} ${os.release()}`,ethers:ethers.version,
    scope:'Live HTTP. Unfunded disposable signature. No blockchain transaction. One public QA metadata record.',
    qaRecordDigest:digest||null,priorRestartRecordDigest:legacy,results:rows,
    summary:{PASS:rows.filter(x=>x.status==='PASS').length,FAIL:rows.filter(x=>x.status==='FAIL').length}};
  fs.writeFileSync(path.join(OUTPUT,'live-results.json'),JSON.stringify(result,null,2), {flag:'wx'});
  if(result.summary.FAIL) process.exitCode=1;
  console.log('Evidence: '+OUTPUT);
  console.log(JSON.stringify(result.summary));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
