# Déploiement sur Sepolia + vérification Etherscan (Windows PowerShell).
# Prérequis : .env rempli (voir .env.example) et ~0,05 SepoliaETH sur le compte de PRIVATE_KEY.
#   powershell -ExecutionPolicy Bypass -File scripts\deploy-sepolia.ps1
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path .env)) { throw "Fichier .env absent : copiez .env.example en .env puis remplissez-le." }
Get-Content .env | Where-Object { $_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$' } | ForEach-Object {
    $name, $value = $Matches[1], $Matches[2]
    if ($value) { Set-Item -Path "Env:$name" -Value $value }
}
foreach ($v in "SEPOLIA_RPC_URL", "PRIVATE_KEY", "ETHERSCAN_API_KEY", "TREASURY_OWNER_1", "TREASURY_OWNER_2", "TREASURY_OWNER_3") {
    if (-not (Get-Item -Path "Env:$v" -ErrorAction SilentlyContinue)) { throw "Variable $v manquante dans .env" }
}

$chain = cast chain-id --rpc-url $env:SEPOLIA_RPC_URL
if ($chain -ne "11155111") { throw "SEPOLIA_RPC_URL ne pointe pas vers Sepolia (chainId $chain)" }
$deployer = cast wallet address --private-key $env:PRIVATE_KEY
Write-Host "Déployeur : $deployer"
Write-Host "Solde     : $(cast balance $deployer --rpc-url $env:SEPOLIA_RPC_URL --ether) ETH"

forge script scripts/foundry/Deploy.s.sol --rpc-url $env:SEPOLIA_RPC_URL --private-key $env:PRIVATE_KEY `
    --broadcast --verify --etherscan-api-key $env:ETHERSCAN_API_KEY --slow
$forgeExit = $LASTEXITCODE

# Les adresses sont synchronisées même si seule la vérification Etherscan est restée en attente.
if (Test-Path deployments/11155111.json) { node frontend/scripts/sync-contracts.mjs }
if ($forgeExit -ne 0) {
    Write-Host "forge a signalé une erreur. Si le journal indique ONCHAIN EXECUTION COMPLETE, les contrats sont déployés : ne relancez pas ce script et contrôlez la vérification sur Etherscan."
    exit $forgeExit
}
Write-Host ""
Write-Host "Adresses : deployments/11155111.json (à committer). Transactions : broadcast/Deploy.s.sol/11155111/run-latest.json"
Write-Host "Front : dans frontend/.env.local mettez NEXT_PUBLIC_CHAIN_ID=11155111 et NEXT_PUBLIC_RPC_URL=<RPC Sepolia public>"
