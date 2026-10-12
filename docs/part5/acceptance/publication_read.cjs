/* Read-only publication check. Six GET checks; no login, writes or transactions. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {isDeepStrictEqual} = require('node:util');
const {execFileSync} = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '..', '..');
const ethers = require(path.join(REPO, 'static/vendor/ethers.umd.min.js'));
const prior = JSON.parse(fs.readFileSync(path.join(ROOT, 'evidence/live-results.json'), 'utf8'));
const deployment = JSON.parse(fs.readFileSync(path.join(REPO, 'deployment.json'), 'utf8'));
const start = new Date().toISOString();
const output = path.resolve(process.env.PART5_OUTPUT_DIR || path.join(os.tmpdir(), 'sc6113-part5'));
const results = [];
const assert = (ok, message) => { if (!ok) throw Error(message); };
async function check(id, endpoint, validate) {
  const row = {id, method:'GET', endpoint, timeUTC:new Date().toISOString()};
  const t = Date.now();
  try {
    const response = await fetch(prior.origin + endpoint, {
      method:'GET', signal:AbortSignal.timeout(55000),
      headers:{'User-Agent':'SC6113-Part5-Publication-Read/1.0'}
    });
    row.http = response.status;
    row.responseMs = Date.now() - t;
    assert(response.status === 200, `Expected HTTP 200; got ${response.status}`);
    const data = await response.json();
    row.observed = validate(data);
    row.status = 'PASS';
  } catch (error) {
    row.status = 'FAIL'; row.error = error.message;
    row.responseMs = Date.now() - t;
  }
  results.push(row);
  console.log(`${id} ${row.status} ${endpoint} (${row.responseMs} ms)`);
}
function content(digest) {
  return data => {
    assert(data.digest === digest, 'Returned digest differs');
    assert(ethers.keccak256(ethers.toUtf8Bytes(data.canonical)) === digest, 'Keccak mismatch');
    assert(isDeepStrictEqual(JSON.parse(data.canonical), data.document), 'Canonical/document mismatch');
    return {digest, canonicalKeccakVerified:true, documentMatchesCanonical:true};
  };
}
async function main() {
  await check('P01', '/health', data => {
    assert(data.status === 'ok' && data.contractsConfigured === true, 'Health/configuration failure');
    return data;
  });
  await check('P02', '/api/config', data => {
    assert(data.chainId === 11155111 && data.configured === true, 'Configured Sepolia expected');
    assert(isDeepStrictEqual(data.addresses, deployment.addresses), 'Address mismatch');
    for (const name of Object.keys(deployment.addresses)) {
      const abi = JSON.parse(fs.readFileSync(path.join(REPO, 'static/contracts', name + '.abi.json'), 'utf8'));
      assert(isDeepStrictEqual(data.abis[name], abi), `ABI mismatch: ${name}`);
    }
    return {chainId:data.chainId, addresses:data.addresses, abisMatchReference:true};
  });
  await check('P03', '/api/orders', data => {
    assert(Array.isArray(data.orders) && data.orders.length <= 50, 'Invalid order page');
    assert(Number.isInteger(data.total) && data.total >= data.orders.length, 'Invalid count');
    assert(BigInt(data.lockedWei) >= 0n && BigInt(data.claimableWei) >= 0n, 'Invalid liabilities');
    return {orderCount:data.total, returnedOrders:data.orders.length, lockedWei:data.lockedWei, claimableWei:data.claimableWei};
  });
  await check('P04', '/api/events', data => {
    assert(Array.isArray(data.events) && data.events.length <= 100, 'Invalid event count');
    assert(Number.isInteger(data.fromBlock) && Number.isInteger(data.toBlock) && data.toBlock >= data.fromBlock && data.toBlock-data.fromBlock <= 999, 'Invalid block window');
    return {eventsCount:data.events.length, fromBlock:data.fromBlock, toBlock:data.toBlock};
  });
  await check('P05', '/api/content/' + prior.priorRestartRecordDigest, content(prior.priorRestartRecordDigest));
  await check('P06', '/api/content/' + prior.qaRecordDigest, content(prior.qaRecordDigest));
  const record = {
    startedAtUTC:start, completedAtUTC:new Date().toISOString(), origin:prior.origin,
    referenceRevision:execFileSync('git', ['rev-parse','HEAD'], {cwd:REPO,encoding:'utf8'}).trim(),
    node:process.version, platform:`${os.platform()} ${os.release()}`, ethers:ethers.version,
    scope:'Six bounded GET checks. No login, metadata write, restart, deployment or blockchain transaction. Does not establish uptime or exact running backend revision.',
    results, summary:{PASS:results.filter(x=>x.status==='PASS').length, FAIL:results.filter(x=>x.status==='FAIL').length}
  };
  fs.mkdirSync(output, {recursive:true});
  const filename = path.join(output, 'publication-read-' + start.replace(/[:.]/g,'-') + '.json');
  fs.writeFileSync(filename, JSON.stringify(record,null,2)+'\n', {flag:'wx'});
  console.log(filename);
  if (record.summary.FAIL) process.exitCode = 1;
}
main().catch(error => { console.error(error.message); process.exitCode=1; });
