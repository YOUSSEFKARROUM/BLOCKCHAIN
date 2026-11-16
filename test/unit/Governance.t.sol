// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {GovernanceBase} from "../utils/GovernanceBase.sol";
import {Governance} from "../../contracts/Governance.sol";
import {CampusFund} from "../../contracts/CampusFund.sol";
import {ICampusFund} from "../../contracts/interfaces/ICampusFund.sol";

contract GovernanceTest is GovernanceBase {
    // ================================================================ constructeur / paramètres

    function test_Constructor_SetsParams() public view {
        assertEq(governance.votingPeriod(), VOTING_PERIOD);
        assertEq(governance.proposalThreshold(), THRESHOLD);
        assertFalse(governance.quadraticVoting(), "vote quadratique desactive par defaut");
        assertTrue(fund.hasRole(fund.GOVERNANCE_ROLE(), address(governance)));
    }

    function test_Constructor_RevertsOnBadPeriod() public {
        vm.expectRevert(Governance.InvalidVotingPeriod.selector);
        new Governance(admin, token, fund, 59 minutes, THRESHOLD);
        vm.expectRevert(Governance.InvalidVotingPeriod.selector);
        new Governance(admin, token, fund, 15 days, THRESHOLD);
    }

    function test_SetVotingPeriod() public {
        vm.prank(admin);
        governance.setVotingPeriod(1 hours);
        assertEq(governance.votingPeriod(), 1 hours);
    }

    function test_SetVotingPeriod_RevertsOutOfBounds() public {
        vm.expectRevert(Governance.InvalidVotingPeriod.selector);
        vm.prank(admin);
        governance.setVotingPeriod(30 minutes);
    }

    function test_Params_OnlyParamsRole() public {
        bytes memory err = abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector, alice, governance.PARAMS_ROLE()
        );
        vm.startPrank(alice);
        vm.expectRevert(err);
        governance.setVotingPeriod(1 hours);
        vm.expectRevert(err);
        governance.setProposalThreshold(0);
        vm.expectRevert(err);
        governance.setQuadraticVoting(true);
        vm.stopPrank();
    }

    function test_SetProposalThreshold() public {
        vm.prank(admin);
        governance.setProposalThreshold(5 ether);
        assertEq(governance.proposalThreshold(), 5 ether);
    }

    // ================================================================ proposeMilestoneRelease

    function test_ProposeRelease_StoresSnapshot() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        Governance.Proposal memory p = governance.getProposal(pid);
        assertEq(uint8(p.ptype), uint8(Governance.ProposalType.MilestoneRelease));
        assertEq(p.campaignId, id);
        assertEq(p.milestoneIndex, 0);
        assertEq(p.snapshotBlock, block.number - 1, "snapshot = bloc precedent");
        assertEq(p.voteEnd, block.timestamp + VOTING_PERIOD);
        assertEq(p.quorum, 1000 ether, "10 % de 10 000 CFD");
        assertEq(uint8(governance.state(pid)), uint8(Governance.ProposalState.Active));
    }

    function test_ProposeRelease_BeneficiaryCanPropose() public {
        uint256 id = _successfulCampaign();
        _nextBlock();
        vm.prank(beneficiary);
        governance.proposeMilestoneRelease(id, "x", PROOF);
    }

    function test_ProposeRelease_RevertsForStranger() public {
        uint256 id = _successfulCampaign();
        vm.expectRevert(Governance.NotCampaignOwner.selector);
        vm.prank(alice);
        governance.proposeMilestoneRelease(id, "x", PROOF);
    }

    function test_ProposeRelease_RevertsIfNotSuccessful() public {
        uint256 id = _createCampaign();
        vm.expectRevert(Governance.CampaignNotSuccessful.selector);
        vm.prank(creator);
        governance.proposeMilestoneRelease(id, "x", PROOF);
    }

    function test_ProposeRelease_RevertsWhenAllApproved() public {
        uint256 id = _successfulCampaign();
        _passRelease(id);
        _passRelease(id);
        _passRelease(id);
        vm.expectRevert(Governance.AllMilestonesApproved.selector);
        vm.prank(creator);
        governance.proposeMilestoneRelease(id, "x", PROOF);
    }

    // ================================================================ proposeFreeze

    function test_ProposeFreeze_WithEnoughVotes() public {
        uint256 id = _createCampaign();
        vm.prank(bob);
        fund.contribute{value: 1 ether}(id); // 1000 CFD >= 100 CFD
        _nextBlock();
        vm.prank(bob);
        uint256 pid = governance.proposeFreeze(id, "Campagne suspecte");
        assertEq(uint8(governance.getProposal(pid).ptype), uint8(Governance.ProposalType.FreezeCampaign));
    }

    function test_ProposeFreeze_RevertsBelowThreshold() public {
        uint256 id = _createCampaign();
        vm.prank(bob);
        fund.contribute{value: 0.05 ether}(id); // 50 CFD < 100
        _nextBlock();
        vm.expectRevert(
            abi.encodeWithSelector(Governance.BelowProposalThreshold.selector, 50 ether, THRESHOLD)
        );
        vm.prank(bob);
        governance.proposeFreeze(id, "x");
    }

    function test_ProposeFreeze_RevertsSameBlockTokens() public {
        uint256 id = _createCampaign();
        vm.prank(bob);
        fund.contribute{value: 1 ether}(id);
        // même bloc : les CFD ne sont pas encore "passés"
        vm.expectRevert(abi.encodeWithSelector(Governance.BelowProposalThreshold.selector, 0, THRESHOLD));
        vm.prank(bob);
        governance.proposeFreeze(id, "x");
    }

    function test_ProposeFreeze_RevertsOnFailedCampaign() public {
        uint256 id = _failedCampaign();
        vm.expectRevert(Governance.CampaignNotFreezable.selector);
        vm.prank(alice);
        governance.proposeFreeze(id, "x");
    }

    // ================================================================ castVote

    function test_Vote_WeightIsSnapshotVotes() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        vm.expectEmit(true, true, false, true);
        emit Governance.VoteCast(pid, alice, true, 6000 ether, 6000 ether);
        vm.prank(alice);
        governance.castVote(pid, true);
        vm.prank(bob);
        governance.castVote(pid, false);
        Governance.Proposal memory p = governance.getProposal(pid);
        assertEq(p.forVotes, 6000 ether);
        assertEq(p.againstVotes, 4000 ether);
        assertEq(p.participation, 10_000 ether);
    }

    function test_Vote_TokensAcquiredAfterSnapshotDoNotCount() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        // carol contribue à une autre campagne APRÈS la proposition : 50 000 CFD... qui ne comptent pas
        uint256 other = _createCampaign();
        vm.prank(carol);
        fund.contribute{value: 50 ether}(other);
        _nextBlock();
        vm.expectRevert(Governance.NoVotingPower.selector);
        vm.prank(carol);
        governance.castVote(pid, false);
    }

    function test_Vote_TransferAfterSnapshotDoesNotDoubleVote() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        vm.prank(alice);
        governance.castVote(pid, true);
        vm.prank(alice);
        token.transfer(carol, 6000 ether); // alice "passe" ses jetons à carol pour revoter
        _nextBlock();
        vm.expectRevert(Governance.NoVotingPower.selector);
        vm.prank(carol);
        governance.castVote(pid, true);
    }

    /// @dev Déblocage : le poids vient de la contribution à la campagne, la délégation n'est pas nécessaire.
    function test_ReleaseVote_WorksWithoutDelegation() public {
        uint256 id = _createCampaign();
        address dave = makeAddr("dave");
        vm.deal(dave, 10 ether);
        vm.prank(dave);
        fund.contribute{value: 10 ether}(id); // dave a 10 000 CFD mais ne s'est pas délégué
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id);
        uint256 pid = _proposeRelease(id);
        vm.prank(dave);
        governance.castVote(pid, true);
        assertEq(governance.getProposal(pid).forVotes, 10_000 ether);
    }

    /// @dev Le porteur et le bénéficiaire ne votent pas le déblocage de leurs propres fonds, même s'ils
    ///      ont contribué (sinon 10 % de mise suffiraient à se débloquer seul quand les autres s'abstiennent).
    function test_ReleaseVote_RevertsForCreatorAndBeneficiary() public {
        uint256 id = _createCampaign();
        vm.deal(creator, 2 ether);
        vm.deal(beneficiary, 2 ether);
        vm.prank(creator);
        fund.contribute{value: 2 ether}(id);
        vm.prank(beneficiary);
        fund.contribute{value: 2 ether}(id);
        vm.prank(alice);
        fund.contribute{value: 6 ether}(id);
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id);
        uint256 pid = _proposeRelease(id);

        assertEq(governance.votingPower(pid, creator), 0);
        assertEq(governance.votingPower(pid, beneficiary), 0);
        vm.prank(creator);
        vm.expectRevert(Governance.NoVotingPower.selector);
        governance.castVote(pid, true);
        vm.prank(beneficiary);
        vm.expectRevert(Governance.NoVotingPower.selector);
        governance.castVote(pid, true);
        // le quorum reste calculé sur toute la collecte (10 ETH -> 1000 CFD)
        assertEq(governance.getProposal(pid).quorum, 1_000 ether);
    }

    /// @dev La règle ne concerne que les déblocages : le porteur vote un gel comme tout détenteur de CFD.
    function test_FreezeVote_AllowsCreator() public {
        uint256 id = _createCampaign();
        vm.deal(creator, 2 ether);
        vm.prank(creator);
        fund.contribute{value: 2 ether}(id);
        vm.prank(creator);
        token.delegate(creator);
        vm.prank(alice);
        fund.contribute{value: 1 ether}(id);
        _nextBlock();
        vm.prank(alice);
        uint256 pid = governance.proposeFreeze(id, "Suspicion");
        vm.prank(creator);
        governance.castVote(pid, false);
        assertEq(governance.getProposal(pid).againstVotes, 2_000 ether);
    }

    /// @dev Gel : vote de toute la communauté, il faut des CFD délégués au snapshot.
    function test_FreezeVote_RevertsWithoutDelegation() public {
        uint256 id = _createCampaign();
        address dave = makeAddr("dave");
        vm.deal(dave, 1 ether);
        vm.prank(dave);
        fund.contribute{value: 1 ether}(id); // 1000 CFD, non délégués
        vm.prank(alice);
        fund.contribute{value: 1 ether}(id);
        _nextBlock();
        vm.prank(alice);
        uint256 pid = governance.proposeFreeze(id, "Campagne suspecte");
        vm.expectRevert(Governance.NoVotingPower.selector);
        vm.prank(dave);
        governance.castVote(pid, true);
    }

    /// @dev Un détenteur de CFD qui n'a rien versé à CETTE campagne ne vote pas sur ses tranches.
    function test_ReleaseVote_RevertsForNonContributor() public {
        uint256 id = _successfulCampaign(); // alice 6 ETH + bob 4 ETH
        uint256 other = _createCampaign();
        vm.prank(carol);
        fund.contribute{value: 5 ether}(other); // carol : 5000 CFD délégués, mais pas dans la campagne `id`
        uint256 pid = _proposeRelease(id);
        assertEq(governance.votingPower(pid, carol), 0);
        vm.expectRevert(Governance.NoVotingPower.selector);
        vm.prank(carol);
        governance.castVote(pid, true);
    }

    /// @dev Quorum d'un déblocage = 10 % des CFD de la campagne, pas de toute la plateforme.
    function test_ReleaseQuorum_IsTenPercentOfCampaign() public {
        uint256 id = _successfulCampaign(); // 10 ETH => 10 000 CFD
        uint256 other = _createCampaign();
        vm.prank(carol);
        fund.contribute{value: 5 ether}(other); // l'offre totale grossit, le quorum de `id` ne bouge pas
        uint256 pid = _proposeRelease(id);
        assertEq(governance.getProposal(pid).quorum, 1_000 ether);
        assertEq(governance.votingPower(pid, alice), 6_000 ether);
        assertEq(governance.votingPower(pid, bob), 4_000 ether);
    }

    function test_Release_RevertsWhileAnotherIsOpen() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        vm.expectRevert(abi.encodeWithSelector(Governance.ProposalAlreadyOpen.selector, pid));
        vm.prank(creator);
        governance.proposeMilestoneRelease(id, "Relance", PROOF);
    }

    function test_Release_RevertsWhileSucceededNotExecuted() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        vm.prank(alice);
        governance.castVote(pid, true);
        _endVote(); // adoptée mais pas encore exécutée
        vm.expectRevert(abi.encodeWithSelector(Governance.ProposalAlreadyOpen.selector, pid));
        vm.prank(creator);
        governance.proposeMilestoneRelease(id, "Relance", PROOF);
    }

    function test_Release_AllowedAgainAfterDefeat() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        vm.prank(alice);
        governance.castVote(pid, false);
        _endVote(); // rejetée
        uint256 next = _proposeRelease(id);
        assertEq(next, pid + 1);
    }

    function test_Freeze_RevertsWhileAnotherIsOpen() public {
        uint256 id = _successfulCampaign();
        _nextBlock();
        vm.prank(alice);
        uint256 pid = governance.proposeFreeze(id, "Suspecte");
        vm.expectRevert(abi.encodeWithSelector(Governance.ProposalAlreadyOpen.selector, pid));
        vm.prank(bob);
        governance.proposeFreeze(id, "Encore");
        // un déblocage reste possible en parallèle : les deux types sont indépendants
        _proposeRelease(id);
    }

    function test_Release_RevertsWithoutProof() public {
        uint256 id = _successfulCampaign();
        _nextBlock();
        vm.expectRevert(Governance.MissingProof.selector);
        vm.prank(creator);
        governance.proposeMilestoneRelease(id, "Jalon atteint", "");
    }

    function test_Release_StoresProof() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        assertEq(governance.getProposal(pid).proof, PROOF);
    }

    function test_VotingPower_RevertsForUnknownProposal() public {
        vm.expectRevert(Governance.ProposalNotFound.selector);
        governance.votingPower(42, alice);
    }

    function test_Vote_RevertsTwice() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        vm.startPrank(alice);
        governance.castVote(pid, true);
        vm.expectRevert(Governance.AlreadyVoted.selector);
        governance.castVote(pid, false);
        vm.stopPrank();
    }

    function test_Vote_RevertsAfterEnd() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        _endVote();
        vm.expectRevert(Governance.VotingClosed.selector);
        vm.prank(alice);
        governance.castVote(pid, true);
    }

    function test_Vote_RevertsUnknownProposal() public {
        vm.expectRevert(Governance.ProposalNotFound.selector);
        vm.prank(alice);
        governance.castVote(7, true);
    }

    // ================================================================ state / quorum / majorité

    function test_State_DefeatedWithoutQuorum() public {
        // 20 ETH collectés (20 000 CFD) ; seul un petit contributeur vote : 1 000 CFD < quorum 2 000
        uint256 id = _createCampaign();
        vm.prank(alice);
        fund.contribute{value: 19 ether}(id);
        vm.prank(bob);
        fund.contribute{value: 0.999 ether}(id);
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id);
        uint256 pid = _proposeRelease(id);
        vm.prank(bob);
        governance.castVote(pid, true);
        _endVote();
        assertEq(uint8(governance.state(pid)), uint8(Governance.ProposalState.Defeated));
        vm.expectRevert(
            abi.encodeWithSelector(Governance.NotSucceeded.selector, Governance.ProposalState.Defeated)
        );
        governance.execute(pid);
    }

    function test_State_QuorumReachedExactly() public {
        // quorum = 10 % de 10 000 = 1 000 CFD ; carol vote avec exactement 1 000 CFD
        uint256 id = _createCampaign();
        vm.prank(alice);
        fund.contribute{value: 9 ether}(id);
        vm.prank(carol);
        fund.contribute{value: 1 ether}(id);
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id);
        uint256 pid = _proposeRelease(id);
        vm.prank(carol);
        governance.castVote(pid, true);
        _endVote();
        assertEq(uint8(governance.state(pid)), uint8(Governance.ProposalState.Succeeded));
    }

    function test_State_DefeatedOnTie() public {
        uint256 id = _createCampaign();
        vm.prank(alice);
        fund.contribute{value: 5 ether}(id);
        vm.prank(bob);
        fund.contribute{value: 5 ether}(id);
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id);
        uint256 pid = _proposeRelease(id);
        vm.prank(alice);
        governance.castVote(pid, true);
        vm.prank(bob);
        governance.castVote(pid, false);
        _endVote();
        assertEq(uint8(governance.state(pid)), uint8(Governance.ProposalState.Defeated), "50/50 = rejet");
    }

    function test_State_DefeatedWhenMajorityAgainst() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        vm.prank(alice);
        governance.castVote(pid, false);
        vm.prank(bob);
        governance.castVote(pid, true);
        _endVote();
        assertEq(uint8(governance.state(pid)), uint8(Governance.ProposalState.Defeated));
    }

    function test_State_DefeatedWithNoVotesAtAll() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        _endVote();
        assertEq(uint8(governance.state(pid)), uint8(Governance.ProposalState.Defeated));
    }

    function test_State_RevertsUnknown() public {
        vm.expectRevert(Governance.ProposalNotFound.selector);
        governance.state(0);
        vm.expectRevert(Governance.ProposalNotFound.selector);
        governance.getProposal(0);
    }

    // ================================================================ execute

    function test_Execute_RevertsDuringVote() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        vm.prank(alice);
        governance.castVote(pid, true);
        vm.expectRevert(
            abi.encodeWithSelector(Governance.NotSucceeded.selector, Governance.ProposalState.Active)
        );
        governance.execute(pid);
    }

    function test_Execute_RevertsTwice() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _passRelease(id);
        assertEq(uint8(governance.state(pid)), uint8(Governance.ProposalState.Executed));
        vm.expectRevert(
            abi.encodeWithSelector(Governance.NotSucceeded.selector, Governance.ProposalState.Executed)
        );
        governance.execute(pid);
    }

    function test_Execute_AnyoneCanExecute() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        vm.prank(alice);
        governance.castVote(pid, true);
        _endVote();
        vm.prank(makeAddr("random"));
        governance.execute(pid);
        (, uint8 approved,) = fund.milestoneProgress(id);
        assertEq(approved, 1);
    }

    function test_Execute_DuplicateMilestoneProposalImpossible() public {
        // Deux propositions concurrentes pour le même jalon ne peuvent plus coexister ; le contrôle
        // d'ordre des jalons de CampusFund (WrongMilestone, testé dans CampusFund.t.sol) reste en défense.
        uint256 id = _successfulCampaign();
        uint256 p1 = _proposeRelease(id);
        vm.prank(alice);
        governance.castVote(p1, true);
        _endVote();
        governance.execute(p1);
        uint256 p2 = _proposeRelease(id); // après exécution, le jalon suivant peut être demandé
        assertEq(governance.getProposal(p2).milestoneIndex, 1);
    }

    // ================================================================ parcours complet : jalons

    function test_Flow_ThreeMilestonesVotedAndWithdrawn() public {
        uint256 id = _successfulCampaign();
        for (uint256 i; i < 3; ++i) {
            vm.expectRevert(CampusFund.NoApprovedTranche.selector);
            vm.prank(beneficiary);
            fund.withdrawTranche(id); // impossible avant le vote

            _passRelease(id);
            vm.prank(beneficiary);
            fund.withdrawTranche(id);
        }
        assertEq(beneficiary.balance, 9.8 ether);
        assertEq(treasury.balance, 0.2 ether);
        assertEq(address(fund).balance, 0);
    }

    function test_Flow_FreezeSuspiciousCampaignThenRefund() public {
        uint256 id = _successfulCampaign();
        _passRelease(id);
        vm.prank(beneficiary);
        fund.withdrawTranche(id); // 3 ETH sortis

        _nextBlock();
        vm.prank(bob);
        uint256 pid = governance.proposeFreeze(id, "Le materiel n'a jamais ete achete");
        vm.prank(alice);
        governance.castVote(pid, true);
        vm.prank(bob);
        governance.castVote(pid, true);
        _endVote();
        governance.execute(pid);
        assertEq(uint8(fund.campaignStatus(id)), uint8(ICampusFund.Status.Cancelled));

        uint256 before = alice.balance;
        vm.prank(alice);
        fund.refund(id);
        assertEq(alice.balance - before, 4.2 ether, "70 % de 6 ETH");
    }

    // ================================================================ vote quadratique (extension)

    function test_Quadratic_WeightIsSqrt() public {
        vm.prank(admin);
        governance.setQuadraticVoting(true);
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id);
        assertTrue(governance.getProposal(pid).quadratic);
        vm.prank(alice);
        governance.castVote(pid, true); // sqrt(6000e18)
        vm.prank(bob);
        governance.castVote(pid, false); // sqrt(4000e18)
        Governance.Proposal memory p = governance.getProposal(pid);
        assertEq(p.forVotes, 77459666924);
        assertEq(p.againstVotes, 63245553203);
        assertEq(p.participation, 10_000 ether, "le quorum reste calcule en CFD bruts");
    }

    function test_Quadratic_SmallHoldersCanOutvoteWhale() public {
        vm.prank(admin);
        governance.setQuadraticVoting(true);
        // baleine : 9 ETH contre ; quatre petits : 1 ETH chacun pour.
        // Linéaire : 9000 contre 4000 -> rejet. Quadratique : sqrt(9000)=94,9 contre 4*sqrt(1000)=126,5 -> adopté.
        address[4] memory small = [makeAddr("s1"), makeAddr("s2"), makeAddr("s3"), makeAddr("s4")];
        uint256 id = _createCampaign();
        vm.prank(alice);
        fund.contribute{value: 9 ether}(id);
        for (uint256 i; i < 4; ++i) {
            vm.deal(small[i], 1 ether);
            vm.startPrank(small[i]);
            token.delegate(small[i]);
            fund.contribute{value: 1 ether}(id);
            vm.stopPrank();
        }
        vm.warp(block.timestamp + DURATION);
        fund.finalize(id);
        uint256 pid = _proposeRelease(id);
        vm.prank(alice);
        governance.castVote(pid, false);
        for (uint256 i; i < 4; ++i) {
            vm.prank(small[i]);
            governance.castVote(pid, true);
        }
        Governance.Proposal memory p = governance.getProposal(pid);
        assertGt(p.forVotes, p.againstVotes, "les petits porteurs l'emportent");
        _endVote();
        assertEq(uint8(governance.state(pid)), uint8(Governance.ProposalState.Succeeded));
    }

    function test_Quadratic_ModeFrozenAtCreation() public {
        uint256 id = _successfulCampaign();
        uint256 pid = _proposeRelease(id); // créée en mode linéaire
        vm.prank(admin);
        governance.setQuadraticVoting(true);
        vm.prank(alice);
        governance.castVote(pid, true);
        assertEq(
            governance.getProposal(pid).forVotes,
            6000 ether,
            "le changement ne s'applique pas en cours de vote"
        );
    }
}
