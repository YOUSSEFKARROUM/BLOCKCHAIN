// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {CFDToken} from "./CFDToken.sol";
import {ICampusFund} from "./interfaces/ICampusFund.sol";
import {IVoting} from "./interfaces/IVoting.sol";

/// @title Governance - la DAO de CampusFund
/// @notice Les détenteurs de CFD votent sur deux types de décisions :
///         - MilestoneRelease : débloquer la prochaine tranche d'une campagne réussie ;
///         - FreezeCampaign   : geler une campagne suspecte (elle passe en Annulée, remboursements ouverts).
/// @dev Anti-manipulation : le poids d'un vote = CFD délégués AU BLOC DU SNAPSHOT (bloc précédant
///      la création de la proposition). Acheter ou emprunter des CFD après coup ne donne aucun poids.
///      Quorum = 10 % de l'offre totale au snapshot. Majorité = plus de "pour" que de "contre".
///      Exécution possible seulement après la fin du vote, par n'importe qui.
contract Governance is IVoting, AccessControl {
    using Math for uint256;

    bytes32 public constant PARAMS_ROLE = keccak256("PARAMS_ROLE");

    uint256 public constant BPS = 10_000;
    uint256 public constant QUORUM_BPS = 1_000; // 10 %
    uint256 public constant MIN_VOTING_PERIOD = 1 hours;
    uint256 public constant MAX_VOTING_PERIOD = 14 days;

    enum ProposalType {
        MilestoneRelease,
        FreezeCampaign
    }

    enum ProposalState {
        Active, // vote en cours
        Defeated, // vote terminé : quorum non atteint ou majorité contre
        Succeeded, // vote terminé et adopté, en attente d'exécution
        Executed // décision appliquée sur CampusFund
    }

    struct Proposal {
        ProposalType ptype;
        uint8 milestoneIndex; // jalon visé (MilestoneRelease uniquement)
        bool quadratic; // mode de vote figé à la création
        bool executed;
        address proposer;
        uint64 snapshotBlock;
        uint64 voteEnd;
        uint256 campaignId;
        uint256 forVotes; // poids "pour" (linéaire ou racine carrée)
        uint256 againstVotes; // poids "contre"
        uint256 participation; // CFD bruts ayant voté (sert au quorum, quel que soit le mode)
        uint256 quorum; // CFD bruts nécessaires, calculé au snapshot
        string description;
    }

    CFDToken public immutable token;
    ICampusFund public immutable fund;

    uint256 public votingPeriod;
    /// @notice CFD (votes au snapshot) qu'il faut détenir pour proposer un gel. Évite le spam.
    uint256 public proposalThreshold;
    /// @notice Extension optionnelle (désactivée par défaut) : poids = racine carrée des CFD.
    bool public quadraticVoting;

    uint256 public proposalCount;
    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(
        uint256 indexed id,
        ProposalType indexed ptype,
        uint256 indexed campaignId,
        uint8 milestoneIndex,
        address proposer,
        uint64 snapshotBlock,
        uint64 voteEnd,
        string description
    );
    event VoteCast(uint256 indexed id, address indexed voter, bool support, uint256 weight, uint256 rawVotes);
    event ProposalExecuted(uint256 indexed id);
    event VotingPeriodUpdated(uint256 votingPeriod);
    event ProposalThresholdUpdated(uint256 threshold);
    event QuadraticVotingUpdated(bool enabled);

    error InvalidVotingPeriod();
    error NotCampaignOwner();
    error CampaignNotSuccessful();
    error CampaignNotFreezable();
    error AllMilestonesApproved();
    error BelowProposalThreshold(uint256 votes, uint256 threshold);
    error ProposalNotFound();
    error VotingClosed();
    error AlreadyVoted();
    error NoVotingPower();
    error NotSucceeded(ProposalState state);

    constructor(address admin, CFDToken token_, ICampusFund fund_, uint256 votingPeriod_, uint256 threshold_) {
        token = token_;
        fund = fund_;
        _setVotingPeriod(votingPeriod_);
        proposalThreshold = threshold_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PARAMS_ROLE, admin);
    }

    // ================================================================== Propositions

    /// @notice Le porteur (ou le bénéficiaire) d'une campagne réussie demande le déblocage du prochain jalon.
    function proposeMilestoneRelease(uint256 campaignId, string calldata description)
        external
        returns (uint256 id)
    {
        (address creator, address beneficiary) = fund.campaignParties(campaignId);
        if (msg.sender != creator && msg.sender != beneficiary) revert NotCampaignOwner();
        if (fund.campaignStatus(campaignId) != ICampusFund.Status.Successful) revert CampaignNotSuccessful();
        (uint8 count, uint8 approved,) = fund.milestoneProgress(campaignId);
        if (approved >= count) revert AllMilestonesApproved();
        id = _createProposal(ProposalType.MilestoneRelease, campaignId, approved, description);
    }

    /// @notice Tout détenteur d'au moins `proposalThreshold` votes peut demander le gel d'une campagne.
    function proposeFreeze(uint256 campaignId, string calldata description) external returns (uint256 id) {
        ICampusFund.Status s = fund.campaignStatus(campaignId);
        if (s != ICampusFund.Status.Active && s != ICampusFund.Status.Successful) revert CampaignNotFreezable();
        uint256 votes = token.getPastVotes(msg.sender, block.number - 1);
        if (votes < proposalThreshold) revert BelowProposalThreshold(votes, proposalThreshold);
        id = _createProposal(ProposalType.FreezeCampaign, campaignId, 0, description);
    }

    /// @dev Le snapshot est le bloc PRÉCÉDENT : même un prêt flash pris dans le bloc de création
    ///      (ou dans la même transaction) n'est pas compté.
    function _createProposal(ProposalType ptype, uint256 campaignId, uint8 milestoneIndex, string calldata description)
        private
        returns (uint256 id)
    {
        uint64 snapshot = uint64(block.number - 1);
        uint64 voteEnd = uint64(block.timestamp + votingPeriod);
        id = proposalCount++;
        Proposal storage p = _proposals[id];
        p.ptype = ptype;
        p.campaignId = campaignId;
        p.milestoneIndex = milestoneIndex;
        p.proposer = msg.sender;
        p.snapshotBlock = snapshot;
        p.voteEnd = voteEnd;
        p.quadratic = quadraticVoting;
        p.quorum = (token.getPastTotalSupply(snapshot) * QUORUM_BPS) / BPS;
        p.description = description;
        emit ProposalCreated(id, ptype, campaignId, milestoneIndex, msg.sender, snapshot, voteEnd, description);
    }

    // ================================================================== Vote

    /// @notice Vote pour (`support = true`) ou contre une proposition. Une seule fois par adresse.
    function castVote(uint256 id, bool support) external {
        if (id >= proposalCount) revert ProposalNotFound();
        Proposal storage p = _proposals[id];
        if (block.timestamp > p.voteEnd) revert VotingClosed();
        if (hasVoted[id][msg.sender]) revert AlreadyVoted();

        uint256 raw = token.getPastVotes(msg.sender, p.snapshotBlock);
        if (raw == 0) revert NoVotingPower();
        uint256 weight = p.quadratic ? raw.sqrt() : raw;

        hasVoted[id][msg.sender] = true;
        p.participation += raw;
        if (support) p.forVotes += weight;
        else p.againstVotes += weight;

        emit VoteCast(id, msg.sender, support, weight, raw);
    }

    // ================================================================== Exécution

    /// @notice Applique une proposition adoptée. Appelable par n'importe qui après la fin du vote.
    function execute(uint256 id) external {
        ProposalState s = state(id);
        if (s != ProposalState.Succeeded) revert NotSucceeded(s);
        Proposal storage p = _proposals[id];
        p.executed = true; // effet avant l'appel externe
        emit ProposalExecuted(id);
        if (p.ptype == ProposalType.MilestoneRelease) fund.approveMilestone(p.campaignId, p.milestoneIndex);
        else fund.freezeCampaign(p.campaignId);
    }

    // ================================================================== Lecture

    function state(uint256 id) public view returns (ProposalState) {
        if (id >= proposalCount) revert ProposalNotFound();
        Proposal storage p = _proposals[id];
        if (p.executed) return ProposalState.Executed;
        if (block.timestamp <= p.voteEnd) return ProposalState.Active;
        if (p.participation >= p.quorum && p.participation > 0 && p.forVotes > p.againstVotes) {
            return ProposalState.Succeeded;
        }
        return ProposalState.Defeated;
    }

    function getProposal(uint256 id) external view returns (Proposal memory) {
        if (id >= proposalCount) revert ProposalNotFound();
        return _proposals[id];
    }

    // ================================================================== Paramètres (rôle PARAMS)

    function setVotingPeriod(uint256 newPeriod) external onlyRole(PARAMS_ROLE) {
        _setVotingPeriod(newPeriod);
    }

    function setProposalThreshold(uint256 newThreshold) external onlyRole(PARAMS_ROLE) {
        proposalThreshold = newThreshold;
        emit ProposalThresholdUpdated(newThreshold);
    }

    /// @notice Active/désactive le vote quadratique pour les PROCHAINES propositions
    ///         (une proposition garde le mode actif à sa création).
    function setQuadraticVoting(bool enabled) external onlyRole(PARAMS_ROLE) {
        quadraticVoting = enabled;
        emit QuadraticVotingUpdated(enabled);
    }

    function _setVotingPeriod(uint256 newPeriod) private {
        if (newPeriod < MIN_VOTING_PERIOD || newPeriod > MAX_VOTING_PERIOD) revert InvalidVotingPeriod();
        votingPeriod = newPeriod;
        emit VotingPeriodUpdated(newPeriod);
    }
}
