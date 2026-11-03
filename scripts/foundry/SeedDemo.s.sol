// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CFDToken} from "../../contracts/CFDToken.sol";
import {CampusFund} from "../../contracts/CampusFund.sol";
import {Governance} from "../../contracts/Governance.sol";

/// @title SeedDemo - remplit anvil avec des campagnes étudiantes réalistes pour la soutenance
/// @notice UNIQUEMENT sur anvil (chainId 31337) : utilise les clés de test publiques d'anvil.
///         Trois étapes séparées par un saut dans le temps (`cast rpc evm_increaseTime`), lancées par
///         scripts/demo-anvil.sh (ou .ps1) :
///           step1 : création de 5 campagnes, délégations, contributions (dont une campagne "frauduleuse")
///           step2 : (+2 h) clôture des campagnes échues, propositions de déblocage et votes, un remboursement
///           step3 : (+1 h) exécution des votes, retrait des tranches, propositions laissées ouvertes pour la démo
contract SeedDemo is Script {
    string internal constant MNEMONIC = "test test test test test test test test test test test junk";

    CFDToken internal token;
    CampusFund internal fund;
    Governance internal governance;

    // Rôles des comptes anvil : 0-2 propriétaires de la trésorerie, 3-4 porteurs, 5-8 contributeurs,
    // 9 source des comptes "sybil" (indices 10 à 17) et du porteur suspect (indice 30).
    uint256 internal constant ROBOTIQUE = 0;
    uint256 internal constant ASTRONOMIE = 1;
    uint256 internal constant HACKATHON = 2;
    uint256 internal constant THEATRE = 3;
    uint256 internal constant MATERIEL = 4;

    function _load() internal {
        require(block.chainid == 31337, "SeedDemo : anvil uniquement");
        string memory json = vm.readFile("./deployments/31337.json");
        token = CFDToken(vm.parseJsonAddress(json, ".CFDToken"));
        fund = CampusFund(payable(vm.parseJsonAddress(json, ".CampusFund")));
        governance = Governance(vm.parseJsonAddress(json, ".Governance"));
    }

    function _key(uint32 index) internal pure returns (uint256) {
        return vm.deriveKey(MNEMONIC, index);
    }

    function _addr(uint32 index) internal pure returns (address) {
        return vm.addr(_key(index));
    }

    function _cid(string memory slug) internal view returns (string memory) {
        string memory json = vm.readFile("./deployments/demo-cids.json");
        return vm.parseJsonString(json, string.concat(".", slug));
    }

    function _bps(uint16 a, uint16 b) internal pure returns (uint16[] memory m) {
        m = new uint16[](2);
        (m[0], m[1]) = (a, b);
    }

    function _create(uint32 creator, string memory slug, uint256 goal, uint256 duration, uint16[] memory m)
        internal
        returns (uint256 id)
    {
        vm.startBroadcast(_key(creator));
        id = fund.createCampaign(goal, duration, payable(_addr(creator)), _cid(slug), m);
        vm.stopBroadcast();
    }

    function _contribute(uint32 who, uint256 id, uint256 amount) internal {
        vm.startBroadcast(_key(who));
        fund.contribute{value: amount}(id);
        vm.stopBroadcast();
    }

    function _vote(uint32 who, uint256 pid, bool support) internal {
        vm.startBroadcast(_key(who));
        governance.castVote(pid, support);
        vm.stopBroadcast();
    }

    // =====================================================================================

    function step1() external {
        _load();
        require(fund.campaignCount() == 0, "deja initialise");

        // Les contributeurs activent leur pouvoir de vote (sinon leurs CFD ne comptent pas).
        for (uint32 i = 5; i <= 8; ++i) {
            vm.startBroadcast(_key(i));
            token.delegate(_addr(i));
            vm.stopBroadcast();
        }

        uint16[] memory m3 = new uint16[](3);
        (m3[0], m3[1], m3[2]) = (4000, 3000, 3000);
        uint16[] memory m4 = new uint16[](4);
        (m4[0], m4[1], m4[2], m4[3]) = (2500, 2500, 2500, 2500);

        _create(3, "robotique", 4 ether, 1 hours, m3);
        _create(4, "astronomie", 3 ether, 1 hours, _bps(5000, 5000));
        _create(3, "hackathon", 6 ether, 30 days, m4);
        _create(4, "theatre", 5 ether, 1 hours, _bps(6000, 4000));

        // Robotique : 4,5 ETH pour 4 ETH -> réussira
        _contribute(5, ROBOTIQUE, 1.5 ether);
        _contribute(6, ROBOTIQUE, 1.2 ether);
        _contribute(7, ROBOTIQUE, 1 ether);
        _contribute(8, ROBOTIQUE, 0.8 ether);
        // Astronomie : 3,2 ETH pour 3 ETH -> réussira
        _contribute(6, ASTRONOMIE, 1 ether);
        _contribute(5, ASTRONOMIE, 1 ether);
        _contribute(7, ASTRONOMIE, 1.2 ether);
        // Hackathon : en cours, 2,3 ETH sur 6 ETH (pour contribuer en direct pendant la démo)
        _contribute(5, HACKATHON, 0.8 ether);
        _contribute(8, HACKATHON, 1.5 ether);
        // Théâtre : 1 ETH sur 5 ETH -> échouera (démonstration du remboursement)
        _contribute(6, THEATRE, 0.6 ether);
        _contribute(7, THEATRE, 0.4 ether);

        // Campagne suspecte : un compte (9) finance un porteur neuf et 8 adresses neuves, qui contribuent
        // toutes exactement 0,5 ETH, l'une après l'autre. Signaux : adresses liées, montants répétés, pic.
        vm.startBroadcast(_key(9));
        payable(_addr(30)).transfer(0.1 ether);
        for (uint32 i = 10; i < 18; ++i) {
            payable(_addr(i)).transfer(0.52 ether);
        }
        vm.stopBroadcast();
        _create(30, "materiel", 4 ether, 30 days, _bps(5000, 5000));
        for (uint32 i = 10; i < 18; ++i) {
            _contribute(i, MATERIEL, 0.5 ether);
        }
        console.log("step1 : 5 campagnes creees, campaignCount =", fund.campaignCount());
    }

    function step2() external {
        _load();
        fund.campaignCount(); // vérifie que le déploiement est lisible

        vm.startBroadcast(_key(5));
        fund.finalize(ROBOTIQUE);
        fund.finalize(ASTRONOMIE);
        fund.finalize(THEATRE);
        vm.stopBroadcast();

        // Astronomie : demande de déblocage du jalon 1, votes favorables
        vm.startBroadcast(_key(4));
        uint256 p0 = governance.proposeMilestoneRelease(ASTRONOMIE, "Telescope commande : facture du fournisseur");
        vm.stopBroadcast();
        // Robotique : demande de déblocage du jalon 1, un vote contre
        vm.startBroadcast(_key(3));
        uint256 p1 = governance.proposeMilestoneRelease(ROBOTIQUE, "Composants achetes : factures en ligne");
        vm.stopBroadcast();

        _vote(5, p0, true);
        _vote(6, p0, true);
        _vote(7, p0, true);
        _vote(5, p1, true);
        _vote(6, p1, true);
        _vote(8, p1, false);

        // Théâtre a échoué : un contributeur récupère ses fonds (l'autre le fera en direct)
        vm.startBroadcast(_key(7));
        fund.refund(THEATRE);
        vm.stopBroadcast();
        console.log("step2 : propositions", p0, p1);
    }

    function step3() external {
        _load();
        // l'exécution est publique : n'importe qui peut la déclencher, ici le compte 5
        vm.startBroadcast(_key(5));
        governance.execute(0); // astronomie jalon 1
        governance.execute(1); // robotique jalon 1
        vm.stopBroadcast();

        vm.startBroadcast(_key(4));
        fund.withdrawTranche(ASTRONOMIE);
        vm.stopBroadcast();
        vm.startBroadcast(_key(3));
        fund.withdrawTranche(ROBOTIQUE);
        // Propositions laissées OUVERTES pour la démo en direct
        governance.proposeMilestoneRelease(ROBOTIQUE, "Prototype termine : video de l'homologation");
        vm.stopBroadcast();

        vm.startBroadcast(_key(5));
        uint256 freeze = governance.proposeFreeze(MATERIEL, "Adresses toutes financees par le meme compte");
        governance.castVote(freeze, true);
        vm.stopBroadcast();
        console.log("step3 : propositions ouvertes 2 et", freeze);
    }
}
