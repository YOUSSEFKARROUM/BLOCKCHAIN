// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CFDToken} from "../../contracts/CFDToken.sol";
import {CampusFund} from "../../contracts/CampusFund.sol";
import {Governance} from "../../contracts/Governance.sol";
import {Treasury} from "../../contracts/Treasury.sol";

/// @title Deploy - déploie et câble toute la plateforme CampusFund
/// @notice Ordre : Treasury -> CFDToken -> CampusFund -> Governance, puis attribution des rôles et
///         RENONCEMENT du déployeur aux rôles d'administration critiques (voir plus bas).
///         Écrit les adresses dans deployments/<chainId>.json (lu par le front-end et le script IA).
///
/// Local  : forge script scripts/foundry/Deploy.s.sol --rpc-url anvil --broadcast --private-key <clé anvil n°0>
/// Sepolia: forge script scripts/foundry/Deploy.s.sol --rpc-url sepolia --broadcast --verify --private-key $PRIVATE_KEY
contract Deploy is Script {
    /// @dev Les 3 premiers comptes anvil (adresses publiques de test, connues de tous).
    address internal constant ANVIL_0 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address internal constant ANVIL_1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address internal constant ANVIL_2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

    uint256 internal constant PROPOSAL_THRESHOLD = 100 ether; // 100 CFD = 0,1 ETH contribué

    struct Deployment {
        address deployer;
        CFDToken token;
        CampusFund fund;
        Governance governance;
        Treasury treasury;
    }

    function run() external returns (Deployment memory d) {
        // Sur anvil, les 3 premiers comptes de test. Ailleurs (Sepolia), les propriétaires DOIVENT être
        // fournis : les clés des comptes anvil sont publiques, n'importe qui viderait la trésorerie.
        bool local = block.chainid == 31337;
        address[3] memory owners = local
            ? [
                vm.envOr("TREASURY_OWNER_1", ANVIL_0),
                vm.envOr("TREASURY_OWNER_2", ANVIL_1),
                vm.envOr("TREASURY_OWNER_3", ANVIL_2)
            ]
            : [vm.envAddress("TREASURY_OWNER_1"), vm.envAddress("TREASURY_OWNER_2"), vm.envAddress("TREASURY_OWNER_3")];
        uint256 votingPeriod = vm.envOr("VOTING_PERIOD", uint256(1 hours));

        vm.startBroadcast();
        (, address deployer,) = vm.readCallers();

        Treasury treasury = new Treasury(owners);
        CFDToken token = new CFDToken(deployer);
        CampusFund fund = new CampusFund(deployer, token, payable(address(treasury)));
        Governance governance = new Governance(deployer, token, fund, votingPeriod, PROPOSAL_THRESHOLD);

        // --- Câblage des rôles
        token.grantRole(token.MINTER_ROLE(), address(fund));
        token.grantRole(token.BURNER_ROLE(), address(fund));
        fund.grantRole(fund.GOVERNANCE_ROLE(), address(governance));

        // --- Décentralisation : le déployeur abandonne les clés d'administration.
        // Sans cela il pourrait s'accorder MINTER_ROLE (frapper des CFD et contrôler la DAO) ou
        // GOVERNANCE_ROLE (débloquer des jalons sans vote). Après ces deux lignes, les rôles sont figés.
        // Les paramètres de vote (durée, seuil, mode quadratique) sont figés au déploiement : il abandonne
        // aussi PARAMS_ROLE et l'administration de la gouvernance.
        // Il ne conserve que PAUSER_ROLE : un coupe-circuit qui peut retarder (pause) mais jamais prendre
        // des fonds, aucune fonction ne le permet.
        token.renounceRole(token.DEFAULT_ADMIN_ROLE(), deployer);
        fund.renounceRole(fund.DEFAULT_ADMIN_ROLE(), deployer);
        governance.renounceRole(governance.PARAMS_ROLE(), deployer);
        governance.renounceRole(governance.DEFAULT_ADMIN_ROLE(), deployer);

        vm.stopBroadcast();

        _writeDeployment(address(token), address(fund), address(governance), address(treasury), votingPeriod);
        d = Deployment(deployer, token, fund, governance, treasury);
    }

    function _writeDeployment(address token, address fund, address governance, address treasury, uint256 votingPeriod)
        internal
    {
        string memory key = "deployment";
        vm.serializeUint(key, "chainId", block.chainid);
        vm.serializeUint(key, "deployBlock", block.number);
        vm.serializeUint(key, "votingPeriod", votingPeriod);
        vm.serializeAddress(key, "CFDToken", token);
        vm.serializeAddress(key, "CampusFund", fund);
        vm.serializeAddress(key, "Governance", governance);
        string memory json = vm.serializeAddress(key, "Treasury", treasury);
        // DEPLOYMENT_PATH permet aux tests d'écrire ailleurs (sinon ils écraseraient le vrai fichier anvil).
        string memory path =
            vm.envOr("DEPLOYMENT_PATH", string.concat("./deployments/", vm.toString(block.chainid), ".json"));
        vm.writeJson(json, path);

        console.log("CFDToken   ", token);
        console.log("CampusFund ", fund);
        console.log("Governance ", governance);
        console.log("Treasury   ", treasury);
        console.log("Adresses ecrites dans", path);
    }
}
