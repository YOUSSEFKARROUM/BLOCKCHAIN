// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GovernanceBase} from "../utils/GovernanceBase.sol";
import {CampusFund} from "../../contracts/CampusFund.sol";
import {Governance} from "../../contracts/Governance.sol";
import {Treasury} from "../../contracts/Treasury.sol";

/// @notice Fuzzing : Foundry génère des centaines de valeurs aléatoires pour chaque paramètre
///         (montants, durées, découpages en jalons, moments d'appel) et vérifie que les propriétés tiennent.
contract CampusFundFuzzTest is GovernanceBase {
    /// @dev Construit un découpage valide de n jalons (2..5) à partir de graines aléatoires.
    function _randomMilestones(uint256 seed) internal pure returns (uint16[] memory m) {
        uint256 n = 2 + (seed % 4);
        m = new uint16[](n);
        uint256 remaining = 10_000;
        for (uint256 i; i < n - 1; ++i) {
            uint256 maxHere = remaining - (n - 1 - i); // laisser au moins 1 bps à chaque jalon suivant
            uint256 part = 1 + (uint256(keccak256(abi.encode(seed, i))) % maxHere);
            m[i] = uint16(part);
            remaining -= part;
        }
        m[n - 1] = uint16(remaining);
    }

    /// @notice Pour tout montant, on reçoit exactement montant * 1000 CFD.
    function testFuzz_ContributeMintsAtRate(uint256 amount) public {
        amount = bound(amount, 1, 1_000 ether);
        uint256 id = _createCampaign();
        vm.deal(alice, amount);
        vm.prank(alice);
        fund.contribute{value: amount}(id);
        assertEq(token.balanceOf(alice), amount * 1000);
        assertEq(fund.totalOwed(), amount);
    }

    /// @notice Toute durée dans [1 h, 90 j] est acceptée, toute autre est refusée.
    function testFuzz_DurationBounds(uint256 duration) public {
        duration = bound(duration, 0, 200 days);
        bool valid = duration >= 1 hours && duration <= 90 days;
        if (!valid) vm.expectRevert(CampusFund.InvalidDuration.selector);
        vm.prank(creator);
        fund.createCampaign(GOAL, duration, beneficiary, CID, _milestones3());
    }

    /// @notice Pour tout découpage valide et tout montant collecté, la somme des tranches = montant collecté,
    ///         frais + net = tranche, et le contrat finit à 0.
    function testFuzz_TranchesSumToRaised(uint256 seed, uint256 raised) public {
        raised = bound(raised, 1, 500 ether);
        uint16[] memory m = _randomMilestones(seed);
        vm.prank(creator);
        uint256 id = fund.createCampaign(raised, DURATION, beneficiary, CID, m);
        vm.deal(alice, raised);
        vm.prank(alice);
        fund.contribute{value: raised}(id);
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id);

        for (uint256 i; i < m.length; ++i) {
            _passRelease(id);
            vm.prank(beneficiary);
            fund.withdrawTranche(id);
        }
        assertEq(beneficiary.balance + treasury.balance, raised, "tout l'argent est arrive");
        assertEq(address(fund).balance, 0);
        assertEq(fund.totalOwed(), 0);
        assertLe(treasury.balance, (raised * 200) / 10_000 + m.length, "frais <= 2 % (+ arrondis)");
    }

    /// @notice Gel après k tranches : la somme des remboursements ne dépasse jamais ce qui reste,
    ///         et il ne reste au plus que quelques wei d'arrondi.
    function testFuzz_RefundsNeverExceedRemaining(uint256 a, uint256 b, uint256 k) public {
        a = bound(a, 1 ether, 50 ether);
        b = bound(b, 1 ether, 50 ether);
        uint256 id = _createCampaign();
        vm.deal(alice, a);
        vm.deal(bob, b);
        vm.prank(alice);
        fund.contribute{value: a}(id);
        vm.prank(bob);
        fund.contribute{value: b}(id);
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id);
        if (a + b < GOAL) {
            // échec : remboursement intégral
            vm.prank(alice);
            fund.refund(id);
            assertEq(alice.balance, a);
            return;
        }
        k = bound(k, 0, 2); // au plus 2 tranches sur 3 avant le gel
        for (uint256 i; i < k; ++i) {
            // alice ET bob votent : selon le tirage, alice seule peut être sous le quorum de 10 %
            uint256 pid = _proposeRelease(id);
            vm.prank(alice);
            governance.castVote(pid, true);
            vm.prank(bob);
            governance.castVote(pid, true);
            _endVote();
            governance.execute(pid);
            vm.prank(beneficiary);
            fund.withdrawTranche(id);
        }
        vm.prank(gov);
        vm.expectRevert(); // "gov" n'a plus le rôle : seule la vraie gouvernance peut geler
        fund.freezeCampaign(id);

        vm.prank(address(governance));
        fund.freezeCampaign(id);
        uint256 remaining = address(fund).balance;
        vm.prank(alice);
        fund.refund(id);
        vm.prank(bob);
        fund.refund(id);
        assertEq(alice.balance + bob.balance + address(fund).balance, remaining);
        assertLe(address(fund).balance, 2, "au plus 1 wei d'arrondi par contributeur");
        assertEq(token.totalSupply(), 0, "tous les CFD ont ete brules");
    }

    /// @notice Ordre des appels : quel que soit le moment (avant/après échéance, avant/après vote),
    ///         le bénéficiaire ne peut jamais retirer sans jalon approuvé.
    function testFuzz_NoWithdrawWithoutVote(uint256 when, uint256 amount) public {
        amount = bound(amount, 1 wei, 30 ether);
        when = bound(when, 0, 200 days);
        uint256 id = _createCampaign();
        vm.deal(alice, amount);
        vm.prank(alice);
        fund.contribute{value: amount}(id);
        vm.warp(block.timestamp + when);
        if (when >= DURATION) fund.finalize(id);
        vm.expectRevert();
        vm.prank(beneficiary);
        fund.withdrawTranche(id);
    }

    /// @notice Pour tout montant acheté après le snapshot, le poids de vote reste celui du snapshot.
    function testFuzz_LateTokensNeverCount(uint256 late) public {
        late = bound(late, 1, 1_000 ether);
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        uint256 other = _createCampaign();
        vm.deal(alice, late);
        vm.prank(alice);
        fund.contribute{value: late}(other);
        _nextBlock();
        vm.prank(alice);
        governance.castVote(pid, true);
        assertEq(governance.getProposal(pid).forVotes, 6000 ether, "seulement les 6 ETH d'avant le snapshot");
    }

    /// @notice Pour tout montant > plafond restant du jour, une seule signature ne suffit jamais.
    function testFuzz_TreasuryLargeNeedsTwo(uint256 value) public {
        address o1 = makeAddr("o1");
        Treasury t = new Treasury([o1, makeAddr("o2"), makeAddr("o3")]);
        vm.deal(address(t), 1_000 ether);
        value = bound(value, 1 ether + 1, 1_000 ether);
        vm.startPrank(o1);
        uint256 txId = t.submit(payable(makeAddr("to")), value);
        vm.expectRevert(abi.encodeWithSelector(Treasury.NotEnoughApprovals.selector, 1, 2));
        t.execute(txId);
        vm.stopPrank();
    }

    /// @notice Quorum : pour toute participation, l'issue respecte exactement la règle des 10 %.
    function testFuzz_QuorumRule(uint256 voterAmount) public {
        voterAmount = bound(voterAmount, 0.001 ether, 10 ether);
        uint256 id = _createCampaign();
        vm.deal(alice, 20 ether);
        vm.prank(alice);
        fund.contribute{value: 20 ether}(id); // alice ne vote pas
        vm.deal(carol, voterAmount);
        vm.prank(carol);
        fund.contribute{value: voterAmount}(id);
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id);
        uint256 pid = _proposeRelease(id);
        vm.prank(carol);
        governance.castVote(pid, true);
        _endVote();
        uint256 supply = (20 ether + voterAmount) * 1000;
        bool quorum = voterAmount * 1000 >= supply / 10;
        Governance.ProposalState expected =
            quorum ? Governance.ProposalState.Succeeded : Governance.ProposalState.Defeated;
        assertEq(uint8(governance.state(pid)), uint8(expected));
    }
}
