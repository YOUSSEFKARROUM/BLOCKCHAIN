// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {CFDToken} from "./CFDToken.sol";
import {ICampusFund} from "./interfaces/ICampusFund.sol";

/// @title CampusFund - financement participatif de projets étudiants et de clubs
/// @notice Un porteur crée une campagne découpée en 2 à 5 jalons. Les contributeurs envoient
///         des ETH et reçoivent des CFD. Si l'objectif est atteint, le bénéficiaire retire les
///         fonds tranche par tranche, chaque tranche n'étant disponible qu'après un vote DAO.
///         Si l'objectif est manqué (ou si la DAO gèle la campagne), chacun se rembourse lui-même.
/// @dev Sécurité : AccessControl (rôles), ReentrancyGuard + Checks-Effects-Interactions sur
///      tous les envois d'ETH, Pausable (circuit breaker), remboursements en "pull payment".
contract CampusFund is ICampusFund, AccessControl, ReentrancyGuard, Pausable {
    using Address for address payable;

    // ------------------------------------------------------------------ Rôles
    /// @notice Peut mettre en pause / relancer la plateforme en cas d'incident.
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    /// @notice Réservé au contrat Governance : approuver un jalon, geler une campagne.
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // ------------------------------------------------------------------ Paramètres fixes
    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 90 days;
    uint256 public constant MIN_MILESTONES = 2;
    uint256 public constant MAX_MILESTONES = 5;
    uint256 public constant BPS = 10_000; // 100 % exprimé en points de base
    uint256 public constant FEE_BPS = 200; // 2 % de frais de plateforme sur chaque tranche
    /// @notice Si aucun jalon n'avance pendant cette durée, n'importe qui peut annuler la campagne
    ///         réussie pour que les contributeurs récupèrent le reste (évite des fonds bloqués à vie).
    uint256 public constant STALE_PERIOD = 90 days;

    CFDToken public immutable token;
    address payable public immutable treasury;

    // ------------------------------------------------------------------ Stockage
    struct Campaign {
        address creator; // porteur du projet
        address payable beneficiary; // reçoit les tranches (ex. wallet du club)
        uint256 goal; // objectif en wei
        uint256 raised; // total collecté en wei
        uint256 released; // total déjà sorti en tranches (frais inclus)
        uint256 refunded; // total déjà remboursé
        uint64 deadline; // fin de la collecte (timestamp)
        uint64 lastProgressAt; // dernier moment où la campagne a avancé (échéance ou jalon approuvé)
        Status status;
        uint8 milestoneCount;
        uint8 approvedMilestones; // jalons validés par la DAO
        uint8 withdrawnMilestones; // tranches effectivement retirées
        string metadataCID; // CID IPFS des métadonnées (titre, description, image...)
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) private _campaigns;
    mapping(uint256 => uint16[]) private _milestoneBps;
    mapping(uint256 => mapping(address => uint256)) public contributionOf;

    /// @notice ETH que le contrat doit encore (collecté - versé en tranches - remboursé), toutes campagnes.
    uint256 public totalOwed;
    /// @notice Somme de toutes les contributions depuis le début.
    uint256 public totalContributed;
    /// @notice Somme des contributions annulées par un remboursement (leurs CFD ont été brûlés).
    uint256 public totalRefundedPrincipal;

    // ------------------------------------------------------------------ Events
    event CampaignCreated(
        uint256 indexed id,
        address indexed creator,
        address indexed beneficiary,
        uint256 goal,
        uint64 deadline,
        string metadataCID,
        uint16[] milestonesBps
    );
    event Contributed(uint256 indexed id, address indexed contributor, uint256 amount, uint256 cfdMinted);
    event CampaignFinalized(uint256 indexed id, Status status, uint256 raised);
    event CampaignCancelled(uint256 indexed id, address indexed by);
    event CampaignFrozen(uint256 indexed id);
    event MilestoneApproved(uint256 indexed id, uint8 indexed index);
    event TrancheWithdrawn(uint256 indexed id, uint8 indexed index, uint256 amount, uint256 fee);
    event Refunded(uint256 indexed id, address indexed contributor, uint256 amount, uint256 cfdBurned);

    // ------------------------------------------------------------------ Erreurs
    error InvalidGoal();
    error InvalidDuration();
    error InvalidBeneficiary();
    error InvalidMilestones();
    error EmptyMetadata();
    error CampaignNotFound();
    error WrongStatus(Status current);
    error DeadlinePassed();
    error DeadlineNotReached();
    error ZeroAmount();
    error NotCreator();
    error NotBeneficiary();
    error AlreadyHasContributions();
    error NoApprovedTranche();
    error WrongMilestone(uint8 expected, uint8 given);
    error AllMilestonesApproved();
    error NothingToRefund();
    error NotStale();

    constructor(address admin, CFDToken token_, address payable treasury_) {
        if (address(token_) == address(0) || treasury_ == address(0)) revert InvalidBeneficiary();
        token = token_;
        treasury = treasury_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    modifier exists(uint256 id) {
        if (id >= campaignCount) revert CampaignNotFound();
        _;
    }

    // ================================================================== Porteur de projet

    /// @notice Crée une campagne.
    /// @param goal objectif en wei (> 0)
    /// @param duration durée de la collecte en secondes (entre 1 heure et 90 jours)
    /// @param beneficiary adresse qui recevra les tranches
    /// @param metadataCID CID IPFS des métadonnées (seul le CID est stocké on-chain)
    /// @param milestonesBps part de chaque jalon en points de base, 2 à 5 jalons, somme = 10 000
    function createCampaign(
        uint256 goal,
        uint256 duration,
        address payable beneficiary,
        string calldata metadataCID,
        uint16[] calldata milestonesBps
    ) external whenNotPaused returns (uint256 id) {
        if (goal == 0) revert InvalidGoal();
        if (duration < MIN_DURATION || duration > MAX_DURATION) revert InvalidDuration();
        if (beneficiary == address(0)) revert InvalidBeneficiary();
        if (bytes(metadataCID).length == 0) revert EmptyMetadata();
        _checkMilestones(milestonesBps);

        id = campaignCount++;
        Campaign storage c = _campaigns[id];
        c.creator = msg.sender;
        c.beneficiary = beneficiary;
        c.goal = goal;
        c.deadline = uint64(block.timestamp + duration);
        c.status = Status.Active;
        c.milestoneCount = uint8(milestonesBps.length);
        c.metadataCID = metadataCID;
        _milestoneBps[id] = milestonesBps;

        emit CampaignCreated(id, msg.sender, beneficiary, goal, c.deadline, metadataCID, milestonesBps);
    }

    /// @notice Le porteur peut annuler sa campagne tant que personne n'y a contribué.
    function cancelCampaign(uint256 id) external exists(id) {
        Campaign storage c = _campaigns[id];
        if (msg.sender != c.creator) revert NotCreator();
        if (c.status != Status.Active) revert WrongStatus(c.status);
        if (c.raised != 0) revert AlreadyHasContributions();
        c.status = Status.Cancelled;
        emit CampaignCancelled(id, msg.sender);
    }

    /// @notice Retire la prochaine tranche approuvée par la DAO. Réservé au bénéficiaire.
    /// @dev Checks-Effects-Interactions : toutes les variables sont mises à jour AVANT les envois d'ETH,
    ///      et nonReentrant bloque toute ré-entrée. 2 % partent à la trésorerie.
    function withdrawTranche(uint256 id) external nonReentrant whenNotPaused exists(id) {
        Campaign storage c = _campaigns[id];
        // --- Checks
        if (msg.sender != c.beneficiary) revert NotBeneficiary();
        if (c.status != Status.Successful) revert WrongStatus(c.status);
        if (c.withdrawnMilestones >= c.approvedMilestones) revert NoApprovedTranche();

        uint8 index = c.withdrawnMilestones;
        uint256 amount = _trancheAmount(id, c, index);
        uint256 fee = (amount * FEE_BPS) / BPS;

        // --- Effects
        c.withdrawnMilestones = index + 1;
        c.released += amount;
        totalOwed -= amount;

        // --- Interactions
        emit TrancheWithdrawn(id, index, amount, fee);
        if (fee > 0) treasury.sendValue(fee);
        c.beneficiary.sendValue(amount - fee);
    }

    // ================================================================== Contributeurs

    /// @notice Contribue à une campagne en cours. Frappe msg.value * 1000 CFD pour l'appelant.
    function contribute(uint256 id) external payable whenNotPaused exists(id) {
        Campaign storage c = _campaigns[id];
        if (msg.value == 0) revert ZeroAmount();
        if (c.status != Status.Active) revert WrongStatus(c.status);
        if (block.timestamp >= c.deadline) revert DeadlinePassed();

        c.raised += msg.value;
        contributionOf[id][msg.sender] += msg.value;
        totalOwed += msg.value;
        totalContributed += msg.value;

        uint256 cfd = msg.value * token.RATE();
        emit Contributed(id, msg.sender, msg.value, cfd);
        token.mint(msg.sender, cfd);
    }

    /// @notice Clôture une campagne arrivée à échéance : Réussie si l'objectif est atteint, sinon Échouée.
    ///         Appelable par n'importe qui (personne n'a besoin d'une permission pour constater l'échéance).
    function finalize(uint256 id) external exists(id) {
        Campaign storage c = _campaigns[id];
        if (c.status != Status.Active) revert WrongStatus(c.status);
        if (block.timestamp < c.deadline) revert DeadlineNotReached();
        c.status = c.raised >= c.goal ? Status.Successful : Status.Failed;
        c.lastProgressAt = uint64(block.timestamp);
        emit CampaignFinalized(id, c.status, c.raised);
    }

    /// @notice Remboursement en "pull payment" : chaque contributeur vient chercher lui-même ses fonds.
    ///         Possible si la campagne a échoué ou a été annulée/gelée. Si des tranches avaient déjà été
    ///         versées avant un gel, on rembourse au prorata de ce qui reste.
    ///         Les CFD reçus pour cette contribution sont brûlés.
    function refund(uint256 id) external nonReentrant whenNotPaused exists(id) {
        Campaign storage c = _campaigns[id];
        // --- Checks
        if (c.status != Status.Failed && c.status != Status.Cancelled) revert WrongStatus(c.status);
        uint256 contribution = contributionOf[id][msg.sender];
        if (contribution == 0) revert NothingToRefund();

        uint256 amount = (contribution * (c.raised - c.released)) / c.raised;
        uint256 cfd = contribution * token.RATE();

        // --- Effects
        contributionOf[id][msg.sender] = 0;
        c.refunded += amount;
        totalOwed -= amount;
        totalRefundedPrincipal += contribution;

        // --- Interactions (contrats de confiance d'abord, puis l'envoi d'ETH en tout dernier)
        emit Refunded(id, msg.sender, amount, cfd);
        token.burn(msg.sender, cfd);
        if (amount > 0) payable(msg.sender).sendValue(amount);
    }

    /// @notice Garde-fou anti-blocage : si une campagne réussie n'a plus avancé depuis STALE_PERIOD
    ///         (aucun jalon approuvé), n'importe qui peut l'annuler pour libérer les remboursements.
    function cancelStale(uint256 id) external exists(id) {
        Campaign storage c = _campaigns[id];
        if (c.status != Status.Successful) revert WrongStatus(c.status);
        if (c.approvedMilestones == c.milestoneCount) revert AllMilestonesApproved();
        if (block.timestamp < uint256(c.lastProgressAt) + STALE_PERIOD) revert NotStale();
        c.status = Status.Cancelled;
        emit CampaignCancelled(id, msg.sender);
    }

    // ================================================================== Gouvernance (DAO)

    /// @notice Valide le jalon `index` (les jalons se valident dans l'ordre). Appelé par Governance
    ///         après un vote favorable.
    function approveMilestone(uint256 id, uint8 index) external onlyRole(GOVERNANCE_ROLE) exists(id) {
        Campaign storage c = _campaigns[id];
        if (c.status != Status.Successful) revert WrongStatus(c.status);
        if (c.approvedMilestones >= c.milestoneCount) revert AllMilestonesApproved();
        if (index != c.approvedMilestones) revert WrongMilestone(c.approvedMilestones, index);
        c.approvedMilestones = index + 1;
        c.lastProgressAt = uint64(block.timestamp);
        emit MilestoneApproved(id, index);
    }

    /// @notice Gèle une campagne suspecte (en cours ou réussie) : elle passe en Annulée et
    ///         les contributeurs peuvent se faire rembourser ce qui reste.
    function freezeCampaign(uint256 id) external onlyRole(GOVERNANCE_ROLE) exists(id) {
        Campaign storage c = _campaigns[id];
        if (c.status != Status.Active && c.status != Status.Successful) revert WrongStatus(c.status);
        c.status = Status.Cancelled;
        emit CampaignFrozen(id);
    }

    // ================================================================== Circuit breaker

    /// @notice Suspend contributions, créations, retraits et remboursements en cas d'incident.
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ================================================================== Lecture

    function getCampaign(uint256 id) external view exists(id) returns (Campaign memory) {
        return _campaigns[id];
    }

    function getMilestones(uint256 id) external view exists(id) returns (uint16[] memory) {
        return _milestoneBps[id];
    }

    function campaignStatus(uint256 id) external view exists(id) returns (Status) {
        return _campaigns[id].status;
    }

    function campaignParties(uint256 id)
        external
        view
        exists(id)
        returns (address creator, address beneficiary)
    {
        Campaign storage c = _campaigns[id];
        return (c.creator, c.beneficiary);
    }

    function milestoneProgress(uint256 id)
        external
        view
        exists(id)
        returns (uint8 count, uint8 approved, uint8 withdrawn)
    {
        Campaign storage c = _campaigns[id];
        return (c.milestoneCount, c.approvedMilestones, c.withdrawnMilestones);
    }

    /// @notice ETH collectés par une campagne (base du quorum des votes de déblocage).
    function raisedOf(uint256 id) external view exists(id) returns (uint256) {
        return _campaigns[id].raised;
    }

    /// @notice Montant (frais inclus) de la tranche `index` d'une campagne.
    function trancheAmount(uint256 id, uint8 index) external view exists(id) returns (uint256) {
        Campaign storage c = _campaigns[id];
        if (index >= c.milestoneCount) revert InvalidMilestones();
        return _trancheAmount(id, c, index);
    }

    // ================================================================== Interne

    /// @dev La dernière tranche verse tout le reste : aucune poussière d'arrondi ne reste bloquée.
    function _trancheAmount(uint256 id, Campaign storage c, uint8 index) private view returns (uint256) {
        if (index == c.milestoneCount - 1) return c.raised - c.released;
        return (c.raised * _milestoneBps[id][index]) / BPS;
    }

    function _checkMilestones(uint16[] calldata milestonesBps) private pure {
        uint256 n = milestonesBps.length;
        if (n < MIN_MILESTONES || n > MAX_MILESTONES) revert InvalidMilestones();
        uint256 sum = 0;
        for (uint256 i = 0; i < n; ++i) {
            if (milestonesBps[i] == 0) revert InvalidMilestones();
            sum += milestonesBps[i];
        }
        if (sum != BPS) revert InvalidMilestones();
    }
}
