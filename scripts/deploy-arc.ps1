$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env.deploy.local"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*#" -or $_ -notmatch "=") { return }
    $name, $value = $_ -split "=", 2
    if ($name -and -not [Environment]::GetEnvironmentVariable($name, "Process")) {
      [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
    }
  }
}

$forge = Get-Command forge -ErrorAction SilentlyContinue
if (-not $forge -and (Test-Path "$env:TEMP\foundry-win\forge.exe")) {
  $forge = Get-Item "$env:TEMP\foundry-win\forge.exe"
}
if (-not $forge) {
  throw "Foundry forge is required. Install Foundry or add forge.exe to PATH."
}
$forgePath = if ($forge.Source) { $forge.Source } else { $forge.FullName }
if (-not $env:ARC_TESTNET_RPC) { throw "Missing ARC_TESTNET_RPC in .env.deploy.local." }
if (-not $env:DEPLOYER_PRIVATE_KEY) { throw "Missing DEPLOYER_PRIVATE_KEY in .env.deploy.local." }

Push-Location (Join-Path $root "contracts\arc")
try {
  & $forgePath script script/DeployArc.s.sol:DeployArc --rpc-url $env:ARC_TESTNET_RPC --broadcast
}
finally {
  Pop-Location
}
