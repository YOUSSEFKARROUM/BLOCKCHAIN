// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IVault - interface commune des coffres de démo (VulnerableVault / SecureVault)
interface IVault {
    function deposit() external payable;
    function withdraw() external;
}
