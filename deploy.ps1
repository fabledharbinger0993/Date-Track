#!/usr/bin/env pwsh
# Wait for Docker and Deploy Date-Track

Write-Host "⏳ Waiting for Docker Desktop to be ready..." -ForegroundColor Cyan

# Wait up to 2 minutes for Docker
$maxAttempts = 24
$attempt = 0
$dockerReady = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "  Attempt $attempt/$maxAttempts..." -NoNewline
    
    try {
        $null = docker version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✓" -ForegroundColor Green
            $dockerReady = $true
            break
        }
    } catch {
        # Ignore errors
    }
    
    Write-Host " ⏳" -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

if (-not $dockerReady) {
    Write-Host "❌ Docker failed to start after 2 minutes" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Docker is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Deploying Date-Track..." -ForegroundColor Cyan
Write-Host ""

# Deploy Date-Track
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment started successfully!" -ForegroundColor Green
    Write-Host ""
    Start-Sleep -Seconds 5
    docker-compose ps
    Write-Host ""
    Write-Host "Access Date-Track at:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}
