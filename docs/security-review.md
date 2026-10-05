# Website warning review — 2026-10-05

The owner observed MetaMask's website phishing / wallet-draining warning while requesting account access at `https://arc-unitlab.promarty766.chatgpt.site/deploy`. The connection and signing workflow is paused. The website now makes no wallet requests, including on the retired owner page. Do not override the warning or disable wallet security features.

## Findings

- The published `deploy.mjs` SHA-256 matched the local committed file: `0C849F9D466CD79315EB47CAE360473AE46C4831514FCE5C4ED6E54AB015F2E2`.
- The published `probe-artifact.json` SHA-256 matched the locally compiled artifact: `2B2E9140437DD96991CC7541E40804E7207084F433DD1D61CA843704A0E16158`.
- The original account-access button requested accounts, chain selection, balances, fee data and a deployment estimate. Contract creation was a separate explicit click. The source contained no token approvals, permit signatures, message signatures, or transfers to a third-party address.
- UnitProbe's four ABI functions are `view`. Its runtime is 1,011 bytes, with no custody or transfer functions.
- The site's extra inline script loaded a Cloudflare challenge endpoint. This was observed, not independently audited.
- A current download of MetaMask's public `eth-phishing-detect` config contained 102,699 blacklist entries. No exact or parent-domain match was found for this hostname. This does **not** identify the engine producing the observed warning or clear the site's classification; additional services and rules may be involved.

The exact reason for the warning remains unknown. These findings are not an independent security audit or clearance from MetaMask.

## Next actions

Prepare a classification-review request through official MetaMask support. Do not submit owner details or screenshots without the owner's authorization. Wallet interaction remains disabled while this is unresolved. Mainnet deployment, any funding, and any signature require a separately reviewed handoff to the owner.

References:
- https://support.metamask.io/configure/wallet/security-alerts
- https://github.com/MetaMask/eth-phishing-detect
