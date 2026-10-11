/* All money movement is signed in the wallet; the server never holds keys. */
'use strict';
const $ = id => document.getElementById(id);
const roles = ['Unregistered','Customer','Service provider','Administrator'];
let config, provider, signer, address, role=0, csrf, contracts={}, orders=[], events=[], selected, busy=false, nextBefore=null, deploymentResult;
const zero = '0x'+'00'.repeat(32);
const short = a => a ? `${a.slice(0,6)}…${a.slice(-4)}` : '—';
const same = (a,b) => Boolean(a && b && a.toLowerCase()===b.toLowerCase());
const eth = v => ethers.formatEther(v || '0');
function notify(message,error=false) { $('status').textContent=message;$('status').classList.toggle('error',error); }
function element(tag,text,className) {const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
function friendly(error) {
 if(error.code===4001 || error.code==='ACTION_REJECTED')return 'You cancelled the wallet request. No confirmed payment was recorded.';
 return error.reason || error.info?.error?.message || error.shortMessage || error.message || 'Request failed. Refresh and check transaction history before retrying.';
}
async function api(path,data) {
 const response=await fetch(path,{method:data===undefined?'GET':'POST',credentials:'same-origin',headers:data===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':csrf || ''},body:data===undefined?undefined:JSON.stringify(data)});
 const result=await response.json();if(!response.ok)throw new Error(result.error || 'Server request failed');return result;
}
async function withBusy(fn) {if(busy)return;busy=true;try{await fn();}catch(error){notify(friendly(error),true);}finally{busy=false;}}
async function bindWallet(requestAccounts=false) {
 if(!window.ethereum)throw new Error('Open this page in a browser with MetaMask. On mobile, use the MetaMask in-app browser.');
 const accounts=await window.ethereum.request({method:requestAccounts?'eth_requestAccounts':'eth_accounts'});
 if(!accounts.length)throw new Error('Connect a wallet first.');
 const chain=Number(await window.ethereum.request({method:'eth_chainId'}));
 if(chain!==config.chainId)throw new Error(`Switch MetaMask to ${config.network} (chain ID ${config.chainId}) and reconnect.`);
 provider=new ethers.BrowserProvider(window.ethereum);
 signer=await provider.getSigner();address=await signer.getAddress();
 contracts={};
 if(config.configured)for(const [name,addr] of Object.entries(config.addresses))contracts[name]=new ethers.Contract(addr,config.abis[name],signer);
}
async function login() {
 await bindWallet(true);
 const challenge=await api('/api/auth/challenge',{address});
 const signature=await signer.signMessage(challenge.message);
 const result=await api('/api/auth/verify',{nonce:challenge.nonce,signature});csrf=result.csrf;
 if(!same(result.address,address))throw new Error('Wallet changed during sign-in. Reconnect.');
 await refresh();notify('Wallet signed in. All payments require a separate transaction confirmation.');
}
async function ready() {
 if(!signer || !address)throw new Error('Connect and sign in with your wallet first.');
 const accounts=await window.ethereum.request({method:'eth_accounts'});
 if(!same(accounts[0],address))throw new Error('Account changed. Reconnect before continuing.');
 const chain=Number(await window.ethereum.request({method:'eth_chainId'}));
 if(chain!==config.chainId)throw new Error('Wallet network changed. Switch back and reconnect.');
 const me=await api('/api/auth/me');
 if(!same(me.address,address))throw new Error('Wallet session expired. Connect again to sign in.');
 csrf=me.csrf;
}
async function saveContent(kind,title,description) {
 const record=await api('/api/content',{kind,title,description});
 if(ethers.keccak256(ethers.toUtf8Bytes(record.canonical))!==record.digest)throw new Error('Metadata integrity check failed');
 return record.digest;
}
function review(summary,details) {
 $('review-summary').textContent=summary;const dl=$('review-values');dl.replaceChildren();
 for(const [label,value] of Object.entries(details)){dl.append(element('dt',label),element('dd',value));}
 $('review-dialog').showModal();
 return new Promise(resolve=>{
  function finish(ok){$('review-dialog').close();$('review-confirm').onclick=null;$('review-cancel').onclick=null;$('review-dialog').oncancel=null;resolve(ok);}
  $('review-confirm').onclick=()=>finish(true);$('review-cancel').onclick=()=>finish(false);$('review-dialog').oncancel=e=>{e.preventDefault();finish(false);};
 });
}
async function transact(contractName,method,args=[],value=0n) {
 await ready();
 const fn=contracts[contractName][method];
 const estimate=await fn.estimateGas(...args,{value});
 const fees=await provider.getFeeData();const gasLimit=estimate*120n/100n;
 if(!await review(`${method} · ${config.network}`,{'Contract':short(config.addresses[contractName]),'Test ETH sent':eth(value),'Estimated gas units':estimate.toString(),'Estimated fee ceiling (with 20% gas buffer)':`${eth(gasLimit*(fees.maxFeePerGas || fees.gasPrice || 0n))} ETH`}))return;
 await ready();notify('Waiting for your wallet approval…');
 const tx=await fn(...args,{value,gasLimit});notify(`Transaction submitted, waiting for confirmation: ${tx.hash}`);
 const receipt=await tx.wait();if(!receipt || receipt.status!==1)throw new Error('Transaction failed. No successful state change was confirmed.');
 await refresh();notify(`Confirmed in block ${receipt.blockNumber} · gas used ${receipt.gasUsed} · ${receipt.hash}`);
}
async function refresh(more=false) {
 if(!config.configured){notify('Interface ready. Deploy contracts to enable live orders.');renderOrders();return;}
 const [data,history]=await Promise.all([api('/api/orders'+(more&&nextBefore?`?before=${nextBefore}`:'')),api('/api/events').catch(()=>null)]);
 orders=more?[...orders,...data.orders]:data.orders;nextBefore=data.nextBefore;
 $('total').textContent=data.total;$('locked').textContent=eth(data.lockedWei);$('claimable').textContent=eth(data.claimableWei);
 if(history){events=history.events;$('event-window').textContent=`Latest 100 events · blocks ${history.fromBlock}–${history.toBlock}`;renderEvents();}
 if(signer&&address){
  role=Number(await contracts.RoleRegistry.roles(address));const credit=await contracts.EscrowOrders.credits(address);
  $('credit').textContent=eth(credit);$('withdraw').disabled=credit===0n;$('role-panel').hidden=role!==0;
  $('identity').textContent=`${roles[role]} · ${short(address)}`;$('connect').textContent=`${short(address)} · Reconnect`;
 }
 $('new-order').disabled=role!==1;$('load-more').hidden=!nextBefore;
 renderOrders();if(selected){selected=orders.find(o=>o.id===selected.id)||selected;await showDetail(selected);}
}
function renderOrders() {
 const bars=$('distribution');bars.replaceChildren();
 const states=['Created','Accepted','Funded','Submitted','Disputed','Released','Refunded','Cancelled'];
 for(const state of states){const count=orders.filter(o=>o.state===state).length;const item=element('div',undefined,'bar-item');const track=element('div',undefined,'bar-track');const fill=element('div',undefined,'bar-fill');fill.style.width=(orders.length?count/orders.length*100:0)+'%';track.append(fill);item.append(element('span',state),track,element('strong',String(count)));bars.append(item);}
 const filter=$('filter').value;
 const list=orders.filter(o=>filter==='all'||(filter==='mine'&&(same(o.customer,address)||same(o.provider,address)))||(filter==='active'&&!['Released','Refunded','Cancelled'].includes(o.state))||(filter==='disputed'&&o.state==='Disputed'));
 const body=$('orders');body.replaceChildren();$('empty').hidden=list.length>0;
 for(const o of list){
  const row=element('tr');const name=element('td',`Order #${o.id}`);name.append(element('small',short(o.termsHash)));
  const people=element('td',`Customer ${short(o.customer)}`);people.append(element('small',`Provider ${short(o.provider)}`));
  const state=element('td');state.append(element('span',o.state,`pill ${o.state}`));
  const date=element('td',new Date(o.deadline*1000).toLocaleDateString());date.append(element('small',new Date(o.deadline*1000).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})));
  const last=element('td'),button=element('button','View','secondary');button.onclick=()=>withBusy(()=>showDetail(o));last.append(button);
  row.append(name,people,element('td',`${eth(o.amountWei)} ETH`),state,date,last);body.append(row);
 }
}
function renderEvents() {
 const area=$('events');area.replaceChildren();if(!events.length)area.append(element('p','No events in the current block window.','muted'));
 for(const e of events){const row=element('div',undefined,'event'),left=element('div',`${e.event}${e.args.orderId!==undefined?' · Order #'+e.args.orderId:''}`);left.append(element('small',`${e.contract} · block ${e.block}${e.args.actor?' · '+short(e.args.actor):''}`));
 const right=element(config.explorer?'a':'code',short(e.txHash));if(config.explorer){right.href=`${config.explorer}/tx/${e.txHash}`;right.target='_blank';right.rel='noopener noreferrer';}row.append(left,right);area.append(row);}
}
async function showDetail(o) {
 selected=o;$('detail').hidden=false;$('detail-title').textContent=`Order #${o.id} · ${o.state}`;
 const dl=element('dl');for(const [k,v] of Object.entries({'Customer':o.customer,'Provider':o.provider,'Amount':`${eth(o.amountWei)} ETH`,'Delivery deadline':new Date(o.deadline*1000).toLocaleString(),'Terms hash':o.termsHash,'Delivery hash':o.deliveryHash})){dl.append(element('dt',k),element('dd',v));}$('detail-body').replaceChildren(dl);
 const records=$('linked-records');records.replaceChildren();const refs=[['Terms',o.termsHash],['Delivery',o.deliveryHash]];
 for(const e of events.filter(e=>Number(e.args.orderId)===o.id))for(const key of ['reasonHash','evidenceHash','rulingHash'])if(e.args[key])refs.push([e.event,e.args[key]]);
 for(const [label,hash] of refs){if(hash===zero)continue;const entry=element('div',`${label}: loading…`,'record');records.append(entry);
 try{const r=await api('/api/content/'+hash);if(ethers.keccak256(ethers.toUtf8Bytes(r.canonical))!==hash)throw new Error('Hash mismatch');entry.textContent=`${label} · ${r.document.title}\n${r.document.description}`;entry.append(element('small',`Hash verified · author ${r.document.author}`));}catch(_){entry.textContent=`${label} · ${hash}\nText unavailable. The public hash remains on chain.`;}}
 const actions=$('order-actions');actions.replaceChildren();const now=Date.now()/1000;
 function action(label,method,kind,explanation){const b=element('button',label,'secondary');b.onclick=()=>openAction(o,method,kind,explanation);actions.append(b);}
 if(same(address,o.provider)&&o.state==='Created'&&now<o.deadline)action('Accept order','acceptOrder',null,'Accept the recorded scope and price. No funds are transferred.');
 if(same(address,o.customer)&&o.state==='Accepted'&&now<o.deadline)action('Fund escrow','fundOrder',null,`Lock ${eth(o.amountWei)} test ETH in the escrow contract.`);
 if(same(address,o.customer)&&['Created','Accepted'].includes(o.state))action('Cancel order','cancelOrder',null,'Cancel this unfunded order.');
 if(same(address,o.provider)&&o.state==='Funded'&&now<=o.deadline)action('Submit delivery','submitDelivery','delivery','Save a public delivery description or link, then record its hash on chain.');
 if(same(address,o.customer)&&o.state==='Submitted')action('Approve delivery','approveDelivery',null,'Accept the work and make the full payment available for the provider to withdraw.');
 if(same(address,o.customer)&&o.state==='Funded'&&now>o.deadline)action('Refund overdue order','refundExpired',null,'The delivery deadline has passed with no delivery submitted. Make the funds available for your withdrawal.');
 if((same(address,o.customer)||same(address,o.provider))&&['Funded','Submitted'].includes(o.state))action('Open dispute','openDispute','dispute','Freeze ordinary settlement and request a ruling from the designated arbitrator.');
 if(o.state==='Disputed'){
  if(same(address,o.customer)||same(address,o.provider))action('Add evidence','addEvidence','evidence','Attach a public explanation or evidence link to the active dispute.');
  if(role===3)action('Resolve dispute','resolve','ruling','Choose one final outcome and explain the ruling. No partial payments are supported.');
 }
}
function openAction(order,method,kind,explanation) {
 $('action-title').textContent=method;$('action-explanation').textContent=explanation;$('content-fields').hidden=!kind;$('ruling-field').hidden=method!=='resolve';
 const form=$('action-form');form.reset();form.elements.title.required=Boolean(kind);form.elements.description.required=Boolean(kind);$('action-dialog').showModal();
 form.onsubmit=e=>{e.preventDefault();withBusy(async()=>{
  await ready();const hash=kind?await saveContent(kind,form.elements.title.value,form.elements.description.value):null;
  let args=[order.id],name='EscrowOrders';if(hash)args.push(hash);
  if(['openDispute','addEvidence','resolve'].includes(method))name='DisputeResolver';
  if(method==='resolve')args=[order.id,form.elements.ruling.value==='pay',hash];
  $('action-dialog').close();await transact(name,method,args,method==='fundOrder'?BigInt(order.amountWei):0n);
 });};
}
$('connect').onclick=()=>withBusy(login);
$('refresh').onclick=()=>withBusy(async()=>{await refresh();notify('Workspace refreshed from chain.');});
$('load-more').onclick=()=>withBusy(()=>refresh(true));$('filter').onchange=renderOrders;
$('close-detail').onclick=()=>{selected=null;$('detail').hidden=true;};
$('withdraw').onclick=()=>withBusy(()=>transact('EscrowOrders','withdraw'));
for(const button of document.querySelectorAll('[data-register]'))button.onclick=()=>withBusy(()=>transact('RoleRegistry','register',[Number(button.dataset.register)]));
for(const button of document.querySelectorAll('.close'))button.onclick=()=>button.closest('dialog').close();
$('new-order').onclick=()=>{const f=$('create-form');f.reset();const d=new Date(Date.now()+86400000);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());f.elements.deadline.value=d.toISOString().slice(0,16);$('create-dialog').showModal();};
$('create-form').onsubmit=e=>{e.preventDefault();withBusy(async()=>{
 await ready();const f=$('create-form');const who=f.elements.provider.value.trim();if(!ethers.isAddress(who))throw new Error('Enter a valid provider wallet address.');
 const amount=ethers.parseEther(f.elements.amount.value);const deadline=Math.floor(new Date(f.elements.deadline.value).getTime()/1000);
 if(!Number.isFinite(deadline)||deadline<=Date.now()/1000||deadline>Date.now()/1000+90*86400)throw new Error('Choose a deadline within the next 90 days.');
 const hash=await saveContent('terms',f.elements.title.value,f.elements.description.value);$('create-dialog').close();await transact('EscrowOrders','createOrder',[who,amount,deadline,hash]);
});};
$('deploy').onclick=()=>withBusy(async()=>{
 await bindWallet(true);if(config.chainId!==11155111)throw new Error('Browser deployment is limited to Sepolia.');
 if(!await review('Deploy the three testnet contracts',{'Administrator wallet':address,'Network':'Sepolia','Wallet transactions':'Three deployments + one resolver binding'}))return;
 const storageKey=`escrow-deployment:${config.chainId}:${address.toLowerCase()}`;
 let progress;
 try{progress=JSON.parse(localStorage.getItem(storageKey)||'null');}catch(_){}
 progress=progress||{chainId:11155111,network:'Sepolia',startBlock:null,addresses:{}};
 const addresses=progress.addresses;
 function persist(){deploymentResult=progress;localStorage.setItem(storageKey,JSON.stringify(progress));$('deployment-output').textContent=JSON.stringify(progress,null,2);$('download-deployment').hidden=false;}
 async function sameWallet(){const accounts=await window.ethereum.request({method:'eth_accounts'});const chain=Number(await window.ethereum.request({method:'eth_chainId'}));if(!same(accounts[0],address)||chain!==11155111)throw new Error('Wallet changed during deployment. Restore the original wallet and Sepolia, then resume.');}
 for(const name of ['RoleRegistry','EscrowOrders','DisputeResolver']){
  await sameWallet();
  if(addresses[name]&&await provider.getCode(addresses[name])!=='0x')continue;
  const artifact=await api(`/static/contracts/${name}.deploy.json`);
  const args=name==='RoleRegistry'?[address]:name==='EscrowOrders'?[addresses.RoleRegistry]:[addresses.RoleRegistry,addresses.EscrowOrders];
  notify(`Deploying ${name}: confirm in MetaMask, then wait for the receipt. Successful steps are saved in this browser.`);
  const c=await new ethers.ContractFactory(artifact.abi,artifact.bytecode,signer).deploy(...args);const receipt=await c.deploymentTransaction().wait();addresses[name]=await c.getAddress();if(progress.startBlock===null)progress.startBlock=receipt.blockNumber;persist();
 }
 await sameWallet();const escrow=new ethers.Contract(addresses.EscrowOrders,config.abis.EscrowOrders,signer);
 if(await escrow.resolver()===ethers.ZeroAddress){notify('Binding the resolver: confirm the final transaction.');await (await escrow.setResolver(addresses.DisputeResolver)).wait();}
 if(!same(await escrow.resolver(),addresses.DisputeResolver))throw new Error('Resolver binding does not match saved deployment.');
 persist();
 notify('Contracts deployed. Download deployment.json and replace the repository configuration, then redeploy the app.');
});
$('download-deployment').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(deploymentResult,null,2)+'\n'],{type:'application/json'}));const a=element('a');a.href=url;a.download='deployment.json';a.click();URL.revokeObjectURL(url);};
if(window.ethereum){for(const event of ['accountsChanged','chainChanged'])window.ethereum.on(event,()=>{
 signer=null;address=null;role=0;contracts={};csrf=null;$('connect').textContent='Connect wallet';$('identity').textContent='Wallet changed · reconnect to sign in';$('new-order').disabled=true;$('withdraw').disabled=true;$('role-panel').hidden=true;$('credit').textContent='—';$('create-dialog').close();$('action-dialog').close();$('review-cancel').click();renderOrders();if(selected)showDetail(selected).catch(e=>notify(friendly(e),true));notify('Wallet account or network changed. Reconnect to continue.');
});}
withBusy(async()=>{config=await api('/api/config');$('network').textContent=config.network;$('setup').hidden=config.configured;await refresh();if(config.configured)notify('Workspace loaded. Connect a wallet to take action.');});
