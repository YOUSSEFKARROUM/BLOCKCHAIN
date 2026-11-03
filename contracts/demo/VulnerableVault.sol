// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title VulnerableVault - coffre VOLONTAIREMENT vulnérable à la réentrance (démo pédagogique)
/// @notice NE PAS DÉPLOYER EN PRODUCTION. Ce contrat reproduit l'erreur de The DAO (2016) :
///         il envoie les ETH AVANT de mettre le solde à zéro. Un contrat attaquant peut donc
///         rappeler withdraw() depuis sa fonction receive() et retirer plusieurs fois le même solde.
contract VulnerableVault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "rien a retirer");
        // ERREUR : interaction (envoi) AVANT l'effet (mise à zéro)
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "envoi echoue");
        balances[msg.sender] = 0;
    }
}
