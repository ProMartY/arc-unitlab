# ArcUnitLab

An exact USDC unit converter, live Arc mainnet balance cross-check, and native-transfer gas budget preview. Built for the difference between Arc's 18-decimal native USDC and its 6-decimal ERC-20 interface.

**Current state:** the public web application reads real Arc mainnet data (chain 5042). `UnitProbe` compiles and has passed read-only execution against mainnet state using a temporary `eth_call` state override. The helper contract is **not deployed yet**; `dist/deployment.json` records this explicitly. Wallet connection on the site is paused after a MetaMask website warning; see `docs/security-review.md`. Do not describe the helper as deployed until a real receipt and its runtime bytecode are verified.

- [Live application](https://arc-unitlab.promarty766.chatgpt.site)
- [Public source repository](https://github.com/ProMartY/arc-unitlab)

## What it does

- Converts decimal strings with `BigInt`, without floating-point rounding.
- Shows how reusing an ERC-20 raw integer as transaction `value` changes the amount by a factor of 10¹².
- Reads both balance interfaces at one canonical block hash using EIP-1898; reports native dust below one micro-USDC.
- Checks the provider's chain ID and USDC decimals before displaying results; retries the whole snapshot on provider failure.
- Computes `amount + gasLimit × feeCeiling`, clearly labeling the gas parameters as assumptions.
- Exports a snapshot with raw values, block hash, provider, and observation time.
- Once configured, checks deployed helper runtime bytecode and its read-only result against the direct mainnet reads at the same block.

The main app requires no wallet connection. Public RPC providers receive the queried public address and the browser's normal network metadata. Wallet connection and signing have been removed from the owner page while the website warning is investigated. The site never requests keys or seed phrases.

## Run locally

Node.js 22+ is sufficient for the app and tests. Solidity compilation uses the pinned `solc` version in `package-lock.json`.

```sh
npm ci --ignore-scripts
npm run compile
npm test
npm run preview
```

Open `http://127.0.0.1:4173`. Static hosts can serve `dist` directly; no backend, API key, account, or build step is needed after the contract artifact is generated.

```sh
npm run verify:mainnet
```

This reads live public state, executes the helper through a temporary simulation if supported, and estimates creation gas. It sends no transaction and spends no funds. Evidence is written to `evidence/mainnet-verification.json`; it is a dated observation, not a promise of current balances or fees.

## Helper deployment

`contracts/UnitProbe.sol` has no custody, transfers, mutable state, owner privileges, or approval requests. It exposes `walletSnapshot` and `previewNativeTransfer` as view functions. Arithmetic uses Solidity's checked operations.

The former `/deploy.html` wallet workflow is disabled. Do not override MetaMask's website warning or disable wallet protections. Deployment requires an independently reviewed owner handoff through a trusted development tool, with the network, exact contract source, compilation settings, zero transaction value, and fresh fee quote checked before signing.

After deployment, save the returned record into `dist/deployment.json`, run the live verification described in `docs/deployment.md`, and publish the updated app. The app then calls the deployed helper on each balance check.

## Limits

- This app computes a budget, not a sendable transaction or a recipient-specific gas estimate. 21,000 gas is a visible example assumption; actual Arc transaction gas can differ.
- Public providers may be unavailable or rate-limit requests. The app fails visibly rather than showing invented live data.
- Native dust is exposed, not discarded. The ERC-20 unit conversion explicitly labels truncation.
- This is a small experimental tool, not a wallet or an audited financial service.

## References

- [Arc connection parameters](https://docs.arc.io/arc/references/connect-to-arc)
- [USDC contract and decimal interfaces](https://docs.arc.io/arc/references/contract-addresses)
- [Arc gas and fees](https://docs.arc.io/arc/references/gas-and-fees)

MIT licensed; see `LICENSE`.
