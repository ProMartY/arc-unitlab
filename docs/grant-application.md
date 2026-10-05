# Arc Microgrants — prepared submission

**Draft: not submitted.** Complete public links, owner profile, real contract deployment, and the owner's eligibility statements before submitting. Do not copy unresolved placeholders into DoraHacks.

## Project name

ArcUnitLab

## One-line description

Exact USDC units, same-block balance reconciliation, and gas-budget checks for Arc mainnet.

## Short project description

ArcUnitLab helps builders avoid a specific Arc integration mistake: USDC has 18 decimals in the native interface and 6 decimals in its ERC-20 interface. Reusing a raw integer across those interfaces changes the intended amount by a factor of a trillion.

The app converts decimal amounts with exact integer arithmetic, cross-checks native and ERC-20 balances at one canonical mainnet block hash, reports precision dust, and shows why transferring an entire native USDC balance leaves no funds for gas. A public address is enough; users do not connect a wallet or sign anything to run the checks.

The companion UnitProbe contract offers read-only balance reconciliation and transfer-budget calculations. Once the owner's deployment is complete, the browser verifies its runtime bytecode and checks its output against direct RPC reads at the same block. All source, tests, compilation settings, and a dated mainnet verification record are included in the repository.

## Why Arc

The product is built around Arc's USDC denomination for both the native balance and transaction gas, and the precision difference between its native and ERC-20 USDC interfaces. It queries chain 5042, uses Arc's USDC contract at `0x3600000000000000000000000000000000000000`, and checks real mainnet state. These are operational integration checks rather than a generic token calculator.

## Links to complete

- Live public application: https://arc-unitlab.promarty766.chatgpt.site
- Public source repository: https://github.com/ProMartY/arc-unitlab
- Mainnet UnitProbe: [FILL FROM VERIFIED RECEIPT]
- Creation transaction: [FILL FROM VERIFIED RECEIPT]
- Public builder profile: https://github.com/ProMartY
- Optional demonstration video: [ADD IF RECORDED; DO NOT INVENT]

## Current publication status

The live app is public and read-only. Site wallet connection is paused following a MetaMask website warning; the reason is unconfirmed. The companion contract has not yet been deployed, and this draft must not be submitted as contract-deployed.

## Technical validation

17 initial automated tests passed for exact arithmetic, boundary inputs, same-block reads, wrong-chain detection, provider failover, and missing RPC data. The compiled contract passed simulated execution against real Arc mainnet state without spending funds. `evidence/mainnet-verification.json` contains the dated results. Final deployed-contract checks must also pass before submission.

## Owner-only questions

Confirm truthfully whether this work has received prior Circle/Arc funding and whether the owner has the right to submit the work. If selected, private payout verification must be completed by the actual recipient; the app does not fabricate a builder identity or payout eligibility.

## Deadline and selection

The published program lists 20 grants of 500 USDC, rolling review, a deadline of October 14, 2026 at 23:59 ET (October 15, 06:59 Kyiv), and decisions by October 21. A grant is not guaranteed. Dates and availability can change; recheck the official page before submission.

Source: https://community.arc.io/public/events/arc-microgrants-f8tijfjhyq
Application destination: https://dorahacks.io/hackathon/arc-microgrants
