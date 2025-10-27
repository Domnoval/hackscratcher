@echo off
REM Daily Scraper Script for Scratch Oracle AI Training
REM Run this daily to collect prize data for ML model training

echo ====================================
echo Scratch Oracle - Daily Data Collection
echo Started: %date% %time%
echo ====================================

cd /d "D:\Scratch_n_Sniff\scratch-oracle-app"

echo.
echo [1/3] Running Minnesota Prize Scraper...
call npm run scrape:prizes:mn
if errorlevel 1 (
    echo ERROR: MN scraper failed!
    goto :error
)

echo.
echo [2/3] Running Florida Prize Scraper...
call npm run scrape:prizes:fl
if errorlevel 1 (
    echo WARNING: FL scraper failed, continuing...
)

echo.
echo [3/3] Creating historical snapshot...
echo Snapshots created in Supabase automatically

echo.
echo ====================================
echo SUCCESS: Daily scraping complete!
echo Finished: %date% %time%
echo ====================================

REM Log to file
echo %date% %time% - Scraping completed successfully >> scraper-log.txt

exit /b 0

:error
echo.
echo ====================================
echo ERROR: Scraping failed!
echo Check logs above for details
echo ====================================
REM Log error
echo %date% %time% - Scraping FAILED >> scraper-log.txt
exit /b 1
