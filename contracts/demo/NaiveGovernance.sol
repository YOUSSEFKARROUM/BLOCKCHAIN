// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ICampusFund} from "../interfaces/ICampusFund.sol";
import {IVoting} from "../interfaces/IVoting.sol";

/// @title NaiveGovernance - gouvernance VOLONTAIREMENT vulnérable (démo pédagogique)
/// @notice NE PAS DÉPLOYER EN PRODUCTION. Le poids d'un vote est le solde de CFD AU MOMENT DU VOTE
///         (pas de snapshot). Quelqu'un qui emprunte beaucoup de CFD le temps d'une transaction
///         (flash loan) peut donc voter avec un poids énorme puis rendre les jetons :
///         c'est le scénario de l'attaque contre Beanstalk (avril 2022, ~182 M$).
contract NaiveGovernance is IVoting {
    struct Proposal {
        uint256 campaignId;
        uint256 voteEnd;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
    }

    IERC20 public immutable token;
    ICampusFund public immutable fund;
    uint256 public immutable votingPeriod;
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    constructor(IERC20 token_, ICampusFund fund_, uint256 votingPeriod_) {
        token = token_;
        fund = fund_;
        votingPeriod = votingPeriod_;
    }

    /// @notice Propose de geler une campagne.
    function proposeFreeze(uint256 campaignId) external returns (uint256 id) {
        id = proposalCount++;
        proposals[id] = Proposal(campaignId, block.timestamp + votingPeriod, 0, 0, false);
    }

    function castVote(uint256 id, bool support) external {
        Proposal storage p = proposals[id];
        require(block.timestamp <= p.voteEnd, "vote termine");
        require(!hasVoted[id][msg.sender], "deja vote");
        // FAILLE : solde actuel, pas un solde figé au moment de la création de la proposition
        uint256 weight = token.balanceOf(msg.sender);
        require(weight > 0, "pas de CFD");
        hasVoted[id][msg.sender] = true;
        if (support) p.forVotes += weight;
        else p.againstVotes += weight;
    }

    function execute(uint256 id) external {
        Proposal storage p = proposals[id];
        require(block.timestamp > p.voteEnd, "vote en cours");
        require(!p.executed, "deja execute");
        // FAILLE (suite) : le quorum est lui aussi calculé sur l'offre actuelle
        require(p.forVotes + p.againstVotes >= token.totalSupply() / 10, "quorum");
        require(p.forVotes > p.againstVotes, "rejete");
        p.executed = true;
        fund.freezeCampaign(p.campaignId);
    }
}
