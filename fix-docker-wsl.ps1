#!/usr/bin/env pwsh
# Docker Desktop and WSL Reset Script

Write-Host "=== Docker Desktop & WSL Reset Procedure ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop Docker Desktop
Write-Host "[1/6] Stopping Docker Desktop..." -ForegroundColor Yellow
$dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
if ($dockerProcess) {
    Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Docker Desktop stopped" -ForegroundColor Green
} else {
    Write-Host "  - Docker Desktop not running" -ForegroundColor Gray
}
Start-Sleep -Seconds 5

# Step 2: Shutdown WSL
Write-Host "[2/6] Shutting down WSL..." -ForegroundColor Yellow
wsl --shutdown
Start-Sleep -Seconds 5
Write-Host "  ✓ WSL shutdown complete" -ForegroundColor Green

# Step 3: Check WSL status
Write-Host "[3/6] Checking WSL status..." -ForegroundColor Yellow
wsl --list --verbose
Write-Host ""

# Step 4: Start Docker Desktop
Write-Host "[4/6] Starting Docker Desktop..." -ForegroundColor Yellow
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Write-Host "  ✓ Docker Desktop starting..." -ForegroundColor Green

# Step 5: Wait for Docker to start
Write-Host "[5/6] Waiting 45 seconds for Docker to start..." -ForegroundColor Yellow
for ($i = 45; $i -gt 0; $i--) {
    Write-Host "  $i seconds remaining..." -NoNewline
    Start-Sleep -Seconds 1
    Write-Host "`r" -NoNewline
}
Write-Host "  ✓ Wait complete" -ForegroundColor Green
Write-Host ""

# Step 6: Verify Docker
Write-Host "[6/6] Verifying Docker..." -ForegroundColor Yellow
try {
    $version = docker version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Docker is running!" -ForegroundColor Green
        Write-Host ""
        docker ps
    } else {
        Write-Host "  ✗ Docker not responding yet. Wait 30 more seconds and try: docker ps" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Docker not ready. Wait 30 more seconds and try: docker ps" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Reset Complete ===" -ForegroundColor Cyan
Write-Host "If Docker still shows errors, run Docker Desktop GUI fix:" -ForegroundColor Yellow
Write-Host "  1. Open Docker Desktop" -ForegroundColor White
Write-Host "  2. Settings → Resources → WSL Integration" -ForegroundColor White
Write-Host "  3. Uncheck 'Ubuntu' → Apply & Restart" -ForegroundColor White
Write-Host "  4. Check 'Ubuntu' → Apply & Restart" -ForegroundColor White
