// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IVault} from "./IVault.sol";

/// @title SecureVault - même coffre que VulnerableVault, corrigé de deux façons
/// @notice 1) Checks-Effects-Interactions : le solde est mis à zéro AVANT l'envoi.
///         2) nonReentrant : un verrou refuse toute ré-entrée pendant l'exécution.
///         Une seule des deux protections suffirait ici ; on met les deux (défense en profondeur).
contract SecureVault is IVault, ReentrancyGuard {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender]; // Checks
        require(amount > 0, "rien a retirer");
        balances[msg.sender] = 0; // Effects
        (bool ok,) = msg.sender.call{value: amount}(""); // Interactions
        require(ok, "envoi echoue");
    }
}
