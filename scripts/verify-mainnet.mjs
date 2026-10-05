import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { readSnapshot, rpc, quantity, SAMPLE_ADDRESS } from '../dist/rpc.mjs';
import { formatUsdc } from '../dist/units.mjs';
const snapshot = await readSnapshot(SAMPLE_ADDRESS);
assert.equal(snapshot.consistent, true, 'Live native/ERC-20 balances disagree');
const artifact = JSON.parse(await readFile(new URL('../dist/probe-artifact.json', import.meta.url), 'utf8'));
const virtualAddress = '0x000000000000000000000000000000000000f00d';
const blockRef = { blockHash: snapshot.blockHash, requireCanonical: true };
const override = { [virtualAddress]: { code: artifact.deployedBytecode } };
const word = value => BigInt(value).toString(16).padStart(64, '0');
const decode = hex => {
  if (!/^0x(?:[0-9a-fA-F]{64})+$/.test(hex)) throw new Error('Invalid ABI result');
  return hex.slice(2).match(/.{64}/g).map(value => BigInt('0x' + value));
};
let simulation = { status: 'unsupported', deployed: false };
try {
  const selector = artifact.methodIdentifiers['walletSnapshot(address)'];
  const result = decode(await rpc(snapshot.endpoint, 'eth_call', [{ to: virtualAddress,
    data: '0x' + selector + SAMPLE_ADDRESS.slice(2).padStart(64, '0') }, blockRef, override]));
  assert.equal(result.length, 7); assert.equal(result[0], 5042n);
  assert.equal(result[1], snapshot.nativeUnits); assert.equal(result[2], snapshot.erc20Units);
  assert.equal(result[3], 6n); assert.equal(result[4], 1n);
  assert.equal(result[6], snapshot.nativeDustUnits);
  const gas = 21000n, fee = snapshot.gasPrice * 2n;
  const feeSelector = artifact.methodIdentifiers['previewNativeTransfer(address,uint256,uint256,uint256)'];
  const callBudget = async amount => decode(await rpc(snapshot.endpoint, 'eth_call', [{ to: virtualAddress,
    data: '0x' + feeSelector + SAMPLE_ADDRESS.slice(2).padStart(64, '0') + word(amount) + word(gas) + word(fee) }, blockRef, override]));
  const full = await callBudget(snapshot.nativeUnits), zero = await callBudget(0n);
  assert.equal(full.length, 4); assert.equal(full[0], snapshot.nativeUnits);
  assert.equal(full[1], gas * fee); assert.equal(full[2], snapshot.nativeUnits + gas * fee); assert.equal(full[3], 0n);
  assert.equal(zero[3], snapshot.nativeUnits >= gas * fee ? 1n : 0n);
  simulation = { status: 'passed', deployed: false, method: 'eth_call with temporary state override',
    checks: ['balance matches direct reads', 'chain 5042', 'USDC decimals 6', 'precision reconciliation', 'full balance cannot cover gas', 'zero amount budget'] };
} catch (error) {
  if (error.code === 'ERR_ASSERTION') throw error;
  simulation.message = error.message;
}
let deploymentEstimate;
try {
  const gasLimit = quantity(await rpc(snapshot.endpoint, 'eth_estimateGas', [{ from: SAMPLE_ADDRESS, data: artifact.bytecode, value: '0x0' }]));
  deploymentEstimate = { gasLimit: gasLimit.toString(), observedGasPriceWei: snapshot.gasPrice.toString(),
    feeCeilingWei: (snapshot.gasPrice * 2n).toString(), feeCeilingUsdc: formatUsdc(gasLimit * snapshot.gasPrice * 2n, 18),
    note: 'Read-only simulation from a public example address, not a deployment or purchase. Re-estimate with owner wallet before signing.' };
} catch (error) { deploymentEstimate = { error: error.message }; }
const evidence = { ...snapshot, contractSimulation: simulation, deploymentEstimate,
  references: ['https://docs.arc.io/arc/references/connect-to-arc', 'https://docs.arc.io/arc/references/contract-addresses'] };
const serialize = (_key, value) => typeof value === 'bigint' ? value.toString() : value;
await writeFile(new URL('../evidence/mainnet-verification.json', import.meta.url), JSON.stringify(evidence, serialize, 2) + '\n');
console.log(JSON.stringify({ liveMainnet: true, block: BigInt(snapshot.block).toString(), consistent: snapshot.consistent,
  nativeDustUsdc: formatUsdc(snapshot.nativeDustUnits, 18), contractSimulation: simulation, deploymentEstimate }, serialize));
