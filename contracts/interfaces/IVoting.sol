// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IVoting - fonction de vote commune à Governance et à NaiveGovernance (démo)
interface IVoting {
    function castVote(uint256 id, bool support) external;
}
