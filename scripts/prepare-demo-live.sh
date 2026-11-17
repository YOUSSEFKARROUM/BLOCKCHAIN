#!/usr/bin/env bash
# Prépare la démo en direct sur Sepolia : amène une campagne jusqu'à « vote de déblocage adopté »,
# pour que « Exécuter le déblocage » puis « Retirer la tranche » soient possibles pendant la soutenance.
#
# Usage : bash scripts/prepare-demo-live.sh <id campagne> [<id campagne> ...]
# À relancer autant de fois que nécessaire : chaque étape n'est faite que si elle manque.
#   1. collecte terminée            -> clôture (finalize)
#   2. campagne réussie, sans vote  -> demande de déblocage (compte porteur DEMO_CREATOR_KEY)
#   3. vote ouvert                  -> vote « pour » (compte contributeur PRIVATE_KEY)
#   4. une heure plus tard          -> la proposition est adoptée, il reste à l'exécuter en direct.
# Les clés sont lues dans .env (jamais affichées).
set -euo pipefail
cd "$(dirname "$0")/.."
set -a && . ./.env && set +a

RPC="$SEPOLIA_RPC_URL"
FUND=0x9ED175d941378C899576CE5B71103E6185B4a6Ee
GOV=0xd61923C47c8f0059370d8C96404C325163DEa802
PROOF="https://github.com/YOUSSEFKARROUM/BLOCKCHAIN"
VOTER=$(cast wallet address "$PRIVATE_KEY")

call() { cast call "$@" --rpc-url "$RPC"; }
send() { cast send "$@" --rpc-url "$RPC" | grep -E "^status" || true; }
first() { awk '{print $1}'; }

# Affiche l'id de la proposition de déblocage non exécutée de la campagne, s'il y en a une.
open_proposal() {
  local campaign=$1 count id fields
  count=$(call "$GOV" "proposalCount()(uint256)" | first)
  for ((id = count - 1; id >= 0; id--)); do
    fields=$(call "$GOV" "getProposal(uint256)((uint8,uint8,bool,bool,address,uint64,uint64,uint256,uint256,uint256,uint256,uint256,string,string))" "$id" | tr -d '()' | tr ',' '\n')
    if [ "$(echo "$fields" | sed -n 1p | first)" = "0" ] && [ "$(echo "$fields" | sed -n 8p | first)" = "$campaign" ] && [ "$(echo "$fields" | sed -n 4p | first)" = "false" ]; then
      echo "$id"
      return
    fi
  done
}

for campaign in "$@"; do
  status=$(call "$FUND" "campaignStatus(uint256)(uint8)" "$campaign" | first)
  if [ "$status" = "0" ]; then
    echo "Campagne $campaign : clôture de la collecte"
    send "$FUND" "finalize(uint256)" "$campaign" --private-key "$PRIVATE_KEY"
    status=$(call "$FUND" "campaignStatus(uint256)(uint8)" "$campaign" | first)
  fi
  if [ "$status" != "1" ]; then
    echo "Campagne $campaign : pas réussie (statut $status), rien à faire"
    continue
  fi

  proposal=$(open_proposal "$campaign")
  if [ -z "$proposal" ]; then
    echo "Campagne $campaign : demande de déblocage"
    send "$GOV" "proposeMilestoneRelease(uint256,string,string)" "$campaign" "Jalon atteint : preuve publiée" "$PROOF" --private-key "$DEMO_CREATOR_KEY"
    sleep 15
    proposal=$(open_proposal "$campaign")
  fi

  state=$(call "$GOV" "state(uint256)(uint8)" "$proposal" | first)
  voted=$(call "$GOV" "hasVoted(uint256,address)(bool)" "$proposal" "$VOTER")
  if [ "$state" = "0" ] && [ "$voted" = "false" ]; then
    echo "Campagne $campaign : vote pour la proposition $proposal"
    send "$GOV" "castVote(uint256,bool)" "$proposal" true --private-key "$PRIVATE_KEY"
    sleep 15
    state=$(call "$GOV" "state(uint256)(uint8)" "$proposal" | first)
  fi
  case "$state" in
    0) echo "Campagne $campaign : proposition $proposal en vote (adoptée dans moins d'une heure)" ;;
    1) echo "Campagne $campaign : proposition $proposal REJETÉE" ;;
    2) echo "Campagne $campaign : proposition $proposal ADOPTÉE, prête à être exécutée en direct" ;;
    3) echo "Campagne $campaign : proposition $proposal déjà exécutée" ;;
  esac
done
