import { USDC_ADDRESS, inspectBalance } from './units.mjs';

export const PROVIDERS = Object.freeze([
  'https://rpc.blockdaemon.mainnet.arc.io',
  'https://rpc.drpc.mainnet.arc.io',
  'https://rpc.quicknode.mainnet.arc.io',
]);
export const SAMPLE_ADDRESS = '0x8e3b02a3e335b0ef8f67cb1f0d7580a9efbafe77';
export function normalizeAddress(address) {
  if (typeof address !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error('Enter a complete 0x address (40 hexadecimal characters).');
  return address.toLowerCase();
}
export function quantity(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]+$/.test(value)) throw new Error('The provider returned an invalid quantity.');
  return BigInt(value);
}
export async function rpc(endpoint, method, params = [], fetcher = fetch) {
  const response = await fetcher(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Provider HTTP ${response.status}.`);
  const body = await response.json();
  if (body.error) throw new Error(body.error.message || 'Provider rejected the request.');
  if (body.result === undefined || body.result === null) throw new Error('Provider returned no result.');
  return body.result;
}
export async function readSnapshot(address, { providers = PROVIDERS, fetcher = fetch } = {}) {
  address = normalizeAddress(address);
  const errors = [];
  for (const endpoint of providers) {
    try {
      const call = (method, params) => rpc(endpoint, method, params, fetcher);
      if (quantity(await call('eth_chainId')) !== 5042n) throw new Error('Provider is not Arc mainnet (5042).');
      const block = await call('eth_getBlockByNumber', ['latest', false]);
      quantity(block.number);
      if (!/^0x[0-9a-fA-F]{64}$/.test(block.hash)) throw new Error('Invalid block hash.');
      const blockRef = { blockHash: block.hash, requireCanonical: true };
      const [nativeHex, tokenHex, decimalsHex, gasHex] = await Promise.all([
        call('eth_getBalance', [address, blockRef]),
        call('eth_call', [{ to: USDC_ADDRESS, data: '0x70a08231' + address.slice(2).padStart(64, '0') }, blockRef]),
        call('eth_call', [{ to: USDC_ADDRESS, data: '0x313ce567' }, blockRef]),
        call('eth_gasPrice'),
      ]);
      if (quantity(decimalsHex) !== 6n) throw new Error('Unexpected USDC decimals; comparison stopped.');
      const nativeUnits = quantity(nativeHex), erc20Units = quantity(tokenHex), gasPrice = quantity(gasHex);
      return { address, endpoint, block: block.number, blockHash: block.hash,
        observedAt: new Date().toISOString(), nativeUnits, erc20Units, gasPrice,
        ...inspectBalance(nativeUnits, erc20Units) };
    } catch (error) { errors.push(`${new URL(endpoint).hostname}: ${error.message}`); }
  }
  throw new Error('Live data unavailable. ' + errors.join(' | '));
}

export async function verifyProbeSnapshot(snapshot, probeAddress, artifact, fetcher = fetch) {
  probeAddress = normalizeAddress(probeAddress);
  const blockRef = { blockHash: snapshot.blockHash, requireCanonical: true };
  const code = await rpc(snapshot.endpoint, 'eth_getCode', [probeAddress, blockRef], fetcher);
  if (code.toLowerCase() !== artifact.deployedBytecode.toLowerCase()) throw new Error('Helper bytecode differs from the published artifact.');
  const data = '0x' + artifact.methodIdentifiers['walletSnapshot(address)'] + snapshot.address.slice(2).padStart(64, '0');
  const result = await rpc(snapshot.endpoint, 'eth_call', [{ to: probeAddress, data }, blockRef], fetcher);
  if (!/^0x(?:[0-9a-fA-F]{64}){7}$/.test(result)) throw new Error('Invalid helper response.');
  const words = result.slice(2).match(/.{64}/g).map(value => BigInt('0x' + value));
  if (words[0] !== 5042n || words[1] !== snapshot.nativeUnits || words[2] !== snapshot.erc20Units || words[3] !== 6n
    || words[4] !== (snapshot.consistent ? 1n : 0n) || words[5] !== (snapshot.exact ? 1n : 0n)
    || words[6] !== (snapshot.nativeDustUnits ?? 0n)) throw new Error('Helper response disagrees with the direct mainnet reads.');
  return { address: probeAddress, verified: true, blockHash: snapshot.blockHash };
}
