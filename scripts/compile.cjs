const fs = require('node:fs');
const path = require('node:path');
const solc = require('solc');
function compile(extra = {}) {
  const sources = {...extra};
  for (const file of fs.readdirSync(path.join(__dirname, '../contracts')).filter(x => x.endsWith('.sol'))) {
    sources[file] = {content: fs.readFileSync(path.join(__dirname, '../contracts', file), 'utf8')};
  }
  const output = JSON.parse(solc.compile(JSON.stringify({language:'Solidity', sources, settings:{optimizer:{enabled:true,runs:200},evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}})));
  const errors = (output.errors || []).filter(e => e.severity === 'error');
  if (errors.length) throw new Error(errors.map(e => e.formattedMessage).join('\n'));
  const contracts = {};
  for (const file of Object.values(output.contracts)) for (const [name, artifact] of Object.entries(file)) {
    if (artifact.evm.bytecode.object) contracts[name] = artifact;
  }
  return contracts;
}
if (require.main === module) {
  const artifacts = compile();
  fs.mkdirSync('static/contracts', {recursive:true});
  fs.mkdirSync('artifacts', {recursive:true});
  for (const [name, value] of Object.entries(artifacts)) {
    fs.writeFileSync(`static/contracts/${name}.abi.json`, JSON.stringify(value.abi, null, 2)+'\n');
    fs.writeFileSync(`static/contracts/${name}.deploy.json`, JSON.stringify({abi:value.abi,bytecode:'0x'+value.evm.bytecode.object},null,2)+'\n');
    fs.writeFileSync(`artifacts/${name}.json`, JSON.stringify(value, null, 2)+'\n');
  }
  console.log('Compiled '+Object.keys(artifacts).join(', ')+' with '+solc.version());
}
module.exports = {compile};
