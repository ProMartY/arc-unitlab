import test from 'node:test';
import assert from 'node:assert/strict';
import { parseUsdc, formatUsdc, erc20ToNative, nativeToErc20, inspectBalance, previewNativeTransfer } from '../dist/units.mjs';

test('one dollar has distinct, exact representations', () => {
  assert.equal(parseUsdc('1', 6), 1_000_000n);
  assert.equal(parseUsdc('1', 18), 1_000_000_000_000_000_000n);
  assert.equal(erc20ToNative(parseUsdc('0.50', 6)), parseUsdc('0.50', 18));
});

test('amounts larger than JavaScript safe integers retain precision', () => {
  const amount = '9007199254740993.123456';
  assert.equal(formatUsdc(parseUsdc(amount, 6), 6), amount);
});

test('native dust is reported rather than silently discarded', () => {
  assert.deepEqual(nativeToErc20(1_000_000_000_001n), {
    erc20Units: 1n, nativeDustUnits: 1n, exact: false,
  });
});

test('same-block comparisons tolerate only sub-micro-USDC dust', () => {
  assert.equal(inspectBalance(1_000_000_000_001n, 1n).consistent, true);
  assert.equal(inspectBalance(1_999_999_999_999n, 1n).consistent, true);
  assert.equal(inspectBalance(2_000_000_000_000n, 1n).consistent, false);
  assert.equal(inspectBalance(999_999_999_999n, 1n).consistent, false);
});

test('mixed scales are detected, not displayed as two independent assets', () => {
  const comparison = inspectBalance(parseUsdc('10', 18), parseUsdc('10', 6));
  assert.equal(comparison.consistent, true);
  assert.equal(comparison.nativeDisplay, '10');
  assert.equal(comparison.erc20Display, '10');
  assert.equal(inspectBalance(parseUsdc('10', 18), parseUsdc('10', 18)).consistent, false);
});

test('full-balance transfers reserve gas in the same currency', () => {
  const preview = previewNativeTransfer({
    balance: parseUsdc('1', 18), amount: parseUsdc('1', 18),
    gasLimit: 21_000n, maxFeePerGas: 20_000_000_000n,
  });
  assert.equal(preview.affordable, false);
  assert.equal(preview.maximumGasCostUsdc, '0.00042');
  assert.equal(preview.requiredBalanceUsdc, '1.00042');
});

test('a sufficient balance covers the configured maximum gas cost', () => {
  const preview = previewNativeTransfer({
    balance: parseUsdc('1.00042', 18), amount: parseUsdc('1', 18),
    gasLimit: 21_000n, maxFeePerGas: 20_000_000_000n,
  });
  assert.equal(preview.affordable, true);
  assert.equal(preview.shortage, 0n);
});

test('precision is never rounded without permission', () => {
  assert.throws(() => parseUsdc('0.0000001', 6), RangeError);
  assert.equal(parseUsdc('0.0000001', 18), 100_000_000_000n);
  assert.equal(parseUsdc('0', 0), 0n);
});

test('ambiguous, signed, or exponent input is rejected', () => {
  for (const value of ['1e6', '-1', '1,000', ' 1', 'NaN', '', '1.']) {
    assert.throws(() => parseUsdc(value, 6));
  }
  assert.throws(() => parseUsdc(1, 6));
  assert.throws(() => formatUsdc(-1n, 6));
  assert.throws(() => parseUsdc('1', 19));
});

test('round trips preserve both decimal interfaces across boundary values', () => {
  for (const decimals of [6, 18]) {
    for (const amount of ['0', '0.1', '1.000001', '999999999999.123456']) {
      const units = parseUsdc(amount, decimals);
      assert.equal(parseUsdc(formatUsdc(units, decimals), decimals), units);
    }
  }
});
