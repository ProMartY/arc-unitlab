// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IArcUsdc {
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/// @notice Read-only comparisons of Arc's native and ERC-20 USDC interfaces.
contract UnitProbe {
    address public constant USDC = 0x3600000000000000000000000000000000000000;
    uint256 public constant SCALE = 1e12;
    error UnexpectedDecimals(uint8 observed);

    function walletSnapshot(address account) external view returns (
        uint256 chainId, uint256 nativeUnits, uint256 erc20Units,
        uint8 erc20Decimals, bool consistent, bool exact, uint256 nativeDustUnits
    ) {
        chainId = block.chainid;
        nativeUnits = account.balance;
        erc20Units = IArcUsdc(USDC).balanceOf(account);
        erc20Decimals = IArcUsdc(USDC).decimals();
        if (erc20Decimals != 6) revert UnexpectedDecimals(erc20Decimals);
        uint256 normalized = erc20Units * SCALE;
        if (nativeUnits >= normalized) {
            uint256 difference = nativeUnits - normalized;
            consistent = difference < SCALE;
            exact = difference == 0;
            if (consistent) nativeDustUnits = difference;
        }
    }

    /// @notice A budget ceiling for caller-supplied gas assumptions, not a transaction estimate.
    function previewNativeTransfer(address account, uint256 amountNative, uint256 gasLimit, uint256 maxFeePerGas)
        external view returns (uint256 balance, uint256 maximumGasCost, uint256 requiredBalance, bool affordable)
    {
        balance = account.balance;
        maximumGasCost = gasLimit * maxFeePerGas;
        requiredBalance = amountNative + maximumGasCost;
        affordable = balance >= requiredBalance;
    }
}
