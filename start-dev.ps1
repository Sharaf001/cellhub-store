$root = $PSScriptRoot
$envFile = Join-Path $root ".env"
$databaseUrl = Get-Content $envFile |
    Where-Object { $_ -match '^DATABASE_URL=' } |
    Select-Object -First 1 |
    ForEach-Object { $_.Substring("DATABASE_URL=".Length).Trim("'`"") }

if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    throw "DATABASE_URL is required in $envFile"
}

Write-Host "Starting API server on port 8081..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$root\artifacts\api-server'; `$env:DATABASE_URL='$databaseUrl'; `$env:PORT='8081'; pnpm run dev"
)

Start-Sleep -Seconds 2

Write-Host "Starting web store on port 5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$root\artifacts\mobile-store'; `$env:PORT='5173'; `$env:BASE_PATH='/'; pnpm run dev"
)

Write-Host ""
Write-Host "Both servers launching in separate windows." -ForegroundColor Green
Write-Host "Once ready, open: http://localhost:5173" -ForegroundColor Green
