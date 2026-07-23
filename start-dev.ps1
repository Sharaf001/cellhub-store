# start-dev.ps1
# Run this from the project root: C:\...\cellhub-store\
# It starts BOTH the API server and the web store correctly, every time.

postgresql://neondb_owner:npg_UI24htVYpOCr@ep-rough-brook-atc11p0s-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
$DATABASE_URL = "postgresql://neondb_owner:YOUR_PASSWORD@ep-rough-brook-atc11p0s-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
# --------------------------------------------------------------------

$root = $PSScriptRoot

Write-Host "Starting API server on port 8080..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$root\artifacts\api-server'; `$env:DATABASE_URL='$DATABASE_URL'; `$env:PORT='8080'; pnpm run dev"
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
