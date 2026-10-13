# FitPlan — One-Click Local Startup Script (PowerShell)
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Starting FitPlan Full-Stack Application (Local Dev) " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Flask Backend on Port 5000
Write-Host "[1/2] Starting Python Flask Backend API on http://127.0.0.1:5000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootDir'; python -m backend.app"

# 2. Start Vite Frontend on Port 8443
Write-Host "[2/2] Starting React + Vite Frontend on http://localhost:8443 ..." -ForegroundColor Green
Set-Location "$RootDir\ProjectOverview"
npm.cmd run dev
