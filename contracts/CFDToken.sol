// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title CFDToken - jeton de gouvernance de CampusFund
/// @notice Jeton ERC-20 "CFD" frappé quand on contribue à une campagne (1 ETH = 1000 CFD).
///         Il sert à voter dans la DAO. Grâce à ERC20Votes, le contrat garde un historique
///         (checkpoints) du pouvoir de vote de chaque adresse, bloc par bloc : c'est ce qui
///         permet à la gouvernance de lire le pouvoir de vote "au moment du snapshot".
/// @dev Le pouvoir de vote n'est actif qu'après une délégation (`delegate(soi-même)`).
///      C'est le fonctionnement standard d'ERC20Votes : sans délégation, aucun checkpoint
///      n'est écrit, ce qui économise du gaz pour ceux qui ne votent pas.
contract CFDToken is ERC20, ERC20Votes, AccessControl {
    /// @notice Rôle autorisé à frapper des CFD (attribué uniquement au contrat CampusFund).
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    /// @notice Rôle autorisé à brûler des CFD lors d'un remboursement (uniquement CampusFund).
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// @notice Taux de conversion : 1 wei contribué donne RATE "wei de CFD" (18 décimales des deux côtés).
    uint256 public constant RATE = 1000;

    /// @param admin adresse qui reçoit le rôle d'administrateur (pourra attribuer MINTER/BURNER)
    constructor(address admin) ERC20("CampusFund DAO Token", "CFD") EIP712("CampusFund DAO Token", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @notice Frappe `amount` CFD pour `to`. Appelé par CampusFund à chaque contribution.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /// @notice Brûle `amount` CFD de `from`. Appelé par CampusFund quand `from` se fait rembourser :
    ///         on rend ses jetons de vote en même temps qu'on récupère ses ETH.
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }

    // ---- Surcharges imposées par Solidity (ERC20 et ERC20Votes définissent tous deux _update) ----

    /// @dev À chaque transfert/mint/burn, ERC20Votes met à jour les checkpoints de vote.
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }
}
