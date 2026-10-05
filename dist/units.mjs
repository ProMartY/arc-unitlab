// ArcUnitLab draft: exact USDC arithmetic, without wallet access or payments.
// Reference: https://docs.arc.io/arc/references/contract-addresses
export const NATIVE_DECIMALS = 18;
export const ERC20_DECIMALS = 6;
export const SCALE = 10n ** 12n;
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
export const ARC_MAINNET = Object.freeze({
  chainId: 5042,
  rpcUrl: 'https://rpc.mainnet.arc.io',
  explorerUrl: 'https://explorer.arc.io',
});

function checkedUnits(value, label = 'amount') {
  if (typeof value !== 'bigint' || value < 0n) {
    throw new TypeError(`${label} must be a non-negative bigint`);
  }
  return value;
}

function checkedDecimals(decimals) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new RangeError('Decimals must be an integer between 0 and 18');
  }
}

export function parseUsdc(text, decimals) {
  checkedDecimals(decimals);
  if (typeof text !== 'string' || text.length > 100 || !/^\d+(?:\.\d+)?$/.test(text)) {
    throw new TypeError('Use an unsigned decimal string, for example 0.50');
  }
  const [whole, fraction = ''] = text.split('.');
  if (fraction.length > decimals) {
    throw new RangeError('Amount has more decimal places than this interface supports');
  }
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
}

export function formatUsdc(units, decimals) {
  checkedUnits(units);
  checkedDecimals(decimals);
  if (decimals === 0) return units.toString();
  const scale = 10n ** BigInt(decimals);
  const fraction = (units % scale).toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${units / scale}${fraction ? `.${fraction}` : ''}`;
}

export function erc20ToNative(erc20Units) {
  return checkedUnits(erc20Units) * SCALE;
}

export function nativeToErc20(nativeUnits) {
  checkedUnits(nativeUnits);
  return {
    erc20Units: nativeUnits / SCALE,
    nativeDustUnits: nativeUnits % SCALE,
    exact: nativeUnits % SCALE === 0n,
  };
}

export function inspectBalance(nativeUnits, erc20Units) {
  checkedUnits(nativeUnits, 'native balance');
  checkedUnits(erc20Units, 'ERC-20 balance');
  const difference = nativeUnits - erc20ToNative(erc20Units);
  // The ERC-20 interface cannot express fractions below one micro-USDC.
  // Read both balances at the same block before comparing them.
  return {
    consistent: difference >= 0n && difference < SCALE,
    exact: difference === 0n,
    nativeDustUnits: difference >= 0n && difference < SCALE ? difference : null,
    nativeDisplay: formatUsdc(nativeUnits, NATIVE_DECIMALS),
    erc20Display: formatUsdc(erc20Units, ERC20_DECIMALS),
  };
}

export function previewNativeTransfer({ balance, amount, gasLimit, maxFeePerGas }) {
  checkedUnits(balance, 'balance');
  checkedUnits(amount, 'amount');
  checkedUnits(gasLimit, 'gas limit');
  checkedUnits(maxFeePerGas, 'maximum fee per gas');
  const maximumGasCost = gasLimit * maxFeePerGas;
  const requiredBalance = amount + maximumGasCost;
  return {
    maximumGasCost,
    requiredBalance,
    affordable: balance >= requiredBalance,
    shortage: balance < requiredBalance ? requiredBalance - balance : 0n,
    maximumGasCostUsdc: formatUsdc(maximumGasCost, NATIVE_DECIMALS),
    requiredBalanceUsdc: formatUsdc(requiredBalance, NATIVE_DECIMALS),
  };
}
