$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$forge = Get-Command forge -ErrorAction SilentlyContinue
if (-not $forge -and (Test-Path "$env:TEMP\foundry-win\forge.exe")) {
  $forge = Get-Item "$env:TEMP\foundry-win\forge.exe"
}
if (-not $forge) {
  throw "Foundry forge is required. Install Foundry or add forge.exe to PATH."
}
$forgePath = if ($forge.Source) { $forge.Source } else { $forge.FullName }

Push-Location (Join-Path $root "contracts\arc")
try {
  & $forgePath build
}
finally {
  Pop-Location
}
