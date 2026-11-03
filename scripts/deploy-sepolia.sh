#!/usr/bin/env bash
# Déploiement sur Sepolia + vérification du code source sur Etherscan.
# Prérequis : fichier .env rempli (voir .env.example) et ~0,05 SepoliaETH sur le compte de PRIVATE_KEY.
#   bash scripts/deploy-sepolia.sh
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || { echo "Fichier .env absent : cp .env.example .env puis remplissez-le."; exit 1; }
set -a; source .env; set +a
for v in SEPOLIA_RPC_URL PRIVATE_KEY ETHERSCAN_API_KEY TREASURY_OWNER_1 TREASURY_OWNER_2 TREASURY_OWNER_3; do
  [ -n "${!v:-}" ] || { echo "Variable $v manquante dans .env"; exit 1; }
done

[ "$(cast chain-id --rpc-url "$SEPOLIA_RPC_URL")" = "11155111" ] || { echo "SEPOLIA_RPC_URL ne pointe pas vers Sepolia"; exit 1; }
echo "Déployeur : $(cast wallet address --private-key "$PRIVATE_KEY")"
echo "Solde     : $(cast balance "$(cast wallet address --private-key "$PRIVATE_KEY")" --rpc-url "$SEPOLIA_RPC_URL" --ether) ETH"

forge script scripts/foundry/Deploy.s.sol \
  --rpc-url "$SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY" \
  --broadcast --verify --etherscan-api-key "$ETHERSCAN_API_KEY" --slow

node frontend/scripts/sync-contracts.mjs
echo
echo "Adresses : deployments/11155111.json (à committer). Transactions : broadcast/Deploy.s.sol/11155111/run-latest.json"
echo "Front : dans frontend/.env.local mettez NEXT_PUBLIC_CHAIN_ID=11155111 et NEXT_PUBLIC_RPC_URL=<RPC Sepolia public>"
