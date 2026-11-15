# Déploie CampusFund sur anvil et crée les données de démonstration (Windows PowerShell).
# Prérequis : `anvil` lancé dans un autre terminal (http://127.0.0.1:8545).
#   powershell -ExecutionPolicy Bypass -File scripts\demo-anvil.ps1
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$RPC = "http://127.0.0.1:8545"
# Clé n°0 d'anvil : PUBLIQUE, connue de tous, sans valeur. Ne jamais l'utiliser hors d'anvil.
$ANVIL_KEY_0 = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

function Invoke-Step([string]$label, [scriptblock]$block) {
    Write-Host "== $label"
    & $block
    if ($LASTEXITCODE -ne 0) { throw "Échec : $label" }
}

cast chain-id --rpc-url $RPC | Out-Null
if ($LASTEXITCODE -ne 0) { throw "anvil n'est pas lancé sur $RPC" }

Invoke-Step "1/6 Métadonnées IPFS de démo" { node scripts/ipfs/build-demo-metadata.mjs }
Invoke-Step "2/6 Déploiement" { forge script scripts/foundry/Deploy.s.sol --rpc-url $RPC --broadcast --private-key $ANVIL_KEY_0 }
Invoke-Step "3/6 Campagnes, délégations, contributions" { forge script scripts/foundry/SeedDemo.s.sol --sig "step1()" --rpc-url $RPC --broadcast --slow }
Invoke-Step "4/6 +2 h : clôtures, propositions, votes" {
    cast rpc evm_increaseTime 7200 --rpc-url $RPC | Out-Null; cast rpc evm_mine --rpc-url $RPC | Out-Null
    forge script scripts/foundry/SeedDemo.s.sol --sig "step2()" --rpc-url $RPC --broadcast --slow
}
Invoke-Step "5/6 +1 h : exécution des votes, retraits, propositions ouvertes" {
    cast rpc evm_increaseTime 3700 --rpc-url $RPC | Out-Null; cast rpc evm_mine --rpc-url $RPC | Out-Null
    forge script scripts/foundry/SeedDemo.s.sol --sig "step3()" --rpc-url $RPC --broadcast --slow
}
Invoke-Step "6/6 Synchronisation du front-end et score de risque IA" {
    node frontend/scripts/sync-contracts.mjs
    python scripts/anomaly_detection.py --rpc $RPC --deployment deployments/31337.json
}
Write-Host "Terminé. Lancez le front : cd frontend ; npm run dev"
