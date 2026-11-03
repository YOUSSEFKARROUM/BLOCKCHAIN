// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CFDToken} from "../../contracts/CFDToken.sol";
import {CampusFund} from "../../contracts/CampusFund.sol";
import {Governance} from "../../contracts/Governance.sol";
import {Treasury} from "../../contracts/Treasury.sol";
import {Handler} from "./Handler.sol";

/// @title Tests d'invariants de CampusFund
/// @notice Un invariant est une propriété qui doit rester vraie APRÈS N'IMPORTE QUELLE suite d'actions.
///         Foundry exécute des centaines de séquences aléatoires d'appels au Handler et vérifie
///         chaque fonction `invariant_*` après chaque appel.
contract InvariantsTest is Test {
    CFDToken internal token;
    CampusFund internal fund;
    Governance internal governance;
    Treasury internal treasury;
    Handler internal handler;

    function setUp() public {
        address admin = makeAddr("admin");
        treasury = new Treasury([makeAddr("o1"), makeAddr("o2"), makeAddr("o3")]);
        token = new CFDToken(admin);
        fund = new CampusFund(admin, token, payable(address(treasury)));
        governance = new Governance(admin, token, fund, 1 hours, 100 ether);
        vm.startPrank(admin);
        token.grantRole(token.MINTER_ROLE(), address(fund));
        token.grantRole(token.BURNER_ROLE(), address(fund));
        fund.grantRole(fund.GOVERNANCE_ROLE(), address(governance));
        vm.stopPrank();

        handler = new Handler(token, fund, governance);
        targetContract(address(handler));
    }

    /// @notice INVARIANT 1 - Solvabilité : le contrat détient toujours au moins ce qu'il doit.
    function invariant_SolventBalance() public view {
        assertGe(address(fund).balance, fund.totalOwed());
    }

    /// @notice INVARIANT 1 bis - La dette globale est exactement la somme des dettes par campagne.
    function invariant_OwedMatchesCampaigns() public view {
        uint256 sum;
        for (uint256 i; i < fund.campaignCount(); ++i) {
            CampusFund.Campaign memory c = fund.getCampaign(i);
            sum += c.raised - c.released - c.refunded;
        }
        assertEq(fund.totalOwed(), sum);
        // Aucun ETH n'entre ni ne sort autrement que par contribute / withdrawTranche / refund
        assertEq(address(fund).balance, sum);
    }

    /// @notice INVARIANT 2 - CFD en circulation = (total contribué - contributions remboursées) x 1000.
    function invariant_SupplyMatchesContributions() public view {
        assertEq(token.totalSupply(), (fund.totalContributed() - fund.totalRefundedPrincipal()) * token.RATE());
    }

    /// @notice INVARIANT 3 - Aucune tranche sans vote : pour chaque campagne,
    ///         tranches retirées <= jalons approuvés == propositions de déblocage exécutées (donc adoptées).
    function invariant_NoTrancheWithoutVote() public view {
        for (uint256 i; i < fund.campaignCount(); ++i) {
            (uint8 count, uint8 approved, uint8 withdrawn) = fund.milestoneProgress(i);
            assertLe(withdrawn, approved, "tranche retiree sans jalon approuve");
            assertLe(approved, count);
            assertEq(approved, handler.ghost_executedReleases(i), "jalon approuve sans vote execute");
        }
    }

    /// @notice INVARIANT 4 - La trésorerie a reçu exactement 2 % (arrondi inférieur) de chaque tranche.
    function invariant_TreasuryGetsOnlyFees() public view {
        assertEq(address(treasury).balance, handler.ghost_feesSent());
        uint256 released;
        for (uint256 i; i < fund.campaignCount(); ++i) {
            released += fund.getCampaign(i).released;
        }
        assertLe(address(treasury).balance, (released * 200) / 10_000);
    }

    /// @notice Affiche les actions RÉELLEMENT abouties pendant la séquence (preuve que le fuzzer atteint
    ///         les chemins profonds et que les invariants ne passent pas "à vide").
    function afterInvariant() external view {
        console.log("campagnes", fund.campaignCount(), "contributions", handler.done("contribute"));
        console.log("reussies", handler.done("success"), "echouees", handler.done("failed"));
        console.log("votes", handler.done("vote"), "deblocages executes", handler.done("execRelease"));
        console.log("tranches retirees", handler.done("withdraw"), "gels executes", handler.done("execFreeze"));
        console.log("remboursements", handler.done("refund"), "cancelStale", handler.done("cancelStale"));
    }
}
