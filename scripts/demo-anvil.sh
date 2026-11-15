#!/usr/bin/env bash
# Déploie CampusFund sur anvil et crée les données de démonstration.
# Prérequis : `anvil` lancé dans un autre terminal (http://127.0.0.1:8545).
#   bash scripts/demo-anvil.sh
set -euo pipefail
cd "$(dirname "$0")/.."

RPC=http://127.0.0.1:8545
# Clé n°0 d'anvil : PUBLIQUE, connue de tous, sans valeur. Ne jamais l'utiliser hors d'anvil.
ANVIL_KEY_0=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

cast chain-id --rpc-url "$RPC" >/dev/null || { echo "anvil n'est pas lancé sur $RPC"; exit 1; }

echo "== 1/6 Métadonnées IPFS de démo"
node scripts/ipfs/build-demo-metadata.mjs

echo "== 2/6 Déploiement"
forge script scripts/foundry/Deploy.s.sol --rpc-url "$RPC" --broadcast --private-key "$ANVIL_KEY_0"

echo "== 3/6 Campagnes, délégations, contributions"
forge script scripts/foundry/SeedDemo.s.sol --sig "step1()" --rpc-url "$RPC" --broadcast --slow

echo "== 4/6 +2 h : clôtures, propositions, votes"
cast rpc evm_increaseTime 7200 --rpc-url "$RPC" >/dev/null && cast rpc evm_mine --rpc-url "$RPC" >/dev/null
forge script scripts/foundry/SeedDemo.s.sol --sig "step2()" --rpc-url "$RPC" --broadcast --slow

echo "== 5/6 +1 h : exécution des votes, retraits, propositions ouvertes"
cast rpc evm_increaseTime 3700 --rpc-url "$RPC" >/dev/null && cast rpc evm_mine --rpc-url "$RPC" >/dev/null
forge script scripts/foundry/SeedDemo.s.sol --sig "step3()" --rpc-url "$RPC" --broadcast --slow

echo "== 6/6 Synchronisation du front-end (adresses + ABI) et score de risque IA"
node frontend/scripts/sync-contracts.mjs
python scripts/anomaly_detection.py --rpc "$RPC" --deployment deployments/31337.json

echo "Terminé. Lancez le front : cd frontend && npm run dev"
