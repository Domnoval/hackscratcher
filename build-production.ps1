$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
Set-Location "D:\Scratch_n_Sniff\scratch-oracle-app\android"
.\gradlew.bat bundleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
    Write-Host "AAB location: app\build\outputs\bundle\release\app-release.aab"
} else {
    Write-Host "Build failed with error code $LASTEXITCODE" -ForegroundColor Red
}
