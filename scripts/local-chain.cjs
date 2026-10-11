const ganache = require('ganache');
const {ContractFactory, JsonRpcProvider} = require('ethers');
const {compile} = require('./compile.cjs');
const fs = require('node:fs');
(async () => {
 const server = ganache.server({chain:{chainId:1337,hardfork:'shanghai'},wallet:{deterministic:true,totalAccounts:6},logging:{quiet:true}});
 await server.listen(18545, '127.0.0.1');
 const provider = new JsonRpcProvider('http://127.0.0.1:18545');
 const admin = await provider.getSigner(0);
 const artifacts = compile();
 async function deploy(name, args) {const a=artifacts[name];const c=await new ContractFactory(a.abi,a.evm.bytecode.object,admin).deploy(...args);await c.waitForDeployment();return c;}
 const roles=await deploy('RoleRegistry',[await admin.getAddress()]);
 const orders=await deploy('EscrowOrders',[await roles.getAddress()]);
 const resolver=await deploy('DisputeResolver',[await roles.getAddress(),await orders.getAddress()]);
 await (await orders.setResolver(await resolver.getAddress())).wait();
 const addresses={RoleRegistry:await roles.getAddress(),EscrowOrders:await orders.getAddress(),DisputeResolver:await resolver.getAddress()};
 fs.mkdirSync('.local',{recursive:true});
 fs.writeFileSync('.local/deployment.json',JSON.stringify({chainId:1337,network:'Local development',rpcUrl:'http://127.0.0.1:18545',startBlock:0,addresses},null,2));
 console.log('Local chain ready at http://127.0.0.1:18545; deployment saved to .local/deployment.json.');
 console.log('Disposable accounts only. Never use Ganache deterministic accounts on a public network.');
})();
