// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CFDToken} from "../../contracts/CFDToken.sol";
import {CampusFund} from "../../contracts/CampusFund.sol";
import {Governance} from "../../contracts/Governance.sol";
import {ICampusFund} from "../../contracts/interfaces/ICampusFund.sol";

/// @title Handler - "joueur" aléatoire des tests d'invariants
/// @notice Foundry appelle ses fonctions dans un ordre et avec des arguments aléatoires (des milliers de
///         séquences). Chaque fonction borne ses entrées et choisit une campagne ÉLIGIBLE (ex. une campagne
///         réussie pour un retrait) afin d'atteindre les chemins profonds : votes, tranches, gels, remboursements.
///         Après CHAQUE appel, Foundry vérifie les invariants. Les variables "ghost" enregistrent ce qui s'est
///         réellement passé pour le comparer à l'état des contrats.
contract Handler is Test {
    CFDToken public immutable token;
    CampusFund public immutable fund;
    Governance public immutable governance;

    uint256 internal constant MAX_CAMPAIGNS = 12;

    address[] public actors;
    address payable[] public beneficiaries;

    // --- ghosts
    /// @notice Nombre de propositions de déblocage EXÉCUTÉES (donc adoptées) par campagne.
    mapping(uint256 => uint256) public ghost_executedReleases;
    uint256 public ghost_feesSent;
    mapping(bytes32 => uint256) public calls;
    /// @notice Actions réellement abouties (pas seulement tentées) : prouve que les chemins profonds sont atteints.
    mapping(bytes32 => uint256) public done;

    constructor(CFDToken token_, CampusFund fund_, Governance governance_) {
        token = token_;
        fund = fund_;
        governance = governance_;
        for (uint256 i; i < 4; ++i) {
            address a = makeAddr(string(abi.encodePacked("actor", vm.toString(i))));
            actors.push(a);
            vm.deal(a, 10_000 ether);
            vm.prank(a);
            token.delegate(a);
            beneficiaries.push(payable(makeAddr(string(abi.encodePacked("benef", vm.toString(i))))));
        }
    }

    modifier countCall(bytes32 key) {
        calls[key]++;
        _;
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    /// @dev Première campagne (à partir de `seed`) ayant le statut voulu ; `found = false` sinon.
    function _find(uint256 seed, ICampusFund.Status status) internal view returns (uint256 id, bool found) {
        uint256 n = fund.campaignCount();
        for (uint256 k; k < n; ++k) {
            id = (seed + k) % n;
            if (fund.campaignStatus(id) == status) return (id, true);
        }
        return (0, false);
    }

    // ------------------------------------------------------------------ actions

    function createCampaign(uint256 actorSeed, uint256 goal, uint256 nSeed, uint256 duration)
        external
        countCall("create")
    {
        if (fund.campaignCount() >= MAX_CAMPAIGNS) return;
        goal = bound(goal, 0.5 ether, 5 ether);
        duration = bound(duration, 1 hours, 1 days);
        uint256 n = 2 + (nSeed % 4);
        uint16[] memory m = new uint16[](n);
        uint256 share = 10_000 / n;
        for (uint256 i; i < n; ++i) m[i] = uint16(share);
        m[n - 1] = uint16(10_000 - share * (n - 1));
        vm.prank(_actor(actorSeed));
        fund.createCampaign(goal, duration, beneficiaries[actorSeed % beneficiaries.length], "bafyDemoCID", m);
    }

    function contribute(uint256 actorSeed, uint256 campaignSeed, uint256 amount) external countCall("contribute") {
        (uint256 id, bool ok) = _find(campaignSeed, ICampusFund.Status.Active);
        if (!ok) return;
        amount = bound(amount, 0.01 ether, 3 ether);
        vm.prank(_actor(actorSeed));
        fund.contribute{value: amount}(id);
        done["contribute"]++;
    }

    function warp(uint256 secs) external countCall("warp") {
        _advance(bound(secs, 1 minutes, 6 hours));
    }

    /// @dev Avance le temps ET les blocs (1 bloc / 12 s, comme Ethereum) : les snapshots en dépendent.
    function _advance(uint256 secs) internal {
        vm.warp(block.timestamp + secs);
        vm.roll(block.number + 1 + secs / 12);
    }

    /// @dev Avance le temps jusqu'à l'échéance si besoin, puis clôture (sinon l'échéance est rarement atteinte).
    function finalize(uint256 campaignSeed) external countCall("finalize") {
        (uint256 id, bool ok) = _find(campaignSeed, ICampusFund.Status.Active);
        if (!ok) return;
        uint256 deadline = fund.getCampaign(id).deadline;
        if (block.timestamp < deadline) _advance(deadline - block.timestamp);
        fund.finalize(id);
        done[fund.campaignStatus(id) == ICampusFund.Status.Successful ? bytes32("success") : bytes32("failed")]++;
    }

    function proposeRelease(uint256 campaignSeed) external countCall("proposeRelease") {
        (uint256 id, bool ok) = _find(campaignSeed, ICampusFund.Status.Successful);
        if (!ok) return;
        (address creator,) = fund.campaignParties(id);
        vm.prank(creator);
        governance.proposeMilestoneRelease(id, "jalon");
        done["proposeRelease"]++;
    }

    function proposeFreeze(uint256 actorSeed, uint256 campaignSeed, bool targetActive)
        external
        countCall("proposeFreeze")
    {
        (uint256 id, bool ok) =
            _find(campaignSeed, targetActive ? ICampusFund.Status.Active : ICampusFund.Status.Successful);
        if (!ok) return;
        vm.prank(_actor(actorSeed));
        governance.proposeFreeze(id, "gel");
        done["proposeFreeze"]++;
    }

    /// @dev Vote sur une proposition encore ouverte, surtout "pour" (3 chances sur 4) pour que des
    ///      propositions passent réellement. Le vote "contre" et les votes sans poids restent possibles.
    function vote(uint256 actorSeed, uint256 proposalSeed, uint8 supportSeed) external countCall("vote") {
        uint256 n = governance.proposalCount();
        address voter = _actor(actorSeed);
        for (uint256 k; k < n; ++k) {
            uint256 pid = (proposalSeed + k) % n;
            if (governance.state(pid) != Governance.ProposalState.Active || governance.hasVoted(pid, voter)) continue;
            vm.prank(voter);
            governance.castVote(pid, supportSeed % 4 != 0);
            done["vote"]++;
            return;
        }
    }

    /// @dev Choisit une proposition non exécutée, attend la fin de son vote si besoin, puis l'exécute
    ///      si elle est adoptée. Une proposition rejetée n'est jamais exécutée.
    function execute(uint256 proposalSeed) external countCall("execute") {
        uint256 n = governance.proposalCount();
        for (uint256 k; k < n; ++k) {
            uint256 pid = (proposalSeed + k) % n;
            Governance.ProposalState s = governance.state(pid);
            if (s == Governance.ProposalState.Executed || s == Governance.ProposalState.Defeated) continue;
            Governance.Proposal memory p = governance.getProposal(pid);
            if (s == Governance.ProposalState.Active) _advance(p.voteEnd + 1 - block.timestamp);
            if (governance.state(pid) != Governance.ProposalState.Succeeded) return;
            // execute revert si la proposition est périmée (ex. jalon déjà approuvé, campagne gelée)
            governance.execute(pid);
            if (p.ptype == Governance.ProposalType.MilestoneRelease) ghost_executedReleases[p.campaignId]++;
            done[p.ptype == Governance.ProposalType.MilestoneRelease ? bytes32("execRelease") : bytes32("execFreeze")]++;
            return;
        }
    }

    function withdrawTranche(uint256 campaignSeed) external countCall("withdraw") {
        (uint256 id, bool ok) = _find(campaignSeed, ICampusFund.Status.Successful);
        if (!ok) return;
        (, address beneficiary) = fund.campaignParties(id);
        uint256 treasuryBefore = address(fund.treasury()).balance;
        vm.prank(beneficiary);
        fund.withdrawTranche(id);
        ghost_feesSent += address(fund.treasury()).balance - treasuryBefore;
        done["withdraw"]++;
    }

    function refund(uint256 actorSeed, uint256 campaignSeed, bool failed) external countCall("refund") {
        (uint256 id, bool ok) =
            _find(campaignSeed, failed ? ICampusFund.Status.Failed : ICampusFund.Status.Cancelled);
        if (!ok) return;
        vm.prank(_actor(actorSeed));
        fund.refund(id);
        done["refund"]++;
    }

    /// @notice Cas rare (1 appel sur 10) : campagne réussie abandonnée. Avance de 90 jours puis l'annule.
    function cancelStale(uint256 campaignSeed) external countCall("cancelStale") {
        if (campaignSeed % 10 != 0) return;
        (uint256 id, bool ok) = _find(campaignSeed / 10, ICampusFund.Status.Successful);
        if (!ok) return;
        _advance(fund.STALE_PERIOD());
        fund.cancelStale(id);
        done["cancelStale"]++;
    }

    /// @notice Transferts de CFD entre acteurs : ils perturbent les votes et peuvent rendre un
    ///         remboursement impossible (il faut rendre ses CFD) - les invariants doivent tenir quand même.
    function transferCFD(uint256 fromSeed, uint256 toSeed, uint256 amount) external countCall("transfer") {
        address from = _actor(fromSeed);
        amount = bound(amount, 0, token.balanceOf(from) / 4);
        vm.prank(from);
        token.transfer(_actor(toSeed), amount);
    }
}
