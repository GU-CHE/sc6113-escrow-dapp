const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const ganache = require('ganache');
const {BrowserProvider, ContractFactory, parseEther, id} = require('ethers');
const {compile} = require('../scripts/compile.cjs');
let rpc, provider, admin, customer, freelancer, stranger, roles, orders, resolver, amount, attacker;
const gas = [];
async function sent(tx, label) { const r=await (await tx).wait();if(label)gas.push({operation:label,gasUsed:r.gasUsed.toString()});return r; }
async function rejected(fn) { await assert.rejects(async()=>{const tx=await fn();await tx.wait();}); }
async function fresh() {
 const block=await provider.getBlock('latest');
 await sent(orders.connect(customer).createOrder(await freelancer.getAddress(),amount,block.timestamp+3600,id('Terms')),'createOrder');
 return Number(await orders.orderCount());
}
async function funded() { const n=await fresh();await sent(orders.connect(freelancer).acceptOrder(n),'acceptOrder');await sent(orders.connect(customer).fundOrder(n,{value:amount}),'fundOrder');return n; }
before(async()=>{
 rpc=ganache.provider({chain:{chainId:1337,hardfork:'shanghai'},logging:{quiet:true}});
 provider=new BrowserProvider(rpc, undefined, {cacheTimeout:-1}); provider.pollingInterval=10;
 [admin,customer,freelancer,stranger]=await Promise.all([0,1,2,3].map(i=>provider.getSigner(i)));
 const a=compile({'ReentrantRecipient.sol':{content:require('node:fs').readFileSync('tests/ReentrantRecipient.sol','utf8')}});
 async function deploy(name,args){const c=await new ContractFactory(a[name].abi,a[name].evm.bytecode.object,admin).deploy(...args);await c.waitForDeployment();return c;}
 roles=await deploy('RoleRegistry',[await admin.getAddress()]);orders=await deploy('EscrowOrders',[await roles.getAddress()]);resolver=await deploy('DisputeResolver',[await roles.getAddress(),await orders.getAddress()]);
 await sent(orders.setResolver(await resolver.getAddress()));
 attacker=await deploy('ReentrantRecipient',[roles.target,orders.target]);
 await sent(roles.connect(customer).register(1),'registerCustomer');await sent(roles.connect(freelancer).register(2),'registerProvider');amount=parseEther('0.01');
});
after(async()=>{require('node:fs').mkdirSync('docs',{recursive:true});require('node:fs').writeFileSync('docs/gas-samples.json',JSON.stringify({environment:'Ganache, solc 0.8.30, optimizer 200, Shanghai; test measurements, not Sepolia fees',samples:gas},null,2));await rpc.disconnect();});
test('public registration cannot grant administrator or overwrite roles',async()=>{
 await rejected(()=>roles.connect(stranger).register(3));await rejected(()=>roles.connect(customer).register(2));assert.equal(await roles.roles(await admin.getAddress()),3n);
});
test('resolver configuration is immutable and admin-only',async()=>{
 await rejected(()=>orders.connect(stranger).setResolver(resolver.target));await rejected(()=>orders.setResolver(resolver.target));
});
test('creation requires a customer, registered provider, valid terms, deadline and amount',async()=>{
 const p=await freelancer.getAddress(), block=await provider.getBlock('latest');
 await rejected(()=>orders.connect(stranger).createOrder(p,amount,block.timestamp+100,id('T')));
 await rejected(()=>orders.connect(customer).createOrder(p,0,block.timestamp+100,id('T')));
 await rejected(()=>orders.connect(customer).createOrder(p,amount,block.timestamp-1,id('T')));
 await rejected(()=>orders.connect(customer).createOrder(p,amount,block.timestamp+100,'0x'+'00'.repeat(32)));
 await rejected(()=>orders.connect(customer).createOrder(stranger.address,amount,block.timestamp+100,id('T')));
});
test('successful order pays exactly once with conservation of liabilities',async()=>{
 const n=await funded();await sent(orders.connect(freelancer).submitDelivery(n,id('Delivery')),'submitDelivery');await sent(orders.connect(customer).approveDelivery(n),'approveDelivery');
 assert.equal((await orders.getOrder(n)).state,5n);assert.equal(await orders.credits(freelancer.address),amount);assert.equal(await orders.lockedTotal(),0n);assert.equal(await orders.claimableTotal(),amount);
 const before=BigInt(await rpc.request({method:'eth_getBalance',params:[orders.target,'latest']}));
 await sent(orders.connect(freelancer).withdraw(),'withdraw');
 const after=BigInt(await rpc.request({method:'eth_getBalance',params:[orders.target,'latest']}));assert.equal(before-after,amount);assert.equal(await orders.credits(freelancer.address),0n);
 await rejected(()=>orders.connect(freelancer).withdraw());await rejected(()=>orders.connect(customer).approveDelivery(n));await rejected(()=>resolver.connect(customer).openDispute(n,id('Late')));
});
test('unauthorized actors, wrong amounts and illegal transitions revert',async()=>{
 const n=await fresh();await rejected(()=>orders.connect(stranger).acceptOrder(n));await rejected(()=>orders.connect(customer).approveDelivery(n));
 await sent(orders.connect(freelancer).acceptOrder(n));await rejected(()=>orders.connect(stranger).fundOrder(n,{value:amount}));await rejected(()=>orders.connect(customer).fundOrder(n,{value:1}));
 await sent(orders.connect(customer).fundOrder(n,{value:amount}));await rejected(()=>orders.connect(customer).fundOrder(n,{value:amount}));await rejected(()=>orders.connect(stranger).submitDelivery(n,id('D')));await rejected(()=>orders.connect(customer).cancelOrder(n));await rejected(()=>orders.connect(stranger).approveDelivery(n));
 await rejected(()=>orders.connect(stranger).markDisputed(n,stranger.address));await rejected(()=>orders.connect(stranger).resolveDispute(n,true));
 await sent(resolver.connect(customer).openDispute(n,id('Problem')));await sent(resolver.resolve(n,false,id('Refund')));await sent(orders.connect(customer).withdraw());
});
test('unfunded cancellation prevents acceptance and funding',async()=>{
 const n=await fresh();await sent(orders.connect(customer).cancelOrder(n),'cancelOrder');assert.equal((await orders.getOrder(n)).state,7n);await rejected(()=>orders.connect(freelancer).acceptOrder(n));await rejected(()=>orders.connect(customer).fundOrder(n,{value:amount}));
});
test('dispute refund requires admin; evidence restricted; settlement cannot repeat',async()=>{
 const n=await funded();await rejected(()=>resolver.connect(stranger).openDispute(n,id('X')));await sent(resolver.connect(customer).openDispute(n,id('Problem')),'openDispute');
 await rejected(()=>resolver.connect(stranger).addEvidence(n,id('X')));await sent(resolver.connect(freelancer).addEvidence(n,id('Evidence')),'addEvidence');
 await rejected(()=>resolver.connect(customer).resolve(n,false,id('Ruling')));await sent(resolver.resolve(n,false,id('Ruling')),'resolveRefund');
 assert.equal((await orders.getOrder(n)).state,6n);assert.equal(await orders.credits(customer.address),amount);
 await rejected(()=>resolver.resolve(n,true,id('Again')));await rejected(()=>resolver.connect(customer).addEvidence(n,id('Late')));await sent(orders.connect(customer).withdraw());
});
test('dispute can pay provider after submitted work',async()=>{
 const n=await funded();await sent(orders.connect(freelancer).submitDelivery(n,id('Work')));await sent(resolver.connect(freelancer).openDispute(n,id('Unpaid')));await sent(resolver.resolve(n,true,id('Evidence accepted')),'resolveProvider');assert.equal(await orders.credits(freelancer.address),amount);await sent(orders.connect(freelancer).withdraw());
});
test('deadline refund applies only to funded undelivered orders',async()=>{
 const n=await funded();await rejected(()=>orders.connect(customer).refundExpired(n));await rpc.request({method:'evm_increaseTime',params:[3601]});await rpc.request({method:'evm_mine',params:[]});
 await rejected(()=>orders.connect(freelancer).submitDelivery(n,id('Late')));await sent(orders.connect(customer).refundExpired(n),'refundExpired');assert.equal((await orders.getOrder(n)).state,6n);await sent(orders.connect(customer).withdraw());
});
test('rejecting recipient keeps credit; reentrant recipient cannot double-withdraw',async()=>{
 const block=await provider.getBlock('latest');
 await sent(orders.connect(customer).createOrder(attacker.target,amount,block.timestamp+3600,id('Terms')));
 const n=await orders.orderCount();await sent(attacker.accept(n));await sent(orders.connect(customer).fundOrder(n,{value:amount}));await sent(attacker.deliver(n));await sent(orders.connect(customer).approveDelivery(n));
 await sent(attacker.rejectPayments(true));await rejected(()=>attacker.claim());assert.equal(await orders.credits(attacker.target),amount);assert.equal(await orders.claimableTotal(),amount);
 await sent(attacker.rejectPayments(false));await sent(attacker.claim());assert.equal(await attacker.received(),amount);assert.equal(await attacker.reentrySucceeded(),false);assert.equal(await orders.credits(attacker.target),0n);
});
test('nonexistent order and zero withdrawal rejected; final liabilities zero',async()=>{
 await assert.rejects(()=>orders.getOrder(999));await rejected(()=>orders.connect(stranger).withdraw());assert.equal(await orders.lockedTotal(),0n);assert.equal(await orders.claimableTotal(),0n);assert.equal(BigInt(await rpc.request({method:'eth_getBalance',params:[orders.target,'latest']})),0n);
});
