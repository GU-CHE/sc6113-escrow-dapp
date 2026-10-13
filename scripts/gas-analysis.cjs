const fs = require('node:fs');
const path = require('node:path');
const solc = require('solc');
const ganache = require('ganache');
const {BrowserProvider, ContractFactory, id, parseEther} = require('ethers');

function compile(optimizer) {
  const sources = {};
  for (const file of fs.readdirSync(path.join(__dirname, '../contracts')).filter(name => name.endsWith('.sol'))) {
    sources[file] = {content: fs.readFileSync(path.join(__dirname, '../contracts', file), 'utf8')};
  }
  const input = {language: 'Solidity', sources, settings: {
    optimizer,
    evmVersion: 'shanghai',
    outputSelection: {'*': {'*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object']}}
  }};
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter(entry => entry.severity === 'error');
  if (errors.length) throw new Error(errors.map(entry => entry.formattedMessage).join('\n'));
  return Object.fromEntries(Object.values(output.contracts).flatMap(file => Object.entries(file)));
}

async function measure(label, optimizer) {
  const artifacts = compile(optimizer);
  const rpc = ganache.provider({chain: {chainId: 1337, hardfork: 'shanghai'}, logging: {quiet: true}});
  const provider = new BrowserProvider(rpc, undefined, {cacheTimeout: -1});
  provider.pollingInterval = 10;
  const [admin, customer, providerAccount] = await Promise.all([0, 1, 2].map(index => provider.getSigner(index)));
  const gas = {};
  async function deploy(name, args) {
    const contract = await new ContractFactory(artifacts[name].abi, artifacts[name].evm.bytecode.object, admin).deploy(...args);
    const receipt = await contract.deploymentTransaction().wait();
    gas[`deploy${name}`] = receipt.gasUsed.toString();
    return contract;
  }
  async function send(name, transaction) { gas[name] = (await (await transaction).wait()).gasUsed.toString(); }
  const roles = await deploy('RoleRegistry', [admin.address]);
  const orders = await deploy('EscrowOrders', [roles.target]);
  const resolver = await deploy('DisputeResolver', [roles.target, orders.target]);
  await send('setResolver', orders.setResolver(resolver.target));
  await send('registerCustomer', roles.connect(customer).register(1));
  await send('registerProvider', roles.connect(providerAccount).register(2));
  const block = await provider.getBlock('latest');
  const amount = parseEther('0.01');
  await send('createOrder', orders.connect(customer).createOrder(providerAccount.address, amount, block.timestamp + 3600, id('Gas terms')));
  await send('acceptOrder', orders.connect(providerAccount).acceptOrder(1));
  await send('fundOrder', orders.connect(customer).fundOrder(1, {value: amount}));
  await send('submitDelivery', orders.connect(providerAccount).submitDelivery(1, id('Gas delivery')));
  await send('openDispute', resolver.connect(providerAccount).openDispute(1, id('Gas dispute')));
  await send('addEvidence', resolver.connect(customer).addEvidence(1, id('Gas evidence')));
  await send('resolveProvider', resolver.resolve(1, true, id('Gas ruling')));
  await send('withdraw', orders.connect(providerAccount).withdraw());
  const runtimeBytes = Object.fromEntries(['RoleRegistry', 'EscrowOrders', 'DisputeResolver'].map(name => [name, artifacts[name].evm.deployedBytecode.object.length / 2]));
  await rpc.disconnect();
  return {label, optimizer, compiler: solc.version(), runtimeBytes, gas};
}

async function main() {
  const unoptimized = await measure('optimizer disabled', {enabled: false, runs: 0});
  const optimized = await measure('optimizer enabled, 200 runs', {enabled: true, runs: 200});
  const percentChange = {};
  for (const [operation, raw] of Object.entries(unoptimized.gas)) {
    percentChange[operation] = Number(((Number(optimized.gas[operation]) / Number(raw) - 1) * 100).toFixed(1));
  }
  const output = {
    generatedAt: new Date().toISOString(),
    environment: 'Ganache chain 1337, Shanghai; deterministic local comparison, not a Sepolia fee quote',
    unoptimized,
    optimized,
    optimizedGasPercentChangeVersusUnoptimized: percentChange
  };
  const destination = path.join(__dirname, '../docs/part3/evidence/gas-optimization.json');
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.writeFileSync(destination, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${destination}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
