@echo off
setlocal

REM Diretórios
set "ROOT=%~dp0"
set "STAGING=%ROOT%deploy_staging"
set "OUTDIR=%ROOT%\.zip"
set "OUTZIP=%OUTDIR%\galeriafotos_deploy.zip"

REM Limpar staging anterior
if exist "%STAGING%" rmdir /S /Q "%STAGING%"

REM Criar diretórios
mkdir "%STAGING%" 2>nul
if not exist "%OUTDIR%" mkdir "%OUTDIR%"

REM Copiar arquivos essenciais da raiz (explícito)
copy /Y "%ROOT%index.php" "%STAGING%\index.php" >nul
copy /Y "%ROOT%script.js" "%STAGING%\script.js" >nul
copy /Y "%ROOT%style.css" "%STAGING%\style.css" >nul
copy /Y "%ROOT%thumb.php" "%STAGING%\thumb.php" >nul
copy /Y "%ROOT%download.php" "%STAGING%\download.php" >nul
if exist "%ROOT%.htaccess" copy /Y "%ROOT%.htaccess" "%STAGING%\.htaccess" >nul

REM Copiar fotos (excluindo caches/temporários)
robocopy "%ROOT%fotos" "%STAGING%\fotos" /E /XD ".cache" "temp" /R:1 /W:1 /NFL /NDL /NJH /NJS /nc /ns /np >nul

REM Criar ZIP via PowerShell
powershell -NoProfile -Command "Compress-Archive -Path '%STAGING%\*' -DestinationPath '%OUTZIP%' -Force" || (
    echo [ERRO] Falha ao criar o ZIP com PowerShell.
    exit /b 1
)

REM Limpar staging
rmdir /S /Q "%STAGING%"

echo [OK] Pacote gerado em: %OUTZIP%
endlocal