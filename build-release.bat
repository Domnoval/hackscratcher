@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
cd /d D:\Scratch_n_Sniff\scratch-oracle-app\android
gradlew.bat bundleRelease
if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    echo AAB location: app\build\outputs\bundle\release\app-release.aab
) else (
    echo Build failed with error code %ERRORLEVEL%
)
