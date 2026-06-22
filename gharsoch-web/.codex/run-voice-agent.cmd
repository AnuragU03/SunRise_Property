@echo off
cd /d "d:\hackathon\realEstate\brokerAssistant\mvp\GharSoch\gharsoch-web"
if not exist ".codex\run-logs" mkdir ".codex\run-logs"
echo [%date% %time%] Starting voice agent...
call npm run voice:agent
echo [%date% %time%] Voice agent exited with %ERRORLEVEL%.
