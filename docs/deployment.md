# Owner deployment and final verification

## Verified live deployment

- Arc mainnet, chain 5042: `0x1A36510311C972b6ca0f22318c15108A9fb831A8`
- Creation transaction: `0x2d56fb9823efa59564a33c676662216fdc626571101da3a86679bd1d23fa487e`
- Created October 8, 2026 at 09:59:21 UTC, block 24883063.
- Transaction value: zero. Actual network fee: 0.0058398085 USDC (271619 gas at 21.5 Gwei).
- Compiler: 0.8.30, optimizer 200, EVM Paris; virtual source name `ProMartY/arc-unitlab/contracts/UnitProbe.sol`.
- Both creation and full runtime bytecode, including metadata, match the reproduced build. The live helper's seven-field snapshot matches direct RPC reads at one block hash.

## Reproduce verification and prepare a submission

1. Publish the `dist` folder as the demo; enable public access before giving its URL to reviewers.
2. Wallet connection on this site is paused following a MetaMask warning. Do not override it. Agree on an independently reviewed deployment handoff through a trusted development tool, check chain 5042 and a fresh fee quote, and let the owner approve the creation transaction. Keep transaction value at zero. Source and compilation settings must match the artifact.
3. Record the verified creation transaction and contract address in `dist/deployment.json`. No private keys are needed.
4. Run `node scripts/verify-deployment.mjs`. It verifies chain ID, receipt success, deployed address, exact runtime bytecode, and a live `walletSnapshot` call against direct reads at one block hash. It refuses pending or failed receipts and saves evidence to `evidence/deployed-verification.json`.
5. Update the README's current-state paragraph and application draft with actual public URLs and verified contract links. Re-publish the changed app, then click the public example: the status must explicitly say the deployed helper was verified.
6. Publish the repository with the MIT license, sources, compiled artifact, tests, and evidence. Exclude `node_modules`, `.git`, hosting credentials, and local environment files.
7. Sign in to DoraHacks and submit the completed build through the Arc Microgrants event. Check every ownership, eligibility, privacy, and terms statement before accepting it.

The earlier state-override simulation is not deployment evidence. Do not submit the project as contract-deployed while `probeAddress` remains null.
