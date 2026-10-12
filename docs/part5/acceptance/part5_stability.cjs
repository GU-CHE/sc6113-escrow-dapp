const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const evidence=path.join(ROOT,'evidence');
const input=JSON.parse(fs.readFileSync(path.join(evidence,'live-results.json'),'utf8'));
const ethers=require(path.join(ROOT,'..','..','static','vendor','ethers.umd.min.js'));
const output=path.resolve(process.env.PART5_OUTPUT_DIR || path.join(require('node:os').tmpdir(),'sc6113-part5',new Date().toISOString().replace(/[:.]/g,'-')));
fs.mkdirSync(output,{recursive:true});
async function main(){
 const samples=[];
 for(let i=0;i<3;i++){
  if(i)await new Promise(r=>setTimeout(r,20000));
  const sample={timeUTC:new Date().toISOString()};
  try{
   let t=Date.now();const h=await fetch(input.origin+'/health',{signal:AbortSignal.timeout(55000)});const health=await h.json();sample.healthMs=Date.now()-t;
   if(h.status!==200||health.status!=='ok')throw Error('Health check failed');
   t=Date.now();const c=await fetch(input.origin+'/api/content/'+input.qaRecordDigest,{signal:AbortSignal.timeout(55000)});const content=await c.json();sample.contentMs=Date.now()-t;
   if(c.status!==200||ethers.keccak256(ethers.toUtf8Bytes(content.canonical))!==input.qaRecordDigest)throw Error('Hash read failed');
   sample.status='PASS';
  }catch(e){sample.status='FAIL';sample.error=e.message;}
  samples.push(sample);console.log(JSON.stringify(sample));
 }
 fs.writeFileSync(path.join(output,'stability-samples.json'),JSON.stringify({scope:'Three bounded health and saved-content reads, 20 seconds apart. Not load testing, a restart, or uptime certification.',samples},null,2), {flag:'wx'});
 if(samples.some(s=>s.status==='FAIL')) process.exitCode=1;
 console.log('Evidence: '+output);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
