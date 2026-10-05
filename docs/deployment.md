# Owner deployment and final verification

1. Publish the `dist` folder as the demo; enable public access before giving its URL to reviewers.
2. Wallet connection on this site is paused following a MetaMask warning. Do not override it. Agree on an independently reviewed deployment handoff through a trusted development tool, check chain 5042 and a fresh fee quote, and let the owner approve the creation transaction. Keep transaction value at zero. Source and compilation settings must match the artifact.
3. Record the verified creation transaction and contract address in `dist/deployment.json`. No private keys are needed.
4. Run `node scripts/verify-deployment.mjs`. It verifies chain ID, receipt success, deployed address, exact runtime bytecode, and a live `walletSnapshot` call against direct reads at one block hash. It refuses pending or failed receipts and saves evidence to `evidence/deployed-verification.json`.
5. Update the README's current-state paragraph and application draft with actual public URLs and verified contract links. Re-publish the changed app, then click the public example: the status must explicitly say the deployed helper was verified.
6. Publish the repository with the MIT license, sources, compiled artifact, tests, and evidence. Exclude `node_modules`, `.git`, hosting credentials, and local environment files.
7. Sign in to DoraHacks and submit the completed build through the Arc Microgrants event. Check every ownership, eligibility, privacy, and terms statement before accepting it.

The earlier state-override simulation is not deployment evidence. Do not submit the project as contract-deployed while `probeAddress` remains null.
