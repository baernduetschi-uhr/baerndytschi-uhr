@echo off
title Bärndütschi Uhr
 
echo Stoppe alte Server...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
 
echo Starte Bärndütschi Uhr...
cd /d C:\Users\bidu5\Desktop\Berndeutsche-Zeit
start "Bärndütschi Uhr Server" cmd /k npm run dev
 
echo Warte auf Server...
timeout /t 5 /nobreak >nul
 
echo Öffne Browser...
start http://localhost:3000