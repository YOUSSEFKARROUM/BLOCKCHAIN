// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {BaseTest} from "../utils/BaseTest.sol";
import {CampusFund} from "../../contracts/CampusFund.sol";
import {CFDToken} from "../../contracts/CFDToken.sol";
import {ICampusFund} from "../../contracts/interfaces/ICampusFund.sol";

contract CampusFundTest is BaseTest {
    // ================================================================ constructeur

    function test_Constructor_RevertsOnZeroTreasury() public {
        vm.expectRevert(CampusFund.InvalidBeneficiary.selector);
        new CampusFund(admin, token, payable(address(0)));
    }

    function test_Constructor_RevertsOnZeroToken() public {
        vm.expectRevert(CampusFund.InvalidBeneficiary.selector);
        new CampusFund(admin, CFDToken(address(0)), treasury);
    }

    // ================================================================ createCampaign

    function test_CreateCampaign_StoresEverything() public {
        uint256 id = _createCampaign();
        assertEq(id, 0);
        assertEq(fund.campaignCount(), 1);

        CampusFund.Campaign memory c = fund.getCampaign(id);
        assertEq(c.creator, creator);
        assertEq(c.beneficiary, beneficiary);
        assertEq(c.goal, GOAL);
        assertEq(c.deadline, block.timestamp + DURATION);
        assertEq(uint8(c.status), uint8(ICampusFund.Status.Active));
        assertEq(c.milestoneCount, 3);
        assertEq(c.metadataCID, CID);

        uint16[] memory m = fund.getMilestones(id);
        assertEq(m.length, 3);
        assertEq(m[2], 4000);
    }

    function test_CreateCampaign_EmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit CampusFund.CampaignCreated(
            0, creator, beneficiary, GOAL, uint64(block.timestamp + DURATION), CID, _milestones3()
        );
        _createCampaign();
    }

    function test_CreateCampaign_RevertsOnZeroGoal() public {
        vm.expectRevert(CampusFund.InvalidGoal.selector);
        fund.createCampaign(0, DURATION, beneficiary, CID, _milestones3());
    }

    function test_CreateCampaign_RevertsOnTooShortDuration() public {
        vm.expectRevert(CampusFund.InvalidDuration.selector);
        fund.createCampaign(GOAL, 1 hours - 1, beneficiary, CID, _milestones3());
    }

    function test_CreateCampaign_RevertsOnTooLongDuration() public {
        vm.expectRevert(CampusFund.InvalidDuration.selector);
        fund.createCampaign(GOAL, 90 days + 1, beneficiary, CID, _milestones3());
    }

    function test_CreateCampaign_RevertsOnZeroBeneficiary() public {
        vm.expectRevert(CampusFund.InvalidBeneficiary.selector);
        fund.createCampaign(GOAL, DURATION, payable(address(0)), CID, _milestones3());
    }

    function test_CreateCampaign_RevertsOnEmptyCID() public {
        vm.expectRevert(CampusFund.EmptyMetadata.selector);
        fund.createCampaign(GOAL, DURATION, beneficiary, "", _milestones3());
    }

    function test_CreateCampaign_RevertsOnOneMilestone() public {
        uint16[] memory m = new uint16[](1);
        m[0] = 10_000;
        vm.expectRevert(CampusFund.InvalidMilestones.selector);
        fund.createCampaign(GOAL, DURATION, beneficiary, CID, m);
    }

    function test_CreateCampaign_RevertsOnSixMilestones() public {
        uint16[] memory m = new uint16[](6);
        for (uint256 i; i < 5; ++i) m[i] = 1500;
        m[5] = 2500;
        vm.expectRevert(CampusFund.InvalidMilestones.selector);
        fund.createCampaign(GOAL, DURATION, beneficiary, CID, m);
    }

    function test_CreateCampaign_RevertsWhenSumIsNot100Percent() public {
        uint16[] memory m = new uint16[](2);
        m[0] = 5000;
        m[1] = 4999;
        vm.expectRevert(CampusFund.InvalidMilestones.selector);
        fund.createCampaign(GOAL, DURATION, beneficiary, CID, m);
    }

    function test_CreateCampaign_RevertsOnZeroMilestone() public {
        uint16[] memory m = new uint16[](3);
        m[0] = 0;
        m[1] = 5000;
        m[2] = 5000;
        vm.expectRevert(CampusFund.InvalidMilestones.selector);
        fund.createCampaign(GOAL, DURATION, beneficiary, CID, m);
    }

    // ================================================================ contribute

    function test_Contribute_MintsCFDAndRecords() public {
        uint256 id = _createCampaign();
        vm.expectEmit(true, true, false, true);
        emit CampusFund.Contributed(id, alice, 2 ether, 2000 ether);
        vm.prank(alice);
        fund.contribute{value: 2 ether}(id);

        assertEq(token.balanceOf(alice), 2000 ether, "1 ETH = 1000 CFD");
        assertEq(fund.contributionOf(id, alice), 2 ether);
        assertEq(fund.getCampaign(id).raised, 2 ether);
        assertEq(fund.totalOwed(), 2 ether);
        assertEq(fund.totalContributed(), 2 ether);
        assertEq(address(fund).balance, 2 ether);
    }

    function test_Contribute_Accumulates() public {
        uint256 id = _createCampaign();
        vm.startPrank(alice);
        fund.contribute{value: 1 ether}(id);
        fund.contribute{value: 0.5 ether}(id);
        vm.stopPrank();
        assertEq(fund.contributionOf(id, alice), 1.5 ether);
    }

    function test_Contribute_AboveGoalIsAccepted() public {
        uint256 id = _createCampaign();
        vm.prank(alice);
        fund.contribute{value: 15 ether}(id);
        assertEq(fund.getCampaign(id).raised, 15 ether);
    }

    function test_Contribute_RevertsOnZero() public {
        uint256 id = _createCampaign();
        vm.expectRevert(CampusFund.ZeroAmount.selector);
        vm.prank(alice);
        fund.contribute{value: 0}(id);
    }

    function test_Contribute_RevertsOnUnknownCampaign() public {
        vm.expectRevert(CampusFund.CampaignNotFound.selector);
        vm.prank(alice);
        fund.contribute{value: 1 ether}(42);
    }

    function test_Contribute_RevertsAfterDeadline() public {
        uint256 id = _createCampaign();
        vm.warp(block.timestamp + DURATION);
        vm.expectRevert(CampusFund.DeadlinePassed.selector);
        vm.prank(alice);
        fund.contribute{value: 1 ether}(id);
    }

    function test_Contribute_RevertsWhenNotActive() public {
        uint256 id = _successfulCampaign();
        vm.expectRevert(abi.encodeWithSelector(CampusFund.WrongStatus.selector, ICampusFund.Status.Successful));
        vm.prank(carol);
        fund.contribute{value: 1 ether}(id);
    }

    // ================================================================ finalize

    function test_Finalize_Successful() public {
        uint256 id = _successfulCampaign();
        assertEq(uint8(fund.campaignStatus(id)), uint8(ICampusFund.Status.Successful));
    }

    function test_Finalize_Failed() public {
        uint256 id = _failedCampaign();
        assertEq(uint8(fund.campaignStatus(id)), uint8(ICampusFund.Status.Failed));
    }

    function test_Finalize_RevertsBeforeDeadline() public {
        uint256 id = _createCampaign();
        vm.expectRevert(CampusFund.DeadlineNotReached.selector);
        fund.finalize(id);
    }

    function test_Finalize_RevertsTwice() public {
        uint256 id = _successfulCampaign();
        vm.expectRevert(abi.encodeWithSelector(CampusFund.WrongStatus.selector, ICampusFund.Status.Successful));
        fund.finalize(id);
    }

    // ================================================================ cancelCampaign

    function test_Cancel_ByCreatorWithoutContributions() public {
        uint256 id = _createCampaign();
        vm.prank(creator);
        fund.cancelCampaign(id);
        assertEq(uint8(fund.campaignStatus(id)), uint8(ICampusFund.Status.Cancelled));
    }

    function test_Cancel_RevertsIfNotCreator() public {
        uint256 id = _createCampaign();
        vm.expectRevert(CampusFund.NotCreator.selector);
        vm.prank(alice);
        fund.cancelCampaign(id);
    }

    function test_Cancel_RevertsWithContributions() public {
        uint256 id = _createCampaign();
        vm.prank(alice);
        fund.contribute{value: 1 ether}(id);
        vm.expectRevert(CampusFund.AlreadyHasContributions.selector);
        vm.prank(creator);
        fund.cancelCampaign(id);
    }

    function test_Cancel_RevertsIfNotActive() public {
        uint256 id = _createCampaign();
        vm.prank(creator);
        fund.cancelCampaign(id);
        vm.expectRevert(abi.encodeWithSelector(CampusFund.WrongStatus.selector, ICampusFund.Status.Cancelled));
        vm.prank(creator);
        fund.cancelCampaign(id);
    }

    // ================================================================ refund

    function test_Refund_FailedCampaignFullRefundAndBurn() public {
        uint256 id = _failedCampaign();
        uint256 before = alice.balance;
        vm.prank(alice);
        fund.refund(id);
        assertEq(alice.balance - before, 3 ether);
        assertEq(token.balanceOf(alice), 0, "CFD brules");
        assertEq(fund.contributionOf(id, alice), 0);
        assertEq(fund.totalOwed(), 0);
        assertEq(fund.totalRefundedPrincipal(), 3 ether);
    }

    function test_Refund_RevertsTwice() public {
        uint256 id = _failedCampaign();
        vm.prank(alice);
        fund.refund(id);
        vm.expectRevert(CampusFund.NothingToRefund.selector);
        vm.prank(alice);
        fund.refund(id);
    }

    function test_Refund_RevertsForNonContributor() public {
        uint256 id = _failedCampaign();
        vm.expectRevert(CampusFund.NothingToRefund.selector);
        vm.prank(bob);
        fund.refund(id);
    }

    function test_Refund_RevertsWhenSuccessful() public {
        uint256 id = _successfulCampaign();
        vm.expectRevert(abi.encodeWithSelector(CampusFund.WrongStatus.selector, ICampusFund.Status.Successful));
        vm.prank(alice);
        fund.refund(id);
    }

    function test_Refund_RevertsWhenActive() public {
        uint256 id = _createCampaign();
        vm.prank(alice);
        fund.contribute{value: 1 ether}(id);
        vm.expectRevert(abi.encodeWithSelector(CampusFund.WrongStatus.selector, ICampusFund.Status.Active));
        vm.prank(alice);
        fund.refund(id);
    }

    function test_Refund_RevertsIfCFDWereTransferred() public {
        uint256 id = _failedCampaign();
        vm.prank(alice);
        token.transfer(bob, 1 ether);
        vm.expectRevert(); // ERC20InsufficientBalance : il faut rendre tous ses CFD
        vm.prank(alice);
        fund.refund(id);
    }

    function test_Refund_ProRataAfterFreezeWithTrancheWithdrawn() public {
        uint256 id = _successfulCampaign();
        vm.prank(gov);
        fund.approveMilestone(id, 0);
        vm.prank(beneficiary);
        fund.withdrawTranche(id); // 30 % de 10 ETH = 3 ETH sortis

        vm.prank(gov);
        fund.freezeCampaign(id);

        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        fund.refund(id); // 6 ETH * 7/10
        assertEq(alice.balance - aliceBefore, 4.2 ether);

        uint256 bobBefore = bob.balance;
        vm.prank(bob);
        fund.refund(id); // 4 ETH * 7/10
        assertEq(bob.balance - bobBefore, 2.8 ether);
        assertEq(fund.totalOwed(), 0);
        assertEq(address(fund).balance, 0);
    }

    // ================================================================ approveMilestone / withdrawTranche

    function test_Withdraw_FirstTrancheWithFee() public {
        uint256 id = _successfulCampaign();
        vm.prank(gov);
        fund.approveMilestone(id, 0);

        vm.expectEmit(true, true, false, true);
        emit CampusFund.TrancheWithdrawn(id, 0, 3 ether, 0.06 ether);
        vm.prank(beneficiary);
        fund.withdrawTranche(id);

        assertEq(beneficiary.balance, 2.94 ether, "98 % au beneficiaire");
        assertEq(treasury.balance, 0.06 ether, "2 % a la tresorerie");
        assertEq(fund.totalOwed(), 7 ether);
        (, uint8 approved, uint8 withdrawn) = fund.milestoneProgress(id);
        assertEq(approved, 1);
        assertEq(withdrawn, 1);
    }

    function test_Withdraw_AllTranchesEmptiesCampaign() public {
        uint256 id = _successfulCampaign();
        for (uint8 i; i < 3; ++i) {
            vm.prank(gov);
            fund.approveMilestone(id, i);
            vm.prank(beneficiary);
            fund.withdrawTranche(id);
        }
        assertEq(beneficiary.balance + treasury.balance, 10 ether);
        assertEq(treasury.balance, 0.2 ether);
        assertEq(address(fund).balance, 0);
        assertEq(fund.getCampaign(id).released, 10 ether);
    }

    function test_Withdraw_LastTrancheTakesRoundingDust() public {
        vm.prank(creator);
        uint16[] memory m = new uint16[](3);
        m[0] = 3333;
        m[1] = 3333;
        m[2] = 3334;
        uint256 id = fund.createCampaign(1 ether, DURATION, beneficiary, CID, m);
        vm.prank(alice);
        fund.contribute{value: 1 ether + 7}(id); // montant "pas rond"
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id);
        for (uint8 i; i < 3; ++i) {
            vm.prank(gov);
            fund.approveMilestone(id, i);
            vm.prank(beneficiary);
            fund.withdrawTranche(id);
        }
        assertEq(address(fund).balance, 0, "aucune poussiere bloquee");
    }

    function test_Withdraw_RevertsWithoutApproval() public {
        uint256 id = _successfulCampaign();
        vm.expectRevert(CampusFund.NoApprovedTranche.selector);
        vm.prank(beneficiary);
        fund.withdrawTranche(id);
    }

    function test_Withdraw_RevertsSecondTimeForSameApproval() public {
        uint256 id = _successfulCampaign();
        vm.prank(gov);
        fund.approveMilestone(id, 0);
        vm.prank(beneficiary);
        fund.withdrawTranche(id);
        vm.expectRevert(CampusFund.NoApprovedTranche.selector);
        vm.prank(beneficiary);
        fund.withdrawTranche(id);
    }

    function test_Withdraw_RevertsIfNotBeneficiary() public {
        uint256 id = _successfulCampaign();
        vm.prank(gov);
        fund.approveMilestone(id, 0);
        vm.expectRevert(CampusFund.NotBeneficiary.selector);
        vm.prank(creator);
        fund.withdrawTranche(id);
    }

    function test_Withdraw_RevertsIfNotSuccessful() public {
        uint256 id = _failedCampaign();
        vm.expectRevert(abi.encodeWithSelector(CampusFund.WrongStatus.selector, ICampusFund.Status.Failed));
        vm.prank(beneficiary);
        fund.withdrawTranche(id);
    }

    function test_Approve_OnlyGovernance() public {
        uint256 id = _successfulCampaign();
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, admin, fund.GOVERNANCE_ROLE())
        );
        vm.prank(admin); // même l'admin ne peut pas débloquer seul
        fund.approveMilestone(id, 0);
    }

    function test_Approve_RevertsOutOfOrder() public {
        uint256 id = _successfulCampaign();
        vm.expectRevert(abi.encodeWithSelector(CampusFund.WrongMilestone.selector, 0, 1));
        vm.prank(gov);
        fund.approveMilestone(id, 1);
    }

    function test_Approve_RevertsWhenAllApproved() public {
        uint256 id = _successfulCampaign();
        vm.startPrank(gov);
        fund.approveMilestone(id, 0);
        fund.approveMilestone(id, 1);
        fund.approveMilestone(id, 2);
        vm.expectRevert(CampusFund.AllMilestonesApproved.selector);
        fund.approveMilestone(id, 3);
        vm.stopPrank();
    }

    function test_Approve_RevertsIfNotSuccessful() public {
        uint256 id = _createCampaign();
        vm.expectRevert(abi.encodeWithSelector(CampusFund.WrongStatus.selector, ICampusFund.Status.Active));
        vm.prank(gov);
        fund.approveMilestone(id, 0);
    }

    function test_TrancheAmount_View() public {
        uint256 id = _successfulCampaign();
        assertEq(fund.trancheAmount(id, 0), 3 ether);
        assertEq(fund.trancheAmount(id, 2), 10 ether, "derniere tranche = reste (rien encore verse)");
        vm.expectRevert(CampusFund.InvalidMilestones.selector);
        fund.trancheAmount(id, 3);
    }

    // ================================================================ freeze

    function test_Freeze_ActiveCampaign() public {
        uint256 id = _createCampaign();
        vm.prank(alice);
        fund.contribute{value: 2 ether}(id);
        vm.prank(gov);
        fund.freezeCampaign(id);
        assertEq(uint8(fund.campaignStatus(id)), uint8(ICampusFund.Status.Cancelled));
        vm.prank(alice);
        fund.refund(id);
        assertEq(alice.balance, 100 ether);
    }

    function test_Freeze_OnlyGovernance() public {
        uint256 id = _createCampaign();
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, fund.GOVERNANCE_ROLE())
        );
        vm.prank(alice);
        fund.freezeCampaign(id);
    }

    function test_Freeze_RevertsOnFailed() public {
        uint256 id = _failedCampaign();
        vm.expectRevert(abi.encodeWithSelector(CampusFund.WrongStatus.selector, ICampusFund.Status.Failed));
        vm.prank(gov);
        fund.freezeCampaign(id);
    }

    // ================================================================ cancelStale

    function test_CancelStale_AfterInactivity() public {
        uint256 id = _successfulCampaign();
        vm.warp(block.timestamp + 90 days);
        vm.prank(carol); // n'importe qui
        fund.cancelStale(id);
        assertEq(uint8(fund.campaignStatus(id)), uint8(ICampusFund.Status.Cancelled));
    }

    function test_CancelStale_RevertsTooEarly() public {
        uint256 id = _successfulCampaign();
        vm.warp(block.timestamp + 90 days - 1);
        vm.expectRevert(CampusFund.NotStale.selector);
        fund.cancelStale(id);
    }

    function test_CancelStale_ApprovalResetsTimer() public {
        uint256 id = _successfulCampaign();
        vm.warp(block.timestamp + 60 days);
        vm.prank(gov);
        fund.approveMilestone(id, 0);
        vm.warp(block.timestamp + 60 days); // 120 jours après l'échéance, mais 60 après le dernier jalon
        vm.expectRevert(CampusFund.NotStale.selector);
        fund.cancelStale(id);
    }

    function test_CancelStale_RevertsWhenAllApproved() public {
        uint256 id = _successfulCampaign();
        vm.startPrank(gov);
        fund.approveMilestone(id, 0);
        fund.approveMilestone(id, 1);
        fund.approveMilestone(id, 2);
        vm.stopPrank();
        vm.warp(block.timestamp + 365 days);
        vm.expectRevert(CampusFund.AllMilestonesApproved.selector);
        fund.cancelStale(id);
    }

    function test_CancelStale_RevertsIfNotSuccessful() public {
        uint256 id = _createCampaign();
        vm.expectRevert(abi.encodeWithSelector(CampusFund.WrongStatus.selector, ICampusFund.Status.Active));
        fund.cancelStale(id);
    }

    // ================================================================ pause (circuit breaker)

    function test_Pause_BlocksContributeWithdrawRefundCreate() public {
        uint256 ok = _successfulCampaign();
        uint256 failed = _failedCampaign();
        uint256 active = _createCampaign();
        vm.prank(gov);
        fund.approveMilestone(ok, 0);

        vm.prank(admin);
        fund.pause();

        vm.expectRevert(Pausable.EnforcedPause.selector);
        vm.prank(alice);
        fund.contribute{value: 1 ether}(active);

        vm.expectRevert(Pausable.EnforcedPause.selector);
        vm.prank(beneficiary);
        fund.withdrawTranche(ok);

        vm.expectRevert(Pausable.EnforcedPause.selector);
        vm.prank(alice);
        fund.refund(failed);

        vm.expectRevert(Pausable.EnforcedPause.selector);
        fund.createCampaign(GOAL, DURATION, beneficiary, CID, _milestones3());

        vm.prank(admin);
        fund.unpause();
        vm.prank(beneficiary);
        fund.withdrawTranche(ok); // fonctionne de nouveau
    }

    function test_Pause_OnlyPauser() public {
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, fund.PAUSER_ROLE())
        );
        vm.prank(alice);
        fund.pause();
    }

    function test_Unpause_OnlyPauser() public {
        vm.prank(admin);
        fund.pause();
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, fund.PAUSER_ROLE())
        );
        vm.prank(alice);
        fund.unpause();
    }

    // ================================================================ vues

    function test_Views_RevertOnUnknownId() public {
        vm.expectRevert(CampusFund.CampaignNotFound.selector);
        fund.getCampaign(0);
        vm.expectRevert(CampusFund.CampaignNotFound.selector);
        fund.getMilestones(0);
        vm.expectRevert(CampusFund.CampaignNotFound.selector);
        fund.campaignParties(0);
    }

    function test_CampaignParties() public {
        uint256 id = _createCampaign();
        (address c, address b) = fund.campaignParties(id);
        assertEq(c, creator);
        assertEq(b, beneficiary);
    }

    function test_Read_RevertsForUnknownCampaign() public {
        vm.expectRevert(CampusFund.CampaignNotFound.selector);
        fund.getCampaign(99);
    }
}
