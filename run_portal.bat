@echo off
title CampusConnect - MITS Gwalior Student Portal
echo ========================================================
echo   CampusConnect - MITS Gwalior Student Portal (AMS Theme)
echo ========================================================
echo Starting Express Backend & Static Server on Port 5000...
cd /d "%~dp0backend"
start http://localhost:5000/index.html
node index.js
pause
