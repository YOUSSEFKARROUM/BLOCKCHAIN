// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CFDToken} from "../../contracts/CFDToken.sol";
import {CampusFund} from "../../contracts/CampusFund.sol";
import {Governance} from "../../contracts/Governance.sol";

/// @title SeedSepolia - campagnes de démonstration sur Sepolia, avec de très petits montants
/// @notice Deux comptes : un PORTEUR de démonstration (DEMO_CREATOR_KEY) et le déployeur (PRIVATE_KEY), qui
///         joue le contributeur. Ils doivent être distincts : le porteur ne vote pas le déblocage de ses fonds.
///   step1 : le déployeur finance le porteur, le porteur crée 4 campagnes, le déployeur y contribue.
///   step2 (après 1 h) : clôture des campagnes échues, demande de déblocage du jalon 1 avec preuve, vote pour.
///   step3 (encore 1 h après) : exécution du vote.
///   forge script scripts/foundry/SeedSepolia.s.sol --sig "step1()" --rpc-url $SEPOLIA_RPC_URL --broadcast
contract SeedSepolia is Script {
    uint256 internal constant ROBOTIQUE = 0;
    uint256 internal constant ASTRONOMIE = 1;
    uint256 internal constant HACKATHON = 2;
    uint256 internal constant THEATRE = 3;
    uint256 internal constant CREATOR_GAS = 0.0005 ether;

    CFDToken internal token;
    CampusFund internal fund;
    Governance internal governance;
    uint256 internal creatorKey;
    uint256 internal contributorKey;

    function _load() internal {
        require(block.chainid == 11155111, "SeedSepolia : Sepolia uniquement");
        string memory json = vm.readFile("./deployments/11155111.json");
        token = CFDToken(vm.parseJsonAddress(json, ".CFDToken"));
        fund = CampusFund(payable(vm.parseJsonAddress(json, ".CampusFund")));
        governance = Governance(vm.parseJsonAddress(json, ".Governance"));
        creatorKey = vm.envUint("DEMO_CREATOR_KEY");
        contributorKey = vm.envUint("PRIVATE_KEY");
        require(vm.addr(creatorKey) != vm.addr(contributorKey), "porteur et contributeur doivent differer");
    }

    function _cid(string memory slug) internal view returns (string memory) {
        return vm.parseJsonString(vm.readFile("./deployments/demo-cids.json"), string.concat(".", slug));
    }

    function step1() external {
        _load();
        require(fund.campaignCount() == 0, "deja initialise");
        address creator = vm.addr(creatorKey);
        address contributor = vm.addr(contributorKey);

        vm.startBroadcast(contributorKey);
        payable(creator).transfer(CREATOR_GAS);
        token.delegate(contributor);
        vm.stopBroadcast();

        uint16[] memory m3 = new uint16[](3);
        (m3[0], m3[1], m3[2]) = (4000, 3000, 3000);
        uint16[] memory m2 = new uint16[](2);
        (m2[0], m2[1]) = (5000, 5000);
        uint16[] memory m4 = new uint16[](4);
        (m4[0], m4[1], m4[2], m4[3]) = (2500, 2500, 2500, 2500);

        vm.startBroadcast(creatorKey);
        fund.createCampaign(0.002 ether, 1 hours, payable(creator), _cid("robotique"), m3);
        fund.createCampaign(0.005 ether, 30 days, payable(creator), _cid("astronomie"), m2);
        fund.createCampaign(0.01 ether, 30 days, payable(creator), _cid("hackathon"), m4);
        fund.createCampaign(0.005 ether, 1 hours, payable(creator), _cid("theatre"), m2);
        vm.stopBroadcast();

        vm.startBroadcast(contributorKey);
        fund.contribute{value: 0.002 ether}(ROBOTIQUE); // objectif atteint : réussira
        fund.contribute{value: 0.002 ether}(ASTRONOMIE); // collecte en cours
        fund.contribute{value: 0.001 ether}(HACKATHON); // collecte en cours
        fund.contribute{value: 0.0005 ether}(THEATRE); // objectif manqué : remboursement
        vm.stopBroadcast();
        console.log("step1 : campagnes creees", fund.campaignCount());
    }

    function step2() external {
        _load();
        vm.startBroadcast(contributorKey);
        fund.finalize(ROBOTIQUE);
        fund.finalize(THEATRE);
        vm.stopBroadcast();

        vm.startBroadcast(creatorKey);
        uint256 pid = governance.proposeMilestoneRelease(
            ROBOTIQUE, unicode"Composants achetés : factures en ligne", "demo://factures-composants.pdf"
        );
        vm.stopBroadcast();

        vm.startBroadcast(contributorKey);
        governance.castVote(pid, true);
        vm.stopBroadcast();
        console.log("step2 : proposition", pid);
    }

    function step3() external {
        _load();
        vm.startBroadcast(contributorKey);
        governance.execute(0);
        vm.stopBroadcast();
        console.log("step3 : jalon 1 approuve");
    }
}
