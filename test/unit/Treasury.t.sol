// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Treasury} from "../../contracts/Treasury.sol";

/// @dev Propriétaire malveillant (contrat) qui tente de ré-exécuter pendant la réception.
contract ReentrantOwner {
    Treasury public treasury;
    uint256 public txId;

    function setTreasury(Treasury t) external {
        treasury = t;
    }

    function submitAndExecute(uint256 value) external {
        txId = treasury.submit(payable(address(this)), value);
        treasury.execute(txId);
    }

    receive() external payable {
        if (address(treasury).balance > 0) {
            uint256 again = treasury.submit(payable(address(this)), 0.1 ether);
            treasury.execute(again);
        }
    }
}

contract TreasuryTest is Test {
    Treasury internal treasury;
    address internal o1 = makeAddr("owner1");
    address internal o2 = makeAddr("owner2");
    address internal o3 = makeAddr("owner3");
    address payable internal recipient = payable(makeAddr("recipient"));
    address internal stranger = makeAddr("stranger");

    function setUp() public {
        treasury = new Treasury([o1, o2, o3]);
        vm.deal(address(this), 100 ether);
        (bool ok,) = address(treasury).call{value: 10 ether}("");
        assertTrue(ok);
    }

    // ================================================================ constructeur

    function test_Constructor_Owners() public view {
        address[3] memory o = treasury.owners();
        assertEq(o[0], o1);
        assertTrue(treasury.isOwner(o2));
        assertFalse(treasury.isOwner(stranger));
    }

    function test_Constructor_RevertsOnDuplicateOwner() public {
        vm.expectRevert(Treasury.InvalidOwners.selector);
        new Treasury([o1, o1, o3]);
    }

    function test_Constructor_RevertsOnZeroOwner() public {
        vm.expectRevert(Treasury.InvalidOwners.selector);
        new Treasury([o1, address(0), o3]);
    }

    function test_Receive_EmitsDeposit() public {
        vm.expectEmit(true, false, false, true);
        emit Treasury.Deposit(address(this), 1 ether);
        (bool ok,) = address(treasury).call{value: 1 ether}("");
        assertTrue(ok);
    }

    // ================================================================ petits retraits (1 signature)

    function test_SmallWithdrawal_OneSignature() public {
        vm.startPrank(o1);
        uint256 id = treasury.submit(recipient, 0.5 ether);
        assertEq(treasury.requiredApprovals(id), 1);
        treasury.execute(id);
        vm.stopPrank();
        assertEq(recipient.balance, 0.5 ether);
        assertTrue(treasury.getTransaction(id).executed);
    }

    function test_SmallWithdrawal_ExactlyOneEth() public {
        vm.startPrank(o1);
        uint256 id = treasury.submit(recipient, 1 ether);
        treasury.execute(id);
        vm.stopPrank();
        assertEq(recipient.balance, 1 ether);
    }

    function test_DailyLimit_BlocksSplittingAttack() public {
        // un propriétaire seul essaie de vider la caisse en petits morceaux
        vm.startPrank(o1);
        uint256 a = treasury.submit(recipient, 0.6 ether);
        treasury.execute(a);
        uint256 b = treasury.submit(recipient, 0.6 ether);
        assertEq(treasury.requiredApprovals(b), 2);
        vm.expectRevert(abi.encodeWithSelector(Treasury.NotEnoughApprovals.selector, 1, 2));
        treasury.execute(b);
        vm.stopPrank();
    }

    function test_DailyLimit_ResetsNextDay() public {
        vm.startPrank(o1);
        uint256 a = treasury.submit(recipient, 1 ether);
        treasury.execute(a);
        vm.warp(block.timestamp + 1 days);
        uint256 b = treasury.submit(recipient, 1 ether);
        treasury.execute(b);
        vm.stopPrank();
        assertEq(recipient.balance, 2 ether);
    }

    function test_DailyLimit_TwoSignatureTxDoNotConsumeIt() public {
        vm.prank(o1);
        uint256 big = treasury.submit(recipient, 5 ether);
        vm.prank(o2);
        treasury.approve(big);
        vm.prank(o1);
        treasury.execute(big);
        assertEq(treasury.spentWithSingleApproval(block.timestamp / 1 days), 0);
        vm.startPrank(o3);
        uint256 small = treasury.submit(recipient, 1 ether);
        treasury.execute(small);
        vm.stopPrank();
        assertEq(recipient.balance, 6 ether);
    }

    // ================================================================ gros retraits (2 sur 3)

    function test_LargeWithdrawal_RevertsWithOneSignature() public {
        vm.startPrank(o1);
        uint256 id = treasury.submit(recipient, 1 ether + 1);
        vm.expectRevert(abi.encodeWithSelector(Treasury.NotEnoughApprovals.selector, 1, 2));
        treasury.execute(id);
        vm.stopPrank();
    }

    function test_LargeWithdrawal_TwoOfThree() public {
        vm.prank(o1);
        uint256 id = treasury.submit(recipient, 5 ether);
        vm.prank(o3);
        treasury.approve(id);
        assertEq(treasury.getTransaction(id).approvals, 2);
        vm.expectEmit(true, true, true, true);
        emit Treasury.Executed(id, o2, recipient, 5 ether);
        vm.prank(o2); // n'importe quel propriétaire peut exécuter
        treasury.execute(id);
        assertEq(recipient.balance, 5 ether);
        assertEq(address(treasury).balance, 5 ether);
    }

    function test_LargeWithdrawal_InsufficientBalanceReverts() public {
        vm.prank(o1);
        uint256 id = treasury.submit(recipient, 50 ether);
        vm.prank(o2);
        treasury.approve(id);
        vm.expectRevert(); // Address.InsufficientBalance
        vm.prank(o1);
        treasury.execute(id);
    }

    // ================================================================ approve / revoke

    function test_Approve_RevertsTwice() public {
        vm.prank(o1);
        uint256 id = treasury.submit(recipient, 5 ether);
        vm.expectRevert(Treasury.AlreadyApproved.selector);
        vm.prank(o1); // déjà approuvé automatiquement
        treasury.approve(id);
    }

    function test_Revoke_RemovesApproval() public {
        vm.prank(o1);
        uint256 id = treasury.submit(recipient, 5 ether);
        vm.prank(o2);
        treasury.approve(id);
        vm.prank(o2);
        treasury.revoke(id);
        assertEq(treasury.getTransaction(id).approvals, 1);
        vm.expectRevert(abi.encodeWithSelector(Treasury.NotEnoughApprovals.selector, 1, 2));
        vm.prank(o1);
        treasury.execute(id);
    }

    function test_Revoke_AllApprovalsThenSmallTxCannotRun() public {
        vm.startPrank(o1);
        uint256 id = treasury.submit(recipient, 0.1 ether);
        treasury.revoke(id);
        vm.expectRevert(abi.encodeWithSelector(Treasury.NotEnoughApprovals.selector, 0, 2));
        treasury.execute(id);
        vm.stopPrank();
    }

    function test_Revoke_RevertsIfNotApproved() public {
        vm.prank(o1);
        uint256 id = treasury.submit(recipient, 5 ether);
        vm.expectRevert(Treasury.NotApproved.selector);
        vm.prank(o2);
        treasury.revoke(id);
    }

    function test_CannotTouchExecutedTx() public {
        vm.startPrank(o1);
        uint256 id = treasury.submit(recipient, 0.1 ether);
        treasury.execute(id);
        vm.expectRevert(Treasury.AlreadyExecuted.selector);
        treasury.execute(id);
        vm.expectRevert(Treasury.AlreadyExecuted.selector);
        treasury.revoke(id);
        vm.stopPrank();
        vm.expectRevert(Treasury.AlreadyExecuted.selector);
        vm.prank(o2);
        treasury.approve(id);
    }

    // ================================================================ contrôle d'accès / validation

    function test_OnlyOwners() public {
        vm.startPrank(stranger);
        vm.expectRevert(Treasury.NotOwner.selector);
        treasury.submit(recipient, 1);
        vm.expectRevert(Treasury.NotOwner.selector);
        treasury.approve(0);
        vm.expectRevert(Treasury.NotOwner.selector);
        treasury.revoke(0);
        vm.expectRevert(Treasury.NotOwner.selector);
        treasury.execute(0);
        vm.stopPrank();
    }

    function test_Submit_RevertsOnInvalid() public {
        vm.startPrank(o1);
        vm.expectRevert(Treasury.InvalidTransaction.selector);
        treasury.submit(payable(address(0)), 1 ether);
        vm.expectRevert(Treasury.InvalidTransaction.selector);
        treasury.submit(recipient, 0);
        vm.stopPrank();
    }

    function test_UnknownTx() public {
        vm.startPrank(o1);
        vm.expectRevert(Treasury.TxNotFound.selector);
        treasury.approve(9);
        vm.expectRevert(Treasury.TxNotFound.selector);
        treasury.execute(9);
        vm.stopPrank();
        vm.expectRevert(Treasury.TxNotFound.selector);
        treasury.getTransaction(9);
        vm.expectRevert(Treasury.TxNotFound.selector);
        treasury.requiredApprovals(9);
        assertEq(treasury.transactionCount(), 0);
    }

    // ================================================================ réentrance

    function test_Reentrancy_Blocked() public {
        ReentrantOwner evil = new ReentrantOwner();
        Treasury t = new Treasury([address(evil), o2, o3]);
        evil.setTreasury(t);
        (bool ok,) = address(t).call{value: 5 ether}("");
        assertTrue(ok);
        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        evil.submitAndExecute(0.1 ether);
        assertEq(address(t).balance, 5 ether);
    }

    function test_Approve_RevertsForUnknownTransaction() public {
        vm.expectRevert(Treasury.TxNotFound.selector);
        vm.prank(o1);
        treasury.approve(99);
    }
}
