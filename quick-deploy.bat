@echo off
REM Scratch Oracle - Quick Deploy Script
REM Automates the build and deploy process

echo ========================================
echo  SCRATCH ORACLE - QUICK DEPLOY
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this from the scratch-oracle-app directory.
    pause
    exit /b 1
)

echo [1/5] Checking for uncommitted changes...
git status --short
if errorlevel 1 (
    echo ERROR: Git not initialized
    pause
    exit /b 1
)

echo.
echo [2/5] Running type check...
call npx tsc --noEmit --skipLibCheck
if errorlevel 1 (
    echo WARNING: TypeScript errors found! Continue anyway? (Y/N)
    set /p continue=
    if /i not "%continue%"=="Y" exit /b 1
)

echo.
echo [3/5] Committing changes...
set /p commit_msg="Enter commit message (or press Enter to skip): "
if not "%commit_msg%"=="" (
    git add .
    git commit -m "%commit_msg%"
    git push
    echo Pushed to GitHub!
) else (
    echo Skipping commit.
)

echo.
echo [4/5] Starting EAS build...
echo.
echo Choose build profile:
echo 1) Production (for Play Store)
echo 2) Preview (for testing)
echo.
set /p profile="Enter choice (1 or 2): "

if "%profile%"=="1" (
    echo Building for PRODUCTION...
    call npx eas build --platform android --profile production
) else if "%profile%"=="2" (
    echo Building for PREVIEW...
    call npx eas build --platform android --profile preview
) else (
    echo Invalid choice!
    pause
    exit /b 1
)

echo.
echo [5/5] Build started!
echo.
echo Monitor at: https://expo.dev/accounts/mm444/projects/scratch-oracle-app/builds
echo.
echo ========================================
echo  DEPLOY COMPLETE!
echo ========================================
pause
