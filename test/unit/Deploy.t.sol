// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../../scripts/foundry/Deploy.s.sol";

/// @notice Exécute le VRAI script de déploiement et vérifie le câblage et la décentralisation des rôles.
contract DeployTest is Test {
    function test_DeployWiresRolesAndRenouncesAdmin() public {
        vm.setEnv("DEPLOYMENT_PATH", "./deployments/test-deploy.json");
        Deploy.Deployment memory d = new Deploy().run();

        // câblage
        assertTrue(d.token.hasRole(d.token.MINTER_ROLE(), address(d.fund)));
        assertTrue(d.token.hasRole(d.token.BURNER_ROLE(), address(d.fund)));
        assertTrue(d.fund.hasRole(d.fund.GOVERNANCE_ROLE(), address(d.governance)));
        assertEq(address(d.fund.treasury()), address(d.treasury));
        assertEq(address(d.governance.fund()), address(d.fund));
        assertEq(d.governance.votingPeriod(), 1 hours);

        // décentralisation : plus personne ne peut attribuer MINTER ni GOVERNANCE
        assertFalse(d.token.hasRole(d.token.DEFAULT_ADMIN_ROLE(), d.deployer), "admin du jeton abandonne");
        assertFalse(d.fund.hasRole(d.fund.DEFAULT_ADMIN_ROLE(), d.deployer), "admin du fonds abandonne");
        assertFalse(d.token.hasRole(d.token.MINTER_ROLE(), d.deployer));
        assertFalse(d.fund.hasRole(d.fund.GOVERNANCE_ROLE(), d.deployer));
        // le circuit breaker et les paramètres de vote restent disponibles
        assertTrue(d.fund.hasRole(d.fund.PAUSER_ROLE(), d.deployer));
        assertTrue(d.governance.hasRole(d.governance.PARAMS_ROLE(), d.deployer));

        // le fichier de déploiement est cohérent
        string memory json = vm.readFile("./deployments/test-deploy.json");
        assertEq(vm.parseJsonAddress(json, ".CampusFund"), address(d.fund));
        assertEq(vm.parseJsonAddress(json, ".Treasury"), address(d.treasury));
    }
}
