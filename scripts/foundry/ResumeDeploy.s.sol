// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CFDToken} from "../../contracts/CFDToken.sol";
import {CampusFund} from "../../contracts/CampusFund.sol";
import {Governance} from "../../contracts/Governance.sol";

/// @title ResumeDeploy - termine un déploiement interrompu après Treasury, CFDToken et CampusFund
/// @notice À utiliser quand Deploy.s.sol s'est arrêté en cours de route (ex. solde insuffisant) :
///         relit les trois adresses dans deployments/<chainId>.json, déploie Governance, câble les rôles
///         et fait renoncer le déployeur, exactement comme Deploy.s.sol.
///   forge script scripts/foundry/ResumeDeploy.s.sol --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast
contract ResumeDeploy is Script {
    uint256 internal constant PROPOSAL_THRESHOLD = 100 ether; // identique à Deploy.s.sol

    function run() external {
        string memory path = string.concat("./deployments/", vm.toString(block.chainid), ".json");
        string memory json = vm.readFile(path);
        CFDToken token = CFDToken(vm.parseJsonAddress(json, ".CFDToken"));
        CampusFund fund = CampusFund(payable(vm.parseJsonAddress(json, ".CampusFund")));
        address treasury = vm.parseJsonAddress(json, ".Treasury");
        uint256 deployBlock = vm.parseJsonUint(json, ".deployBlock");
        uint256 votingPeriod = vm.envOr("VOTING_PERIOD", uint256(1 hours));
        require(
            address(token).code.length > 0 && address(fund).code.length > 0, "CFDToken ou CampusFund absent"
        );
        require(treasury.code.length > 0, "Treasury absent");

        vm.startBroadcast();
        (, address deployer,) = vm.readCallers();
        require(
            token.hasRole(token.DEFAULT_ADMIN_ROLE(), deployer), "le deployeur n'administre plus le jeton"
        );

        Governance governance = new Governance(deployer, token, fund, votingPeriod, PROPOSAL_THRESHOLD);
        token.grantRole(token.MINTER_ROLE(), address(fund));
        token.grantRole(token.BURNER_ROLE(), address(fund));
        fund.grantRole(fund.GOVERNANCE_ROLE(), address(governance));
        token.renounceRole(token.DEFAULT_ADMIN_ROLE(), deployer);
        fund.renounceRole(fund.DEFAULT_ADMIN_ROLE(), deployer);
        governance.renounceRole(governance.PARAMS_ROLE(), deployer);
        governance.renounceRole(governance.DEFAULT_ADMIN_ROLE(), deployer);
        vm.stopBroadcast();

        string memory key = "deployment";
        vm.serializeUint(key, "chainId", block.chainid);
        vm.serializeUint(key, "deployBlock", deployBlock);
        vm.serializeUint(key, "votingPeriod", votingPeriod);
        vm.serializeAddress(key, "CFDToken", address(token));
        vm.serializeAddress(key, "CampusFund", address(fund));
        vm.serializeAddress(key, "Governance", address(governance));
        vm.writeJson(vm.serializeAddress(key, "Treasury", treasury), path);
        console.log("Governance ", address(governance));
    }
}
