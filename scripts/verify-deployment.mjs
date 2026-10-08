import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { readSnapshot, rpc, quantity, verifyProbeSnapshot, SAMPLE_ADDRESS } from '../dist/rpc.mjs';
const deployment = JSON.parse(await readFile(new URL('../dist/deployment.json', import.meta.url), 'utf8'));
const artifact = JSON.parse(await readFile(new URL('../dist/probe-artifact.json', import.meta.url), 'utf8'));
assert.equal(deployment.chainId, 5042);
assert.match(deployment.probeAddress || '', /^0x[0-9a-fA-F]{40}$/, 'A real deployed address is required');
assert.match(deployment.transactionHash || '', /^0x[0-9a-fA-F]{64}$/, 'A real creation transaction is required');
const snapshot = await readSnapshot(SAMPLE_ADDRESS);
const receipt = await rpc(snapshot.endpoint, 'eth_getTransactionReceipt', [deployment.transactionHash]);
assert.equal(quantity(receipt.status), 1n, 'Creation transaction failed');
assert.equal(receipt.contractAddress.toLowerCase(), deployment.probeAddress.toLowerCase(), 'Receipt address differs');
const transaction = await rpc(snapshot.endpoint, 'eth_getTransactionByHash', [deployment.transactionHash]);
assert.equal(transaction.to, null, 'Expected direct contract creation');
assert.equal(quantity(transaction.value), 0n, 'Creation must not transfer funds to the contract');
assert.equal(transaction.input.toLowerCase(), artifact.bytecode.toLowerCase(), 'Creation bytecode differs');
const helper = await verifyProbeSnapshot(snapshot, deployment.probeAddress, artifact);
const evidence = { deployment, helper, snapshot, receipt: { transactionHash: receipt.transactionHash,
  blockNumber: receipt.blockNumber, blockHash: receipt.blockHash, gasUsed: receipt.gasUsed,
  effectiveGasPrice: receipt.effectiveGasPrice, status: receipt.status },
  creation: { from: transaction.from, value: '0', fullBytecodeMatches: true },
  compiler: { version: artifact.compiler, sourceName: artifact.sourceName, evmVersion: artifact.evmVersion },
  feeNativeUnits: (quantity(receipt.gasUsed) * quantity(receipt.effectiveGasPrice)).toString() };
await writeFile(new URL('../evidence/deployed-verification.json', import.meta.url), JSON.stringify(evidence, (_key, value) => typeof value === 'bigint' ? value.toString() : value, 2) + '\n');
console.log(JSON.stringify({ deployed: true, verified: true, address: deployment.probeAddress, transactionHash: deployment.transactionHash }));
