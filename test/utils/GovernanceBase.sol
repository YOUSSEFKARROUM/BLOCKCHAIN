// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseTest} from "./BaseTest.sol";
import {Governance} from "../../contracts/Governance.sol";

/// @notice Ajoute la vraie gouvernance au socle de test : c'est elle (et non plus "gov") qui détient
///         le rôle GOVERNANCE sur CampusFund.
contract GovernanceBase is BaseTest {
    Governance internal governance;

    uint256 internal constant VOTING_PERIOD = 3 days;
    uint256 internal constant THRESHOLD = 100 ether; // 100 CFD
    string internal constant PROOF = "ipfs://preuve-de-test";

    function setUp() public virtual override {
        super.setUp();
        governance = new Governance(admin, token, fund, VOTING_PERIOD, THRESHOLD);
        vm.startPrank(admin);
        fund.revokeRole(fund.GOVERNANCE_ROLE(), gov);
        fund.grantRole(fund.GOVERNANCE_ROLE(), address(governance));
        vm.stopPrank();

        // Les contributeurs activent leur pouvoir de vote en se déléguant à eux-mêmes.
        vm.prank(alice);
        token.delegate(alice);
        vm.prank(bob);
        token.delegate(bob);
        vm.prank(carol);
        token.delegate(carol);
    }

    /// @dev Avance d'un bloc : les votes du bloc courant deviennent "passés" et donc lisibles au snapshot.
    function _nextBlock() internal {
        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 12);
    }

    function _endVote() internal {
        vm.warp(block.timestamp + VOTING_PERIOD + 1);
    }

    function _proposeRelease(uint256 campaignId) internal returns (uint256 pid) {
        _nextBlock();
        vm.prank(creator);
        pid = governance.proposeMilestoneRelease(campaignId, "Jalon atteint : facture du materiel", PROOF);
    }

    /// @dev Propose, fait voter alice (6000 CFD) pour, attend la fin, exécute.
    function _passRelease(uint256 campaignId) internal returns (uint256 pid) {
        pid = _proposeRelease(campaignId);
        vm.prank(alice);
        governance.castVote(pid, true);
        _endVote();
        governance.execute(pid);
    }
}
