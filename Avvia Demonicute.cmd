@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Installa Node.js 22 o successivo, poi riapri questo file.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 goto errore
)
call npm.cmd run build
if errorlevel 1 goto errore
echo.
echo Apri http://127.0.0.1:2567 nel browser.
echo Lascia questa finestra aperta durante il test. Ctrl+C ferma il server.
node dist/runtime/src/server/index.js
if errorlevel 1 goto errore
exit /b 0
:errore
echo.
echo Avvio non riuscito. Leggi il messaggio qui sopra.
pause
exit /b 1
