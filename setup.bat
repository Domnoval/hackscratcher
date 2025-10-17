@echo off
REM Scratch Oracle - Setup Script for Windows
REM Run this after restarting your computer to install all packages

echo ========================================
echo 🎰 Scratch Oracle - Setup Script
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

echo ✅ Found package.json
echo.

REM Step 1: Clean install (optional)
echo Step 1: Clean Install (Optional)
echo --------------------------------
set /p clean="Do you want to delete node_modules and reinstall? (y/N): "
if /i "%clean%"=="y" (
    echo ℹ️  Removing node_modules...
    rmdir /s /q node_modules 2>nul
    del package-lock.json 2>nul
    echo ✅ Cleanup complete
)
echo.

REM Step 2: Install base dependencies
echo Step 2: Installing Base Dependencies
echo -------------------------------------
echo ℹ️  This may take 5-10 minutes...
call npm install --legacy-peer-deps

if errorlevel 1 (
    echo ❌ Failed to install base dependencies
    pause
    exit /b 1
)

echo ✅ Base dependencies installed
echo.

REM Step 3: Install camera packages
echo Step 3: Installing Camera ^& Barcode Scanner
echo -------------------------------------------
call npm install expo-camera expo-barcode-scanner --legacy-peer-deps

if errorlevel 1 (
    echo ❌ Failed to install camera packages
    echo ℹ️  You can manually install later with:
    echo    npm install expo-camera expo-barcode-scanner --legacy-peer-deps
) else (
    echo ✅ Camera packages installed
)
echo.

REM Step 4: Install notification packages
echo Step 4: Installing Notification System
echo ---------------------------------------
call npm install expo-notifications expo-background-fetch expo-task-manager expo-device --legacy-peer-deps

if errorlevel 1 (
    echo ❌ Failed to install notification packages
    echo ℹ️  You can manually install later with:
    echo    npm install expo-notifications expo-background-fetch expo-task-manager expo-device --legacy-peer-deps
) else (
    echo ✅ Notification packages installed
)
echo.

REM Step 5: Install map packages
echo Step 5: Installing Map ^& Location Services
echo -------------------------------------------
call npm install react-native-maps expo-location --legacy-peer-deps

if errorlevel 1 (
    echo ❌ Failed to install map packages
    echo ℹ️  You can manually install later with:
    echo    npm install react-native-maps expo-location --legacy-peer-deps
) else (
    echo ✅ Map packages installed
)
echo.

REM Step 6: Install EAS CLI globally
echo Step 6: Installing EAS CLI
echo --------------------------
echo ℹ️  Installing EAS CLI globally...
call npm install -g eas-cli

if errorlevel 1 (
    echo ❌ Failed to install EAS CLI
    echo ℹ️  Try running as Administrator
) else (
    echo ✅ EAS CLI installed
)
echo.

REM Step 7: Configuration check
echo Step 7: Configuration Check
echo ----------------------------

findstr /C:"YOUR_GOOGLE_MAPS_API_KEY" app.json >nul
if errorlevel 1 (
    echo ✅ Google Maps API key configured
) else (
    echo ❌ Google Maps API key not set in app.json
    echo ℹ️  Get key from: https://console.cloud.google.com
)

findstr /C:"YOUR_EAS_PROJECT_ID" app.json >nul
if errorlevel 1 (
    echo ✅ EAS Project ID configured
) else (
    echo ❌ EAS Project ID not set in app.json
    echo ℹ️  Run: eas init
)

echo.

REM Final summary
echo ========================================
echo 🎊 Setup Complete!
echo ========================================
echo.
echo ℹ️  Next steps:
echo   1. Update Google Maps API key in app.json
echo   2. Run: eas init (if not done)
echo   3. Run: npx expo start --clear
echo   4. Test all features on device
echo.
echo 📚 Documentation available in docs/ folder:
echo   - DEPLOYMENT_GUIDE.md - Complete Play Store guide
echo   - LAUNCH_CHECKLIST.md - Step-by-step launch plan
echo   - TROUBLESHOOTING.md - Fix common issues
echo.
echo ✅ Setup script complete!
echo.
echo Press any key to exit...
pause >nul
