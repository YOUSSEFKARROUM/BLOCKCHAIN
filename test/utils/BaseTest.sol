// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CFDToken} from "../../contracts/CFDToken.sol";
import {CampusFund} from "../../contracts/CampusFund.sol";

/// @notice Socle commun des tests : déploie le jeton et le contrat de financement, crée des acteurs.
///         Ici, "gov" est une simple adresse qui joue le rôle de la gouvernance (tests du cœur seul).
contract BaseTest is Test {
    CFDToken internal token;
    CampusFund internal fund;

    address internal admin = makeAddr("admin");
    address internal gov = makeAddr("gov");
    address payable internal treasury = payable(makeAddr("treasury"));
    address internal creator = makeAddr("creator");
    address payable internal beneficiary = payable(makeAddr("beneficiary"));
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    string internal constant CID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    uint256 internal constant GOAL = 10 ether;
    uint256 internal constant DURATION = 7 days;

    function setUp() public virtual {
        token = new CFDToken(admin);
        fund = new CampusFund(admin, token, treasury);
        vm.startPrank(admin);
        token.grantRole(token.MINTER_ROLE(), address(fund));
        token.grantRole(token.BURNER_ROLE(), address(fund));
        fund.grantRole(fund.GOVERNANCE_ROLE(), gov);
        vm.stopPrank();

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
    }

    function _milestones3() internal pure returns (uint16[] memory m) {
        m = new uint16[](3);
        m[0] = 3000;
        m[1] = 3000;
        m[2] = 4000;
    }

    function _createCampaign() internal returns (uint256 id) {
        vm.prank(creator);
        id = fund.createCampaign(GOAL, DURATION, beneficiary, CID, _milestones3());
    }

    /// @dev Campagne financée (alice 6 ETH + bob 4 ETH = objectif), échéance passée, finalisée.
    function _successfulCampaign() internal returns (uint256 id) {
        id = _createCampaign();
        vm.prank(alice);
        fund.contribute{value: 6 ether}(id);
        vm.prank(bob);
        fund.contribute{value: 4 ether}(id);
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id);
    }

    /// @dev Campagne qui échoue (alice 3 ETH seulement).
    function _failedCampaign() internal returns (uint256 id) {
        id = _createCampaign();
        vm.prank(alice);
        fund.contribute{value: 3 ether}(id);
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id);
    }
}
