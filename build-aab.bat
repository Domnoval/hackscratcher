@echo off
setlocal

REM Set JAVA_HOME
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr

REM Navigate to android directory
cd /d "%~dp0android"

REM Run Gradle build
call gradlew.bat bundleRelease

if errorlevel 1 (
    echo Build failed with error code %errorlevel%
    exit /b %errorlevel%
)

echo Build successful!
echo AAB location: app\build\outputs\bundle\release\app-release.aab
