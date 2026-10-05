import test from 'node:test';
import assert from 'node:assert/strict';
import { readSnapshot, SAMPLE_ADDRESS, normalizeAddress, quantity } from '../dist/rpc.mjs';
const hash = '0x' + 'ab'.repeat(32), endpoint = 'https://example.test';
function fixture({ chain = '0x13b2', decimals = '0x6', missing = false } = {}) {
  const calls = [];
  const fetcher = async (_url, options) => {
    const request = JSON.parse(options.body); calls.push(request);
    let result;
    if (request.method === 'eth_chainId') result = chain;
    else if (request.method === 'eth_getBlockByNumber') result = { number: '0x12', hash };
    else if (request.method === 'eth_getBalance') result = '0xde0b6b3a7640007';
    else if (request.method === 'eth_gasPrice') result = '0x4a817ef10';
    else if (request.method === 'eth_call') result = request.params[0].data === '0x313ce567' ? decimals : '0xf4240';
    return { ok: true, json: async () => missing ? {} : { result } };
  };
  return { fetcher, calls };
}
test('all balance calls use one canonical block hash', async () => {
  const { fetcher, calls } = fixture();
  const result = await readSnapshot(SAMPLE_ADDRESS, { providers: [endpoint], fetcher });
  assert.equal(result.consistent, true); assert.equal(result.nativeDustUnits, 7n);
  const reads = calls.filter(call => ['eth_getBalance', 'eth_call'].includes(call.method));
  assert.equal(reads.length, 3);
  reads.forEach(call => assert.deepEqual(call.params[1], { blockHash: hash, requireCanonical: true }));
});
test('wrong chain cannot be presented as Arc mainnet', async () => {
  const { fetcher, calls } = fixture({ chain: '0x1' });
  await assert.rejects(readSnapshot(SAMPLE_ADDRESS, { providers: [endpoint], fetcher }), /not Arc mainnet/);
  assert.equal(calls.length, 1);
});
test('unexpected token precision stops comparison', async () => {
  await assert.rejects(readSnapshot(SAMPLE_ADDRESS, { providers: [endpoint], fetcher: fixture({ decimals: '0x12' }).fetcher }), /Unexpected USDC decimals/);
});
test('invalid addresses are rejected before making requests', async () => {
  let calls = 0;
  await assert.rejects(readSnapshot('0x123', { fetcher: async () => { calls++; } }), /complete 0x address/);
  assert.equal(calls, 0);
});
test('missing RPC results cannot become zero balances', async () => {
  await assert.rejects(readSnapshot(SAMPLE_ADDRESS, { providers: [endpoint], fetcher: fixture({ missing: true }).fetcher }), /no result/);
});
test('failover restarts the complete snapshot on the next provider', async () => {
  const valid = fixture();
  const fetcher = async (url, options) => url.includes('unavailable') ? Promise.reject(new Error('offline')) : valid.fetcher(url, options);
  const result = await readSnapshot(SAMPLE_ADDRESS, { providers: ['https://unavailable.test', endpoint], fetcher });
  assert.equal(result.endpoint, endpoint); assert.equal(valid.calls[0].method, 'eth_chainId');
});
test('hex quantities and addresses reject ambiguous input', () => {
  assert.throws(() => quantity(null)); assert.throws(() => quantity('10')); assert.throws(() => normalizeAddress('0x' + 'g'.repeat(40)));
});
