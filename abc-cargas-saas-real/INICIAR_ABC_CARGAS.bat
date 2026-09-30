@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo        ABC CARGAS - SaaS
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js 20+ nao encontrado.
  echo Instale o Node.js e execute este arquivo novamente.
  pause
  exit /b 1
)

where docker >nul 2>nul
if errorlevel 1 (
  echo ERRO: Docker Desktop nao encontrado ou nao esta no PATH.
  echo Instale/inicie o Docker Desktop e execute novamente.
  pause
  exit /b 1
)

if not exist .env (
  echo Criando .env a partir de .env.example...
  copy /y .env.example .env >nul
)

echo [1/5] Instalando dependencias...
call npm install
if errorlevel 1 goto :error

echo [2/5] Iniciando PostgreSQL...
docker compose up -d postgres
if errorlevel 1 goto :error

echo Aguardando PostgreSQL...
powershell -NoProfile -Command "$ready=$false; for($i=0;$i -lt 60;$i++){ docker compose exec -T postgres pg_isready -U abc -d abc_cargas *> $null; if($LASTEXITCODE -eq 0){$ready=$true;break}; Start-Sleep -Seconds 1 }; if(-not $ready){exit 1}"
if errorlevel 1 goto :error

echo [3/5] Criando estrutura do banco...
call npm run db:migrate
if errorlevel 1 goto :error

echo [4/5] Criando usuario e dados de demonstracao...
call npm run db:seed
if errorlevel 1 goto :error

echo [5/5] Iniciando servidor...
start "ABC Cargas Backend" cmd /k "cd /d "%~dp0" && npm start"
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

echo.
echo ABC Cargas esta disponivel em http://localhost:3000
 echo Login: michele@abccargas.local / ABC@123456
 echo.
echo Para encerrar o backend, feche a janela "ABC Cargas Backend".
pause
exit /b 0

:error
echo.
echo ERRO durante a inicializacao. Veja a mensagem acima.
pause
exit /b 1
