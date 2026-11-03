// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GovernanceBase} from "../utils/GovernanceBase.sol";
import {Governance} from "../../contracts/Governance.sol";
import {ICampusFund} from "../../contracts/interfaces/ICampusFund.sol";
import {NaiveGovernance} from "../../contracts/demo/NaiveGovernance.sol";
import {MockFlashLender} from "../../contracts/demo/MockFlashLender.sol";
import {FlashLoanAttacker} from "../../contracts/demo/FlashLoanAttacker.sol";
import {IVoting} from "../../contracts/interfaces/IVoting.sol";

/// @notice Scénario : une campagne honnête est en cours (alice 6 ETH, bob 4 ETH -> 10 000 CFD).
///         Un attaquant sans aucun CFD veut la geler. Un prêteur flash dispose de 1 000 000 CFD.
contract FlashLoanGovernanceTest is GovernanceBase {
    MockFlashLender internal lender;
    address internal attackerEOA = makeAddr("attacker");
    uint256 internal campaignId;

    uint256 internal constant POOL = 1_000_000 ether;

    function setUp() public override {
        super.setUp();
        lender = new MockFlashLender(token);
        // On remplit la réserve du prêteur (dans la réalité : un pool de liquidité DeFi).
        vm.startPrank(admin);
        token.grantRole(token.MINTER_ROLE(), admin);
        token.mint(address(lender), POOL);
        vm.stopPrank();

        campaignId = _createCampaign();
        vm.prank(alice);
        fund.contribute{value: 6 ether}(campaignId);
        vm.prank(bob);
        fund.contribute{value: 4 ether}(campaignId);
        _nextBlock();
    }

    /// @notice SANS snapshot : l'attaquant emprunte 1 M CFD, vote, rend tout... et gèle la campagne.
    function test_FlashLoan_SucceedsWithoutSnapshot() public {
        NaiveGovernance naive = new NaiveGovernance(token, fund, VOTING_PERIOD);
        vm.startPrank(admin);
        fund.grantRole(fund.GOVERNANCE_ROLE(), address(naive));
        vm.stopPrank();

        uint256 pid = naive.proposeFreeze(campaignId);
        vm.prank(alice);
        naive.castVote(pid, false); // la communauté vote contre (6 000 CFD)
        vm.prank(bob);
        naive.castVote(pid, false); // (4 000 CFD)

        vm.startPrank(attackerEOA);
        FlashLoanAttacker attacker = new FlashLoanAttacker(lender, IVoting(address(naive)));
        attacker.attack(pid, POOL);
        vm.stopPrank();

        (,, uint256 forVotes, uint256 againstVotes,) = naive.proposals(pid);
        assertEq(forVotes, POOL, "1 M CFD empruntes comptent comme votes");
        assertEq(againstVotes, 10_000 ether);
        assertEq(token.balanceOf(address(attacker)), 0, "l'attaquant n'a plus aucun CFD");
        assertEq(token.balanceOf(address(lender)), POOL, "le pret a ete rembourse");

        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        naive.execute(pid);
        assertEq(uint8(fund.campaignStatus(campaignId)), uint8(ICampusFund.Status.Cancelled), "campagne gelee !");
    }

    /// @notice AVEC snapshot : même attaque, mais l'attaquant avait 0 vote au bloc du snapshot.
    function test_FlashLoan_FailsWithSnapshot() public {
        vm.prank(bob);
        uint256 pid = governance.proposeFreeze(campaignId, "test");
        _nextBlock(); // l'attaquant agit après la création de la proposition

        vm.startPrank(attackerEOA);
        FlashLoanAttacker attacker = new FlashLoanAttacker(lender, IVoting(address(governance)));
        vm.expectRevert(Governance.NoVotingPower.selector);
        attacker.attack(pid, POOL);
        vm.stopPrank();

        assertEq(governance.getProposal(pid).forVotes, 0);
        assertEq(uint8(fund.campaignStatus(campaignId)), uint8(ICampusFund.Status.Active));
    }

    /// @notice Même si l'emprunt a lieu DANS LE BLOC de la proposition (avant elle), le snapshot étant le
    ///         bloc précédent, les CFD empruntés ne comptent toujours pas.
    function test_FlashLoan_FailsEvenInProposalBlock() public {
        vm.startPrank(attackerEOA);
        FlashLoanAttacker attacker = new FlashLoanAttacker(lender, IVoting(address(governance)));
        vm.stopPrank();
        // L'attaquant détient temporairement les CFD au moment même où la proposition est créée.
        vm.prank(address(lender));
        token.transfer(address(attacker), POOL);
        vm.prank(address(attacker));
        token.delegate(address(attacker));

        vm.prank(bob);
        uint256 pid = governance.proposeFreeze(campaignId, "test");
        // La réserve du prêteur existait avant le snapshot : elle compte dans l'offre totale (donc le quorum),
        // mais ces jetons ne sont délégués à personne au snapshot, donc ils ne donnent de poids à personne.
        assertEq(governance.getProposal(pid).quorum, (POOL + 10_000 ether) / 10);

        vm.expectRevert(Governance.NoVotingPower.selector);
        vm.prank(address(attacker));
        governance.castVote(pid, true);
    }

    /// @notice Le prêteur refuse un emprunteur qui ne rembourse pas.
    function test_FlashLender_RevertsIfNotRepaid() public {
        NotRepaying bad = new NotRepaying(lender);
        vm.expectRevert(MockFlashLender.NotRepaid.selector);
        bad.borrow(1 ether);
    }
}

contract NotRepaying {
    MockFlashLender internal immutable lender;

    constructor(MockFlashLender lender_) {
        lender = lender_;
    }

    function borrow(uint256 amount) external {
        lender.flashLoan(amount, "");
    }

    function onFlashLoan(uint256, bytes calldata) external {}
}
