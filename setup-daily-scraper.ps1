# Setup Daily Scraper Task
# Run as Administrator

$action = New-ScheduledTaskAction -Execute "D:\Scratch_n_Sniff\scratch-oracle-app\run-daily-scrapers.bat" -WorkingDirectory "D:\Scratch_n_Sniff\scratch-oracle-app"

$trigger = New-ScheduledTaskTrigger -Daily -At 3am

$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -WakeToRun -RestartCount 3 -RestartInterval (New-TimeSpan -Hours 1)

Register-ScheduledTask -TaskName "Scratch Oracle Daily Scraper" -Action $action -Trigger $trigger -Settings $settings -Description "Collect lottery data for AI training" -RunLevel Highest -Force

Write-Host "✅ Task Scheduler configured!" -ForegroundColor Green
Write-Host "   Task Name: Scratch Oracle Daily Scraper" -ForegroundColor Cyan
Write-Host "   Schedule: Daily at 3:00 AM" -ForegroundColor Cyan
Write-Host "   Next run will collect data for AI training" -ForegroundColor Cyan
