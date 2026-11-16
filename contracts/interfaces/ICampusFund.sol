// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ICampusFund - ce que la gouvernance a besoin de connaître du contrat de financement
interface ICampusFund {
    enum Status {
        Active, // En cours : on peut contribuer jusqu'à l'échéance
        Successful, // Réussie : objectif atteint, fonds débloqués jalon par jalon après vote
        Failed, // Échouée : objectif non atteint, les contributeurs se remboursent
        Cancelled // Annulée : par le porteur (sans contribution) ou gelée par la DAO
    }

    function campaignStatus(uint256 id) external view returns (Status);
    function campaignParties(uint256 id) external view returns (address creator, address beneficiary);
    function milestoneProgress(uint256 id)
        external
        view
        returns (uint8 count, uint8 approved, uint8 withdrawn);
    function raisedOf(uint256 id) external view returns (uint256);
    function contributionOf(uint256 id, address contributor) external view returns (uint256);

    function approveMilestone(uint256 id, uint8 index) external;
    function freezeCampaign(uint256 id) external;
}
