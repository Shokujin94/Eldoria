@echo off
cd /d "%~dp0"
echo Abra http://localhost:8000 no navegador. Mantenha esta janela aberta.
where py >nul 2>nul
if %errorlevel% equ 0 (py -m http.server 8000 --bind 127.0.0.1) else (python -m http.server 8000 --bind 127.0.0.1)
pause
