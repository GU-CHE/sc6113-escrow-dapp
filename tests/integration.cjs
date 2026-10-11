// Requires npm run chain. Uses only unlocked disposable Ganache accounts.
const {spawn} = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {JsonRpcProvider,Contract,parseEther,keccak256,toUtf8Bytes,hexlify} = require('ethers');
const deployment=JSON.parse(fs.readFileSync('.local/deployment.json'));
assert.equal(deployment.chainId,1337,'Integration test must never use a public network');
const base='http://127.0.0.1:5051';
const server=spawn(process.env.PYTHON_EXE||'.venv/bin/python',['app.py'],{env:{...process.env,PORT:'5051',APP_ORIGIN:base,DEPLOYMENT_FILE:'.local/deployment.json',DATABASE_URL:'sqlite:///'+process.cwd()+'/.local/integration.db'},stdio:['ignore','ignore','pipe']});
let logs='';server.stderr.on('data',d=>logs+=d.toString());
async function waitServer(){for(let i=0;i<80;i++){try{if((await fetch(base+'/health')).ok)return;}catch(_){}await new Promise(r=>setTimeout(r,100));}throw new Error(logs);}
(async()=>{
 try{
  await waitServer();const rpc=new JsonRpcProvider(deployment.rpcUrl,undefined,{cacheTimeout:-1});rpc.pollingInterval=10;
  const snapshot=await rpc.send('evm_snapshot',[]);
  try{
   const customer=await rpc.getSigner(1),provider=await rpc.getSigner(2);
   const abi=name=>JSON.parse(fs.readFileSync(`static/contracts/${name}.abi.json`));
   const roles=new Contract(deployment.addresses.RoleRegistry,abi('RoleRegistry'),customer);
   const orders=new Contract(deployment.addresses.EscrowOrders,abi('EscrowOrders'),customer);
   if(await roles.roles(customer.address)===0n)await (await roles.register(1)).wait();
   if(await roles.roles(provider.address)===0n)await (await roles.connect(provider).register(2)).wait();
   const c=await (await fetch(base+'/api/auth/challenge',{method:'POST',headers:{'Origin':base,'Content-Type':'application/json'},body:JSON.stringify({address:customer.address})})).json();
   const signature=await rpc.send('eth_sign',[customer.address,hexlify(toUtf8Bytes(c.message))]);
   const verified=await fetch(base+'/api/auth/verify',{method:'POST',headers:{'Origin':base,'Content-Type':'application/json'},body:JSON.stringify({nonce:c.nonce,signature})});
   assert.equal(verified.status,200);const user=await verified.json();const cookie=verified.headers.get('set-cookie').split(';')[0];
   const response=await fetch(base+'/api/content',{method:'POST',headers:{'Origin':base,'Content-Type':'application/json','Cookie':cookie,'X-CSRF-Token':user.csrf},body:JSON.stringify({kind:'terms',title:'Integration test order',description:'One test deliverable'})});
   assert.equal(response.status,200);const content=await response.json();assert.equal(keccak256(toUtf8Bytes(content.canonical)),content.digest);
   const block=await rpc.getBlock('latest');const value=parseEther('0.001');
   await (await orders.createOrder(provider.address,value,block.timestamp+3600,content.digest)).wait();const n=await orders.orderCount();
   await (await orders.connect(provider).acceptOrder(n)).wait();await (await orders.fundOrder(n,{value})).wait();
   let result=await (await fetch(base+'/api/orders')).json();assert.equal(result.orders[0].state,'Funded');assert.equal(result.orders[0].termsHash,content.digest);assert.equal(result.lockedWei,value.toString());
   await (await orders.connect(provider).submitDelivery(n,keccak256(toUtf8Bytes('Delivered')))).wait();await (await orders.approveDelivery(n)).wait();await (await orders.connect(provider).withdraw()).wait();
   result=await (await fetch(base+'/api/orders')).json();assert.equal(result.orders[0].state,'Released');assert.equal(result.lockedWei,'0');assert.equal(result.claimableWei,'0');
   const history=await (await fetch(base+'/api/events')).json();assert.ok(history.events.some(e=>e.event==='Withdrawal'));assert.ok(history.events.some(e=>Number(e.args.orderId)===Number(n)));
   const stored=await (await fetch(base+'/api/content/'+content.digest)).json();assert.equal(stored.document.author,customer.address);
   console.log('PASS: wallet signature → Flask session → database metadata → three-contract deployment → order funding/delivery/settlement → Flask chain reads/events');
  }finally{await rpc.send('evm_revert',[snapshot]);await rpc.destroy();}
 }finally{server.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
