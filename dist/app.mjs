import { parseUsdc, formatUsdc, nativeToErc20, previewNativeTransfer } from './units.mjs';
import { readSnapshot, verifyProbeSnapshot, SAMPLE_ADDRESS } from './rpc.mjs';
const $ = id => document.getElementById(id);
let snapshot = null;
const configuration = Promise.all([
  fetch('./deployment.json').then(response => response.json()),
  fetch('./probe-artifact.json').then(response => response.json()),
]);
function amountChanged() {
  try {
    const amount = parseUsdc($('amount').value.trim(), 18);
    const token = nativeToErc20(amount);
    $('native-raw').textContent = amount.toString();
    $('token-raw').textContent = token.erc20Units.toString() + (token.exact ? '' : ' (truncated)');
    $('unit-warning').replaceChildren();
    $('unit-warning').textContent = token.exact
      ? `Using the ERC-20 number as native value sends ${formatUsdc(token.erc20Units, 18)} USDC, instead of ${formatUsdc(amount, 18)}.`
      : `ERC-20 cannot express this exact amount. ${formatUsdc(token.nativeDustUnits, 18)} USDC would be lost by truncating to 6 decimals. No rounding is applied here.`;
    $('amount-error').hidden = true;
  } catch (error) {
    $('amount-error').textContent = error.message; $('amount-error').hidden = false;
    $('native-raw').textContent = '—'; $('token-raw').textContent = '—';
    $('unit-warning').textContent = 'Enter a valid amount to compare units.';
  }
  budgetChanged();
}
function budgetChanged() {
  try {
    const gasText = $('gas-limit').value.trim();
    if (!/^\d+$/.test(gasText) || BigInt(gasText) <= 0n) throw new Error('Gas limit must be a positive whole number.');
    const result = previewNativeTransfer({ balance: parseUsdc($('budget-balance').value.trim(), 18),
      amount: parseUsdc($('amount').value.trim(), 18), gasLimit: BigInt(gasText),
      maxFeePerGas: parseUsdc($('fee').value.trim(), 9) });
    if (parseUsdc($('fee').value.trim(), 9) === 0n) throw new Error('Use a positive fee ceiling.');
    $('gas-budget').textContent = result.maximumGasCostUsdc + ' USDC';
    $('required').textContent = result.requiredBalanceUsdc + ' USDC';
    $('affordability').textContent = result.affordable ? 'Covered under these assumptions' : `Short by ${formatUsdc(result.shortage, 18)} USDC`;
    $('affordability').classList.toggle('success', result.affordable);
    $('budget-error').hidden = true;
  } catch (error) {
    $('budget-error').textContent = error.message; $('budget-error').hidden = false;
    $('gas-budget').textContent = '—'; $('required').textContent = '—'; $('affordability').textContent = 'Check the inputs';
    $('affordability').classList.remove('success');
  }
}
async function checkWallet(event) {
  event?.preventDefault();
  $('check').disabled = true; $('example').disabled = true;
  $('wallet-status').classList.remove('fail');
  $('wallet-status').textContent = 'Reading Arc mainnet. Balances are pinned to the same block hash…';
  $('balance-result').hidden = true; $('wallet-empty').hidden = true;
  snapshot = null;
  try {
    snapshot = await readSnapshot($('address').value.trim());
    const [deployment, artifact] = await configuration;
    if (deployment.probeAddress) snapshot.helper = await verifyProbeSnapshot(snapshot, deployment.probeAddress, artifact);
    $('native-balance').textContent = snapshot.nativeDisplay;
    $('token-balance').textContent = snapshot.erc20Display + ' USDC';
    $('comparison').textContent = snapshot.consistent ? (snapshot.exact ? 'Exact match' : 'Match within ERC-20 precision') : 'Mismatch — investigate before use';
    $('comparison').classList.toggle('success', snapshot.consistent);
    $('dust').textContent = snapshot.nativeDustUnits === null ? 'Cannot reconcile' : formatUsdc(snapshot.nativeDustUnits, 18) + ' USDC';
    $('block-link').textContent = BigInt(snapshot.block).toString();
    $('block-link').href = 'https://explorer.arc.io/block/' + BigInt(snapshot.block).toString();
    $('snapshot-native').textContent = snapshot.nativeUnits.toString();
    $('snapshot-token').textContent = snapshot.erc20Units.toString();
    $('provider').textContent = new URL(snapshot.endpoint).hostname;
    $('observed').textContent = snapshot.observedAt;
    $('wallet-status').textContent = snapshot.helper
      ? 'Live mainnet snapshot. Deployed helper bytecode and output verified at the same block.'
      : 'Live mainnet snapshot. Refresh by checking the address again.';
    $('balance-result').hidden = false;
    $('budget-balance').value = snapshot.nativeDisplay;
    $('budget-source').textContent = 'Live snapshot for ' + snapshot.address.slice(0, 8) + '…' + snapshot.address.slice(-6) + '.';
    $('fee').value = formatUsdc(snapshot.gasPrice * 2n, 9);
    $('fee-source').textContent = `Ceiling set to 2× observed gas price (${formatUsdc(snapshot.gasPrice, 9)} Gwei). Editable assumption.`;
    budgetChanged();
  } catch (error) {
    $('wallet-status').textContent = error.message; $('wallet-status').classList.add('fail');
    $('wallet-empty').hidden = false;
    // Remove the previous wallet's balance when a new check fails.
    $('budget-balance').value = '10'; $('budget-source').textContent = 'Simulated balance; no current live snapshot.';
    $('fee').value = '40'; $('fee-source').textContent = 'Example ceiling; editable.'; budgetChanged();
  } finally { $('check').disabled = false; $('example').disabled = false; }
}
$('amount').addEventListener('input', amountChanged);
document.querySelectorAll('[data-amount]').forEach(button => button.addEventListener('click', () => { $('amount').value = button.dataset.amount; amountChanged(); }));
['budget-balance', 'gas-limit', 'fee'].forEach(id => $(id).addEventListener('input', () => {
  if (id === 'budget-balance') $('budget-source').textContent = 'Manual balance assumption.';
  if (id === 'fee') $('fee-source').textContent = 'Manual fee ceiling assumption.';
  budgetChanged();
}));
$('wallet-form').addEventListener('submit', checkWallet);
$('example').addEventListener('click', () => { $('address').value = SAMPLE_ADDRESS; checkWallet(); });
$('full-balance').addEventListener('click', () => { $('amount').value = $('budget-balance').value; amountChanged(); });
$('download').addEventListener('click', () => {
  if (!snapshot) return;
  const blob = new Blob([JSON.stringify(snapshot, (_key, value) => typeof value === 'bigint' ? value.toString() : value, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = 'arc-unitlab-snapshot.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
configuration.then(([deployment]) => {
  if (/^0x[0-9a-fA-F]{40}$/.test(deployment.probeAddress || '')) {
    const link = document.createElement('a'); link.href = 'https://explorer.arc.io/address/' + deployment.probeAddress;
    link.textContent = 'Read-only helper on mainnet ↗'; link.target = '_blank'; link.rel = 'noopener noreferrer';
    $('probe-status').replaceChildren(link);
  }
}).catch(() => {});
amountChanged();
