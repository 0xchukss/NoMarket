param()

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$envFiles = @(
  (Join-Path $root ".env.deploy.local"),
  (Join-Path $root ".env.local")
)
foreach ($envFile in $envFiles) {
  if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -match "^\s*[^#][^=]+=" } | ForEach-Object {
      $name, $value = $_ -split "=", 2
      [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
    }
  }
}

if (-not $env:SEPOLIA_RPC_URL) { throw "Missing SEPOLIA_RPC_URL in .env.local" }
if (-not $env:DEPLOYER_PRIVATE_KEY) { throw "Missing DEPLOYER_PRIVATE_KEY in .env.local" }
if (-not $env:UMA_OPTIMISTIC_ORACLE_V3) { throw "Missing UMA_OPTIMISTIC_ORACLE_V3 in .env.local" }
if (-not $env:UMA_CURRENCY) { throw "Missing UMA_CURRENCY in .env.local" }

Push-Location (Join-Path $root "packages\foundry")
try {
  $forgeCommand = Get-Command forge -ErrorAction SilentlyContinue
  $forge = if ($forgeCommand) { $forgeCommand.Source } else { Join-Path $env:TEMP "foundry-win\forge.exe" }
  if (-not (Test-Path $forge)) { throw "Missing forge. Install Foundry or place forge.exe at $forge" }

  & $forge soldeer install
  $args = @("script", "script/DeployNoMarket.s.sol:DeployNoMarket", "--rpc-url", "sepolia", "--broadcast")
  if ($env:ETHERSCAN_API_KEY) {
    $args += "--verify"
  }
  & $forge @args
} finally {
  Pop-Location
}
