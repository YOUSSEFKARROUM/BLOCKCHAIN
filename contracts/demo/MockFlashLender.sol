// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IFlashBorrower {
    function onFlashLoan(uint256 amount, bytes calldata data) external;
}

/// @title MockFlashLender - prêteur flash simulé (démo pédagogique)
/// @notice Prête des CFD SANS garantie, à condition qu'ils soient rendus dans la MÊME transaction.
///         Si l'emprunteur ne rend pas, toute la transaction est annulée (comme si rien ne s'était passé).
///         Les vrais protocoles (Aave, dYdX, Balancer...) font la même chose, souvent sur des millions.
///         Version simplifiée de l'ERC-3156, sans frais.
contract MockFlashLender {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    error NotRepaid();

    constructor(IERC20 token_) {
        token = token_;
    }

    function flashLoan(uint256 amount, bytes calldata data) external {
        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransfer(msg.sender, amount);
        IFlashBorrower(msg.sender).onFlashLoan(amount, data);
        if (token.balanceOf(address(this)) < balanceBefore) revert NotRepaid();
    }
}
