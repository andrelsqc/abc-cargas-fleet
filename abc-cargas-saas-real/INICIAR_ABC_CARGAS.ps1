$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host "ABC Cargas SaaS - inicializacao" -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js 20+ nao encontrado." }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw "Docker Desktop nao encontrado ou nao esta no PATH." }
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
function Invoke-Checked([scriptblock]$Command) {
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "Falha na inicializacao. Consulte a mensagem acima." }
}
Invoke-Checked { npm install }
Invoke-Checked { docker compose up -d postgres }
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  docker compose exec -T postgres pg_isready -U abc -d abc_cargas *> $null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 1
}
if (-not $ready) { throw "PostgreSQL nao ficou pronto em 60 segundos." }
Invoke-Checked { npm run db:migrate }
Invoke-Checked { npm run db:seed }
Start-Process powershell -ArgumentList '-NoExit','-Command',"Set-Location '$PSScriptRoot'; npm start"
Start-Sleep -Seconds 3
Start-Process 'http://localhost:3000'
Write-Host "ABC Cargas: http://localhost:3000" -ForegroundColor Green
Write-Host "Login: michele@abccargas.local / ABC@123456" -ForegroundColor Yellow
