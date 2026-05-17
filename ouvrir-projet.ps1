# Demarrage du projet suivi-projets (Windows)
# Clic droit > Executer avec PowerShell, ou : powershell -ExecutionPolicy Bypass -File .\ouvrir-projet.ps1

$ErrorActionPreference = "Stop"
$racine = $PSScriptRoot
Set-Location $racine

Write-Host "=== Suivi projets — demarrage ===" -ForegroundColor Cyan

# Dependances
if (-not (Test-Path "$racine\backend\node_modules")) {
    Write-Host "Installation backend..." -ForegroundColor Yellow
    Set-Location "$racine\backend"; npm install; Set-Location $racine
}
if (-not (Test-Path "$racine\frontend\node_modules")) {
    Write-Host "Installation frontend..." -ForegroundColor Yellow
    Set-Location "$racine\frontend"; npm install; Set-Location $racine
}

Set-Location "$racine\backend"
Write-Host "Verification PostgreSQL..." -ForegroundColor Cyan
npm run db:verify
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ECHEC : le mot de passe dans backend\.env ne correspond pas a PostgreSQL." -ForegroundColor Red
    Write-Host "Faites : cd backend  puis  npm run setup:db-password" -ForegroundColor Yellow
    Write-Host "(saisissez le meme mot de passe que dans pgAdmin pour l'utilisateur postgres)" -ForegroundColor Yellow
    Write-Host ""
    $continuer = Read-Host "Lancer quand meme l'interface web sans base ? (o/N)"
    if ($continuer -ne "o" -and $continuer -ne "O") { exit 1 }
} else {
    Write-Host "Initialisation base (si besoin)..." -ForegroundColor Cyan
    npm run db:setup 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "(db:setup a signale une erreur — peut-etre deja initialise, on continue)" -ForegroundColor DarkYellow
    }
}

# Liberer ports
foreach ($p in 3000, 5173) {
    Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 1

Write-Host "Demarrage API (port 3000) et Vite (port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$racine\backend`"; npm run dev"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$racine\frontend`"; npm run dev"
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173/"

Write-Host ""
Write-Host "Navigateur ouvert sur http://localhost:5173/" -ForegroundColor Green
Write-Host "Compte test (apres db:setup reussi) : admin@company.com / password123" -ForegroundColor Cyan
