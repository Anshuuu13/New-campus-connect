@echo off
title CampusConnect - MITS Gwalior
echo Starting CampusConnect Server...
cd /d "%~dp0backend"
start http://localhost:5000/resources.html
node index.js
pause
