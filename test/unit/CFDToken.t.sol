// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {BaseTest} from "../utils/BaseTest.sol";

contract CFDTokenTest is BaseTest {
    function test_Metadata() public view {
        assertEq(token.name(), "CampusFund DAO Token");
        assertEq(token.symbol(), "CFD");
        assertEq(token.decimals(), 18);
        assertEq(token.RATE(), 1000);
    }

    function test_MintOnlyMinter() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, alice, token.MINTER_ROLE()
            )
        );
        vm.prank(alice);
        token.mint(alice, 1);
    }

    function test_BurnOnlyBurner() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, alice, token.BURNER_ROLE()
            )
        );
        vm.prank(alice);
        token.burn(bob, 1);
    }

    function test_MinterCanMint() public {
        vm.prank(address(fund));
        token.mint(alice, 5e18);
        assertEq(token.balanceOf(alice), 5e18);
    }

    function test_NoVotingPowerWithoutDelegation() public {
        vm.prank(address(fund));
        token.mint(alice, 5e18);
        assertEq(token.getVotes(alice), 0, "sans delegation, pas de pouvoir de vote");

        vm.prank(alice);
        token.delegate(alice);
        assertEq(token.getVotes(alice), 5e18);
    }

    function test_PastVotesAreFrozen() public {
        vm.prank(alice);
        token.delegate(alice);
        vm.prank(address(fund));
        token.mint(alice, 5e18);
        uint256 snapshot = block.number;
        vm.roll(block.number + 1);

        vm.prank(address(fund));
        token.mint(alice, 100e18);
        assertEq(token.getPastVotes(alice, snapshot), 5e18, "le passe ne change pas");
        assertEq(token.getVotes(alice), 105e18);
    }

    function test_TransferMovesVotes() public {
        vm.prank(address(fund));
        token.mint(alice, 10e18);
        vm.prank(alice);
        token.delegate(alice);
        vm.prank(bob);
        token.delegate(bob);
        vm.prank(alice);
        token.transfer(bob, 4e18);
        assertEq(token.getVotes(alice), 6e18);
        assertEq(token.getVotes(bob), 4e18);
    }
}
