/* Independent Part 5 retest: fourteen bounded GETs; never writes application data. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '..', '..');
const ethers = require(path.join(REPO, 'static/vendor/ethers.umd.min.js'));
const prior = JSON.parse(fs.readFileSync(path.join(ROOT, 'evidence/live-results.json'), 'utf8'));
const owner = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/review/p5-001-deployment.json'), 'utf8'));
const output = path.resolve(process.env.PART5_OUTPUT_DIR || path.join(os.tmpdir(), 'sc6113-part5'));
const startedAtUTC = new Date().toISOString();
const results = [];

async function check(id, endpoint, expectedHTTP, expectation, validate, keepBody = false) {
  const row = {id, method:'GET', endpoint, expectedHTTP, expectation, timeUTC:new Date().toISOString()};
  const start = Date.now();
  try {
    const response = await fetch(prior.origin + endpoint, {
      method:'GET', redirect:'error', signal:AbortSignal.timeout(55000),
      headers:{'User-Agent':'SC6113-Part5-P5-001-Retest/1.0'}
    });
    row.http = response.status;
    const raw = await response.text();
    row.responseMs = Date.now() - start;
    row.responseSHA256 = createHash('sha256').update(raw).digest('hex');
    row.contentType = response.headers.get('content-type');
    const data = JSON.parse(raw);
    if (keepBody) row.body = data;
    assert.equal(response.status, expectedHTTP, 'Unexpected HTTP status');
    assert.match(row.contentType || '', /application\/json/i, 'Expected JSON content type');
    row.observed = validate(data);
    row.status = 'PASS';
  } catch (error) {
    row.status = row.http === undefined ? 'NOT RUN' : 'FAIL';
    row.error = error.message;
    row.responseMs = Date.now() - start;
  }
  results.push(row);
  console.log(`${id} ${row.status} HTTP ${row.http ?? 'none'} ${endpoint} (${row.responseMs} ms)`);
}
function health(data) {
  assert.equal(data.status, 'ok');
  assert.equal(data.contractsConfigured, true);
  return {databaseReachable:true, contractsConfigured:true};
}
function invalid(data) {
  assert.match(data.error, /^before must be a positive integer(?: within uint256 range)?$/);
  assert.doesNotMatch(data.error, /invalid literal|ValueError|Traceback/);
  return {controlledParameterError:true, rawPythonErrorAbsent:true};
}
function page(cursor) {
  return data => {
    assert(Number.isSafeInteger(data.total) && data.total >= 0);
    assert(Array.isArray(data.orders) && data.orders.length <= 50);
    const start = Math.min(cursor ?? data.total + 1, data.total + 1);
    const expectedIds = Array.from({length:Math.min(start - 1, 50)}, (_, i) => start - 1 - i);
    const ids = data.orders.map(order => order.id);
    assert.deepEqual(ids, expectedIds, 'Expected complete bounded descending exclusive page');
    assert(BigInt(data.lockedWei) >= 0n && BigInt(data.claimableWei) >= 0n);
    return {total:data.total, ids, exclusiveCursor:cursor ?? null, lockedWei:data.lockedWei, claimableWei:data.claimableWei};
  };
}
function content(digest) {
  return data => {
    assert.equal(data.digest, digest);
    assert.equal(ethers.keccak256(ethers.toUtf8Bytes(data.canonical)), digest);
    assert.deepEqual(JSON.parse(data.canonical), data.document);
    return {digest, canonicalKeccakVerified:true, documentMatchesCanonical:true};
  };
}
async function main() {
  await check('R01', '/health', 200, 'Healthy database and configured contracts before retest', health, true);
  const bad = [
    ['R02','invalid'], ['R03',''], ['R04','0'], ['R05','-1'],
    ['R06','2&before=3'], ['R07','1.5'], ['R08',(2n ** 256n).toString()]
  ];
  for (const [id, value] of bad) {
    await check(id, '/api/orders?before=' + value, 400, 'Controlled JSON pagination error', invalid, true);
  }
  await check('R09', '/api/orders', 200, 'Bounded newest-first page', page());
  await check('R10', '/api/orders?before=6', 200, 'Descending order IDs strictly below 6', page(6));
  await check('R11', '/api/orders?before=1', 200, 'Empty page at the first-order boundary', page(1));
  await check('R12', '/api/content/' + prior.priorRestartRecordDigest, 200, 'Historical content hash remains valid', content(prior.priorRestartRecordDigest));
  await check('R13', '/api/content/' + prior.qaRecordDigest, 200, 'Part 5 QA content hash remains valid', content(prior.qaRecordDigest));
  await check('R14', '/health', 200, 'Healthy database and configured contracts after retest', health, true);
  const record = {
    defect:'P5-001', startedAtUTC, completedAtUTC:new Date().toISOString(), origin:prior.origin,
    referenceRevision:execFileSync('git',['rev-parse','HEAD'],{cwd:REPO,encoding:'utf8'}).trim(),
    helperSHA256:createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),
    ownerReportedDeployment:{commit:owner.deployedCommit, renderDeploymentId:owner.renderDeploymentId,
      serviceLiveAtSingapore:owner.serviceLiveAtSingapore,
      attribution:'Owner-supplied repository record and Render screenshot; not direct console/API attestation by Part 5.'},
    environment:{node:process.version, platform:`${os.platform()} ${os.release()}`, ethers:ethers.version},
    scope:'Independent read-only HTTP acceptance. No authentication, application writes, restart, deployment or blockchain transaction. Normal content reads are not a new restart test. Live RPC failure is not induced.',
    results, summary:Object.fromEntries(['PASS','FAIL','NOT RUN'].map(status => [status,results.filter(r=>r.status===status).length]))
  };
  fs.mkdirSync(output, {recursive:true});
  const target = path.join(output,'p5-001-retest-' + startedAtUTC.replace(/[:.]/g,'-') + '.json');
  fs.writeFileSync(target, JSON.stringify(record,null,2)+'\n', {flag:'wx'});
  console.log(target);
  if (record.summary.FAIL || record.summary['NOT RUN']) process.exitCode = 1;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
