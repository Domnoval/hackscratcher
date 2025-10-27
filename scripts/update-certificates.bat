@echo off
REM ============================================
REM SSL Certificate Update Script (Windows)
REM ============================================
REM This script helps update SSL certificate pins
REM for Supabase and Google Maps APIs
REM
REM Usage:
REM   scripts\update-certificates.bat
REM
REM Requirements:
REM   - OpenSSL installed and in PATH
REM   - Internet connection
REM ============================================

setlocal enabledelayedexpansion

set SUPABASE_DOMAIN=wqealxmdjpwjbhfrnplk.supabase.co
set GOOGLE_MAPS_DOMAIN=maps.googleapis.com

echo ========================================
echo SSL Certificate Update Script
echo ========================================
echo.

echo [1] Checking Supabase Certificate
echo ================================
echo Fetching certificate for %SUPABASE_DOMAIN%...
echo.

REM Fetch Supabase certificate
(echo Q | openssl s_client -showcerts -servername %SUPABASE_DOMAIN% -connect %SUPABASE_DOMAIN%:443 2^>nul) | openssl x509 -outform PEM > supabase-cert-new.pem

if errorlevel 1 (
    echo ERROR: Failed to fetch Supabase certificate
    goto :end
)

REM Extract Supabase hash
for /f "delims=" %%i in ('openssl x509 -in supabase-cert-new.pem -pubkey -noout ^| openssl pkey -pubin -outform der ^| openssl dgst -sha256 -binary ^| openssl enc -base64') do set SUPABASE_HASH=%%i

echo Certificate fetched successfully
echo SHA-256 Hash: %SUPABASE_HASH%
echo.
echo Pin format: sha256/%SUPABASE_HASH%
echo.

echo Certificate Details:
openssl x509 -in supabase-cert-new.pem -noout -text | findstr /C:"Issuer:" /C:"Subject:" /C:"Not Before" /C:"Not After"
echo.
echo.

echo [2] Checking Google Maps Certificate
echo ================================
echo Fetching certificate for %GOOGLE_MAPS_DOMAIN%...
echo.

REM Fetch Google Maps certificate
(echo Q | openssl s_client -showcerts -servername %GOOGLE_MAPS_DOMAIN% -connect %GOOGLE_MAPS_DOMAIN%:443 2^>nul) | openssl x509 -outform PEM > google-maps-cert-new.pem

if errorlevel 1 (
    echo ERROR: Failed to fetch Google Maps certificate
    goto :end
)

REM Extract Google Maps hash
for /f "delims=" %%i in ('openssl x509 -in google-maps-cert-new.pem -pubkey -noout ^| openssl pkey -pubin -outform der ^| openssl dgst -sha256 -binary ^| openssl enc -base64') do set GOOGLE_MAPS_HASH=%%i

echo Certificate fetched successfully
echo SHA-256 Hash: %GOOGLE_MAPS_HASH%
echo.
echo Pin format: sha256/%GOOGLE_MAPS_HASH%
echo.

echo Certificate Details:
openssl x509 -in google-maps-cert-new.pem -noout -text | findstr /C:"Issuer:" /C:"Subject:" /C:"Not Before" /C:"Not After"
echo.
echo.

echo ========================================
echo Next Steps
echo ========================================
echo.
echo 1. Update services\security\certificatePinning.ts with new hashes
echo 2. Test the application thoroughly
echo 3. Update docs\CERTIFICATE_ROTATION.md with new hashes and date
echo 4. Commit and deploy the changes
echo.
echo Certificate files saved:
echo   - supabase-cert-new.pem
echo   - google-maps-cert-new.pem
echo.
echo See docs\CERTIFICATE_ROTATION.md for detailed instructions
echo.

:end
endlocal
pause
