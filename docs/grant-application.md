# Arc Microgrants — prepared submission

**Draft: not submitted.** The public app, repository, and real Arc mainnet helper are prepared. Confirm the owner's profile and eligibility statements before submitting.

## Project name

ArcUnitLab

## One-line description

Exact USDC units, same-block balance reconciliation, and gas-budget checks for Arc mainnet.

## Short project description

ArcUnitLab helps builders avoid a specific Arc integration mistake: USDC has 18 decimals in the native interface and 6 decimals in its ERC-20 interface. Reusing a raw integer across those interfaces changes the intended amount by a factor of a trillion.

The app converts decimal amounts with exact integer arithmetic, cross-checks native and ERC-20 balances at one canonical mainnet block hash, reports precision dust, and shows why transferring an entire native USDC balance leaves no funds for gas. A public address is enough; users do not connect a wallet or sign anything to run the checks.

The deployed UnitProbe contract offers read-only balance reconciliation and transfer-budget calculations. The browser verifies its full runtime bytecode, including Solidity metadata, and checks its output against direct RPC reads at the same block. All source, tests, reproducible compilation settings, and dated mainnet verification records are included in the repository.

## Why Arc

The product is built around Arc's USDC denomination for both the native balance and transaction gas, and the precision difference between its native and ERC-20 USDC interfaces. It queries chain 5042, uses Arc's USDC contract at `0x3600000000000000000000000000000000000000`, and checks real mainnet state. These are operational integration checks rather than a generic token calculator.

## Project links

- Live public application: https://arc-unitlab.promarty766.chatgpt.site
- Public source repository: https://github.com/ProMartY/arc-unitlab
- Mainnet UnitProbe (Arc, chain 5042): `0x1A36510311C972b6ca0f22318c15108A9fb831A8`
- Creation transaction: `0x2d56fb9823efa59564a33c676662216fdc626571101da3a86679bd1d23fa487e`
- Public builder profile: https://github.com/ProMartY
- Demo walkthrough: use `docs/demo-script.md`; no demonstration video has been recorded.

## Current publication status

The live app is public and read-only. The owner deployed UnitProbe through Remix on October 8, 2026 at 09:59:21 UTC, in Arc block 24883063. The creation receipt succeeded with zero transaction value. Full creation and runtime bytecode match the independently reproduced Remix build. Site wallet connection remains paused following a MetaMask website warning; the reason is unconfirmed. Visitors need no wallet connection to use the app.

## Technical validation

17 automated tests cover exact arithmetic, boundary inputs, same-block reads, wrong-chain detection, provider failover, and missing RPC data. `evidence/mainnet-verification.json` records the earlier read-only simulations. `evidence/deployed-verification.json` records successful creation, exact bytecode comparison, and a real deployed-contract call cross-checked against direct mainnet state at the same canonical block hash.

## Owner-only questions

Confirm truthfully whether this work has received prior Circle/Arc funding and whether the owner has the right to submit the work. If selected, private payout verification must be completed by the actual recipient; the app does not fabricate a builder identity or payout eligibility.

## Deadline and selection

The published program lists 20 grants of 500 USDC, rolling review, a deadline of October 14, 2026 at 23:59 ET (October 15, 06:59 Kyiv), and decisions by October 21. A grant is not guaranteed. Dates and availability can change; recheck the official page before submission.

Source: https://community.arc.io/public/events/arc-microgrants-f8tijfjhyq
Application destination: https://dorahacks.io/hackathon/arc-microgrants
