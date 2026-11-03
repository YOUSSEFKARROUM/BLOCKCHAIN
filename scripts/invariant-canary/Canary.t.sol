// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {InvariantsTest} from "./Invariants.t.sol";

/// @title Canaris d'atteignabilité (à NE PAS laisser dans /test)
/// @notice Chaque "canari" affirme qu'une action profonde n'arrive JAMAIS. S'il ÉCHOUE, c'est la preuve
///         que le fuzzer a bien atteint ce chemin, et donc que les vrais invariants y ont été vérifiés.
///         Reproduire :
///           cp scripts/invariant-canary/Canary.t.sol test/invariant/Canary.t.sol
///           forge test --match-contract CanaryTest      # les 6 canaris doivent être FAIL
///           rm test/invariant/Canary.t.sol
contract CanaryTest is InvariantsTest {
    function invariant_canary_withdraw() public view {
        assertEq(handler.done("withdraw"), 0);
    }

    function invariant_canary_execRelease() public view {
        assertEq(handler.done("execRelease"), 0);
    }

    function invariant_canary_execFreeze() public view {
        assertEq(handler.done("execFreeze"), 0);
    }

    function invariant_canary_refund() public view {
        assertEq(handler.done("refund"), 0);
    }

    function invariant_canary_vote() public view {
        assertEq(handler.done("vote"), 0);
    }

    function invariant_canary_cancelStale() public view {
        assertEq(handler.done("cancelStale"), 0);
    }
}
