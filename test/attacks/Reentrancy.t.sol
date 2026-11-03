// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {BaseTest} from "../utils/BaseTest.sol";
import {CampusFund} from "../../contracts/CampusFund.sol";
import {VulnerableVault} from "../../contracts/demo/VulnerableVault.sol";
import {SecureVault} from "../../contracts/demo/SecureVault.sol";
import {ReentrancyAttacker} from "../../contracts/demo/ReentrancyAttacker.sol";
import {IVault} from "../../contracts/demo/IVault.sol";

/// @dev Bénéficiaire malveillant : quand il reçoit une tranche, il essaie d'en retirer une autre.
contract MaliciousBeneficiary {
    CampusFund public immutable fund;
    uint256 public campaignId;
    bool public reentryAttempted;

    constructor(CampusFund fund_) {
        fund = fund_;
    }

    function setCampaign(uint256 id) external {
        campaignId = id;
    }

    function withdraw() external {
        fund.withdrawTranche(campaignId);
    }

    receive() external payable {
        if (!reentryAttempted) {
            reentryAttempted = true;
            fund.withdrawTranche(campaignId); // doit échouer
        }
    }
}

/// @dev Contributeur malveillant : pendant son remboursement, il redemande un remboursement.
contract MaliciousContributor {
    CampusFund public immutable fund;
    uint256 public campaignId;

    constructor(CampusFund fund_) {
        fund = fund_;
    }

    function contribute(uint256 id) external payable {
        campaignId = id;
        fund.contribute{value: msg.value}(id);
    }

    function claim() external {
        fund.refund(campaignId);
    }

    receive() external payable {
        fund.refund(campaignId); // doit échouer
    }
}

contract ReentrancyTest is BaseTest {
    address internal attackerEOA = makeAddr("attacker");

    function setUp() public override {
        super.setUp();
        vm.deal(attackerEOA, 1 ether);
    }

    /// @notice Version faible : l'attaquant dépose 1 ETH et repart avec les 10 ETH des victimes en plus.
    function test_Attack_SucceedsOnVulnerableVault() public {
        VulnerableVault vault = new VulnerableVault();
        vm.prank(alice);
        vault.deposit{value: 5 ether}();
        vm.prank(bob);
        vault.deposit{value: 5 ether}();

        vm.startPrank(attackerEOA);
        ReentrancyAttacker attacker = new ReentrancyAttacker{value: 1 ether}(IVault(address(vault)));
        attacker.attack();
        attacker.collect();
        vm.stopPrank();

        assertEq(address(vault).balance, 0, "coffre vide");
        assertEq(attackerEOA.balance, 11 ether, "l'attaquant a vole 10 ETH");
        assertEq(attacker.reentries(), 10);
        assertEq(vault.balances(alice), 5 ether, "la comptabilite dit encore 5 ETH a alice... qui n'existent plus");
    }

    /// @notice Version corrigée : la même attaque échoue, l'attaquant ne récupère rien de plus.
    function test_Attack_FailsOnSecureVault() public {
        SecureVault vault = new SecureVault();
        vm.prank(alice);
        vault.deposit{value: 5 ether}();
        vm.prank(bob);
        vault.deposit{value: 5 ether}();

        vm.startPrank(attackerEOA);
        ReentrancyAttacker attacker = new ReentrancyAttacker{value: 1 ether}(IVault(address(vault)));
        // La ré-entrée est bloquée par nonReentrant -> l'envoi d'ETH échoue -> toute la tx est annulée.
        vm.expectRevert(bytes("envoi echoue"));
        attacker.attack();
        vm.stopPrank();

        assertEq(address(vault).balance, 10 ether, "fonds des victimes intacts");
    }

    /// @notice Un utilisateur honnête peut toujours retirer normalement du coffre corrigé.
    function test_SecureVault_NormalWithdraw() public {
        SecureVault vault = new SecureVault();
        vm.startPrank(alice);
        vault.deposit{value: 5 ether}();
        vault.withdraw();
        vm.stopPrank();
        assertEq(alice.balance, 100 ether);
        vm.expectRevert(bytes("rien a retirer"));
        vm.prank(alice);
        vault.withdraw();
    }

    /// @notice Sur CampusFund : un bénéficiaire malveillant ne peut pas retirer deux tranches d'un coup.
    function test_Attack_FailsOnWithdrawTranche() public {
        MaliciousBeneficiary evil = new MaliciousBeneficiary(fund);
        vm.prank(creator);
        uint256 id = fund.createCampaign(GOAL, DURATION, payable(address(evil)), CID, _milestones3());
        evil.setCampaign(id);
        vm.prank(alice);
        fund.contribute{value: GOAL}(id);
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id);
        vm.startPrank(gov);
        fund.approveMilestone(id, 0);
        fund.approveMilestone(id, 1);
        vm.stopPrank();

        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        evil.withdraw();
        assertEq(address(fund).balance, GOAL, "aucun ETH n'est sorti");
    }

    /// @notice Sur CampusFund : un contributeur malveillant ne peut pas se faire rembourser deux fois.
    function test_Attack_FailsOnRefund() public {
        uint256 id = _createCampaign();
        MaliciousContributor evil = new MaliciousContributor(fund);
        vm.deal(address(evil), 0);
        evil.contribute{value: 2 ether}(id);
        vm.prank(alice);
        fund.contribute{value: 3 ether}(id);
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id); // 5 ETH < 10 ETH -> échec

        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        evil.claim();
        assertEq(address(fund).balance, 5 ether, "aucun ETH n'est sorti");

        vm.prank(alice);
        fund.refund(id); // la victime potentielle est toujours remboursée
        assertEq(alice.balance, 100 ether);
    }
}
