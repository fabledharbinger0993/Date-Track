#!/usr/bin/env pwsh
# Remove Phantom File on D: drive

Write-Host "🔍 Attempting to remove phantom file: D:\music" -ForegroundColor Cyan
Write-Host ""

# Method 1: Direct PowerShell deletion
Write-Host "[Method 1] PowerShell Remove-Item..." -ForegroundColor Yellow
try {
    Remove-Item "D:\music" -Force -Recurse -ErrorAction Stop
    Write-Host "  ✓ Success!" -ForegroundColor Green
    exit 0
} catch {
    Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Method 2: CMD DEL with special flags
Write-Host "[Method 2] CMD DEL with force flags..." -ForegroundColor Yellow
try {
    cmd /c "del /F /Q /A D:\music 2>nul"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Success!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "  ✗ Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Method 3: RMDIR if it's a directory
Write-Host "[Method 3] RMDIR for directory..." -ForegroundColor Yellow
try {
    cmd /c "rmdir /S /Q D:\music 2>nul"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Success!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "  ✗ Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Method 4: Check filesystem with chkdsk
Write-Host "[Method 4] Filesystem check recommended..." -ForegroundColor Yellow
Write-Host "  Run as Administrator:" -ForegroundColor White
Write-Host "  chkdsk D: /F" -ForegroundColor Cyan
Write-Host ""
Write-Host "  This will fix filesystem corruption but requires:" -ForegroundColor Yellow
Write-Host "  - Administrator privileges" -ForegroundColor Yellow
Write-Host "  - D: drive to be unmounted (close all programs)" -ForegroundColor Yellow
Write-Host ""

Write-Host "❌ Phantom file could not be removed automatically" -ForegroundColor Red
Write-Host "   Manual fix needed: Run chkdsk as Admin" -ForegroundColor Yellow
