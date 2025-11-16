$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
Set-Location "D:\Scratch_n_Sniff\scratch-oracle-app\android"

Write-Host "Cleaning Gradle build cache..." -ForegroundColor Yellow
.\gradlew.bat clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "Clean failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Building production AAB..." -ForegroundColor Yellow
.\gradlew.bat bundleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
    Write-Host "AAB location: app\build\outputs\bundle\release\app-release.aab"
} else {
    Write-Host "Build failed with error code $LASTEXITCODE" -ForegroundColor Red
}
