import solc from 'solc';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const source = await readFile(new URL('../contracts/UnitProbe.sol', import.meta.url), 'utf8');
const input = { language: 'Solidity', sources: { 'UnitProbe.sol': { content: source } },
  settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'paris',
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object', 'evm.methodIdentifiers'] } } } };
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors || []).filter(error => error.severity === 'error');
if (errors.length) throw new Error(errors.map(error => error.formattedMessage).join('\n'));
const contract = output.contracts['UnitProbe.sol'].UnitProbe;
const artifact = { contractName: 'UnitProbe', compiler: solc.version(), evmVersion: 'paris',
  abi: contract.abi, bytecode: '0x' + contract.evm.bytecode.object,
  deployedBytecode: '0x' + contract.evm.deployedBytecode.object, methodIdentifiers: contract.evm.methodIdentifiers };
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/probe-artifact.json', import.meta.url), JSON.stringify(artifact, null, 2) + '\n');
console.log(JSON.stringify({ compiled: true, compiler: artifact.compiler, runtimeBytes: (artifact.deployedBytecode.length - 2) / 2 }));
