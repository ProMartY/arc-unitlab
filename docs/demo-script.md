# 60-second demo

1. Enter `10` USDC. Show native raw value `10000000000000000000` versus ERC-20 raw value `10000000`. Explain the 10¹² mismatch if an ERC-20 integer is used as transaction value.
2. Click **Use a public example**. Show the real block link, both displayed balances, and the remaining fraction below one micro-USDC. Expand **Raw values & data source** to reveal provider and observation time.
3. Click **Try sending the entire balance**. The amount-plus-gas budget exceeds the balance. Clarify that the gas limit is an editable assumption, not a recipient-specific estimate.
4. Enter `0.0000001`. The native amount is valid, while ERC-20 cannot represent it exactly; truncation is explicitly flagged.
5. After the real helper is deployed: show the mainnet explorer link and the status confirming runtime bytecode and same-block contract output verification.

Do not present a recorded balance as current, or the temporary state-override call as a deployed contract.
