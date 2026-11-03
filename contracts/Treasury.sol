// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

/// @title Treasury - trésorerie de la plateforme protégée par un multisig 2-sur-3
/// @notice Reçoit les 2 % de frais prélevés sur chaque tranche. Trois propriétaires (ex. les trois
///         membres de l'équipe) gèrent les retraits en trois étapes : submit -> approve -> execute.
///         - Petits retraits : 1 signature suffit, tant que le cumul du jour reste <= DAILY_LIMIT (1 ETH).
///         - Au-delà (gros retrait ou plafond du jour dépassé) : 2 signatures sur 3 sont obligatoires.
///         Le plafond journalier empêche un propriétaire seul de vider la caisse en multipliant les petits retraits.
contract Treasury is ReentrancyGuard {
    using Address for address payable;

    uint256 public constant DAILY_LIMIT = 1 ether;
    uint256 public constant REQUIRED_APPROVALS = 2;

    struct Transaction {
        address payable to;
        uint256 value;
        uint8 approvals;
        bool executed;
    }

    address[3] private _owners;
    mapping(address => bool) public isOwner;
    Transaction[] private _txs;
    mapping(uint256 => mapping(address => bool)) public approvedBy;
    /// @notice Total retiré avec une seule signature, par jour (numéro de jour = timestamp / 1 jour).
    mapping(uint256 => uint256) public spentWithSingleApproval;

    event Deposit(address indexed from, uint256 amount);
    event Submitted(uint256 indexed txId, address indexed owner, address indexed to, uint256 value);
    event Approved(uint256 indexed txId, address indexed owner);
    event Revoked(uint256 indexed txId, address indexed owner);
    event Executed(uint256 indexed txId, address indexed owner, address indexed to, uint256 value);

    error NotOwner();
    error InvalidOwners();
    error InvalidTransaction();
    error TxNotFound();
    error AlreadyExecuted();
    error AlreadyApproved();
    error NotApproved();
    error NotEnoughApprovals(uint256 have, uint256 need);

    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert NotOwner();
        _;
    }

    modifier pending(uint256 txId) {
        if (txId >= _txs.length) revert TxNotFound();
        if (_txs[txId].executed) revert AlreadyExecuted();
        _;
    }

    /// @param owners_ trois adresses distinctes et non nulles
    constructor(address[3] memory owners_) {
        for (uint256 i = 0; i < 3; ++i) {
            address o = owners_[i];
            if (o == address(0) || isOwner[o]) revert InvalidOwners();
            isOwner[o] = true;
        }
        _owners = owners_;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Propose un retrait. Le proposant l'approuve automatiquement.
    function submit(address payable to, uint256 value) external onlyOwner returns (uint256 txId) {
        if (to == address(0) || value == 0) revert InvalidTransaction();
        txId = _txs.length;
        _txs.push(Transaction({to: to, value: value, approvals: 1, executed: false}));
        approvedBy[txId][msg.sender] = true;
        emit Submitted(txId, msg.sender, to, value);
        emit Approved(txId, msg.sender);
    }

    function approve(uint256 txId) external onlyOwner pending(txId) {
        if (approvedBy[txId][msg.sender]) revert AlreadyApproved();
        approvedBy[txId][msg.sender] = true;
        _txs[txId].approvals += 1;
        emit Approved(txId, msg.sender);
    }

    /// @notice Retire son approbation tant que la transaction n'est pas exécutée.
    function revoke(uint256 txId) external onlyOwner pending(txId) {
        if (!approvedBy[txId][msg.sender]) revert NotApproved();
        approvedBy[txId][msg.sender] = false;
        _txs[txId].approvals -= 1;
        emit Revoked(txId, msg.sender);
    }

    /// @notice Exécute un retrait si les signatures suffisent. CEI + nonReentrant.
    function execute(uint256 txId) external onlyOwner nonReentrant pending(txId) {
        Transaction storage t = _txs[txId];
        uint256 day = block.timestamp / 1 days;

        // --- Checks
        if (t.approvals < REQUIRED_APPROVALS) {
            // une seule signature : autorisé seulement dans le plafond journalier
            if (t.approvals == 0 || spentWithSingleApproval[day] + t.value > DAILY_LIMIT) {
                revert NotEnoughApprovals(t.approvals, REQUIRED_APPROVALS);
            }
            // --- Effects (plafond)
            spentWithSingleApproval[day] += t.value;
        }
        // --- Effects
        t.executed = true;
        emit Executed(txId, msg.sender, t.to, t.value);
        // --- Interactions
        t.to.sendValue(t.value);
    }

    // ------------------------------------------------------------------ Lecture

    function owners() external view returns (address[3] memory) {
        return _owners;
    }

    function transactionCount() external view returns (uint256) {
        return _txs.length;
    }

    function getTransaction(uint256 txId) external view returns (Transaction memory) {
        if (txId >= _txs.length) revert TxNotFound();
        return _txs[txId];
    }

    /// @notice Nombre de signatures nécessaires si on exécutait maintenant.
    function requiredApprovals(uint256 txId) external view returns (uint256) {
        if (txId >= _txs.length) revert TxNotFound();
        uint256 day = block.timestamp / 1 days;
        return spentWithSingleApproval[day] + _txs[txId].value <= DAILY_LIMIT ? 1 : REQUIRED_APPROVALS;
    }
}
