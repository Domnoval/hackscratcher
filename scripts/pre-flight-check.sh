#!/bin/bash

################################################################################
# SCRATCH ORACLE - PRE-FLIGHT CHECK SCRIPT
#
# Purpose: Verify everything is ready before deployment
# Use before: Any deployment (hotfix, feature, production)
#
# Usage: ./scripts/pre-flight-check.sh [--strict]
################################################################################

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

################################################################################
# CONFIGURATION
################################################################################

STRICT_MODE=false
ERRORS=0
WARNINGS=0
CHECKS_PASSED=0
CHECKS_TOTAL=0

# Parse arguments
if [[ "${1:-}" == "--strict" ]]; then
    STRICT_MODE=true
fi

################################################################################
# FUNCTIONS
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_passed() {
    ((CHECKS_PASSED++))
    ((CHECKS_TOTAL++))
    log_success "$1"
}

check_warning() {
    ((WARNINGS++))
    ((CHECKS_TOTAL++))
    log_warning "$1"
}

check_failed() {
    ((ERRORS++))
    ((CHECKS_TOTAL++))
    log_error "$1"
}

section_header() {
    echo ""
    echo -e "${BOLD}$1${NC}"
    echo "========================================"
}

################################################################################
# START CHECKS
################################################################################

echo ""
echo -e "${BOLD}=========================================${NC}"
echo -e "${BOLD}SCRATCH ORACLE - PRE-FLIGHT CHECKS${NC}"
echo -e "${BOLD}=========================================${NC}"
echo ""
log_info "Running deployment readiness checks..."
if [[ "${STRICT_MODE}" == "true" ]]; then
    log_warning "STRICT MODE: All checks must pass"
fi
echo ""

################################################################################
# 1. GIT CHECKS
################################################################################

section_header "1. Git Repository"

# Check if git repo
if git rev-parse --git-dir > /dev/null 2>&1; then
    check_passed "Git repository initialized"
else
    check_failed "Not a git repository"
fi

# Check current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
if [[ "${CURRENT_BRANCH}" == "main" || "${CURRENT_BRANCH}" == "master" ]]; then
    check_passed "On main branch (${CURRENT_BRANCH})"
else
    check_warning "Not on main branch (current: ${CURRENT_BRANCH})"
fi

# Check for uncommitted changes
if [[ -z $(git status -s 2>/dev/null) ]]; then
    check_passed "No uncommitted changes"
else
    UNCOMMITTED_COUNT=$(git status -s 2>/dev/null | wc -l)
    check_warning "Uncommitted changes detected (${UNCOMMITTED_COUNT} files)"
    if [[ "${STRICT_MODE}" == "true" ]]; then
        echo "    Files:"
        git status -s | sed 's/^/    /'
    fi
fi

# Check if remote exists
if git remote get-url origin > /dev/null 2>&1; then
    REMOTE_URL=$(git remote get-url origin)
    check_passed "Remote origin configured: ${REMOTE_URL}"
else
    check_failed "No remote origin configured"
fi

# Check if ahead/behind remote
if git remote get-url origin > /dev/null 2>&1; then
    git fetch origin "${CURRENT_BRANCH}" 2>/dev/null || true
    LOCAL=$(git rev-parse @ 2>/dev/null)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "unknown")
    BASE=$(git merge-base @ @{u} 2>/dev/null || echo "unknown")

    if [[ "${LOCAL}" == "${REMOTE}" ]]; then
        check_passed "In sync with remote"
    elif [[ "${LOCAL}" == "${BASE}" ]]; then
        COMMITS_BEHIND=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "?")
        check_warning "Behind remote by ${COMMITS_BEHIND} commits"
    elif [[ "${REMOTE}" == "${BASE}" ]]; then
        COMMITS_AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "?")
        check_passed "Ahead of remote by ${COMMITS_AHEAD} commits (ready to push)"
    else
        check_warning "Diverged from remote"
    fi
fi

################################################################################
# 2. DEPENDENCIES
################################################################################

section_header "2. Dependencies & Tools"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_passed "Node.js installed: ${NODE_VERSION}"
else
    check_failed "Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_passed "npm installed: v${NPM_VERSION}"
else
    check_failed "npm not found"
fi

# Check if node_modules exists
if [[ -d "node_modules" ]]; then
    check_passed "node_modules directory exists"
else
    check_failed "node_modules not found (run: npm install)"
fi

# Check for package-lock.json
if [[ -f "package-lock.json" ]]; then
    check_passed "package-lock.json exists"
else
    check_warning "package-lock.json not found"
fi

# Check EAS CLI
if command -v eas &> /dev/null; then
    EAS_VERSION=$(eas --version 2>/dev/null | head -1 || echo "unknown")
    check_passed "EAS CLI installed: ${EAS_VERSION}"
else
    check_failed "EAS CLI not found (install: npm install -g eas-cli)"
fi

# Check if logged into EAS
if command -v eas &> /dev/null; then
    if eas whoami &> /dev/null; then
        EAS_USER=$(eas whoami 2>/dev/null | grep -v "Logged in" || echo "unknown")
        check_passed "Logged into EAS as: ${EAS_USER}"
    else
        check_failed "Not logged into EAS (run: eas login)"
    fi
fi

# Check Expo CLI
if command -v expo &> /dev/null; then
    EXPO_VERSION=$(expo --version 2>/dev/null || echo "unknown")
    check_passed "Expo CLI installed: ${EXPO_VERSION}"
else
    check_warning "Expo CLI not found (optional)"
fi

################################################################################
# 3. PROJECT CONFIGURATION
################################################################################

section_header "3. Project Configuration"

# Check app.json exists
if [[ -f "app.json" ]]; then
    check_passed "app.json exists"
else
    check_failed "app.json not found"
fi

# Check package.json exists
if [[ -f "package.json" ]]; then
    check_passed "package.json exists"
else
    check_failed "package.json not found"
fi

# Check eas.json exists
if [[ -f "eas.json" ]]; then
    check_passed "eas.json exists"
else
    check_failed "eas.json not found"
fi

# Validate app.json structure
if [[ -f "app.json" ]]; then
    # Check version
    if grep -q '"version":' app.json; then
        APP_VERSION=$(grep -o '"version": "[^"]*"' app.json | cut -d'"' -f4)
        check_passed "App version: ${APP_VERSION}"
    else
        check_failed "No version in app.json"
    fi

    # Check Android versionCode
    if grep -q '"versionCode":' app.json; then
        VERSION_CODE=$(grep -o '"versionCode": [0-9]*' app.json | grep -o '[0-9]*')
        check_passed "Android versionCode: ${VERSION_CODE}"
    else
        check_warning "No versionCode in app.json"
    fi

    # Check package name
    if grep -q '"package":' app.json; then
        PACKAGE_NAME=$(grep -o '"package": "[^"]*"' app.json | cut -d'"' -f4)
        check_passed "Package name: ${PACKAGE_NAME}"
    else
        check_failed "No package name in app.json"
    fi

    # Check bundle identifier
    if grep -q '"bundleIdentifier":' app.json; then
        BUNDLE_ID=$(grep -o '"bundleIdentifier": "[^"]*"' app.json | cut -d'"' -f4)
        check_passed "iOS bundle ID: ${BUNDLE_ID}"
    else
        check_warning "No iOS bundle identifier"
    fi

    # Check EAS project ID
    if grep -q '"projectId":' app.json; then
        PROJECT_ID=$(grep -o '"projectId": "[^"]*"' app.json | cut -d'"' -f4)
        check_passed "EAS project ID: ${PROJECT_ID}"
    else
        check_warning "No EAS project ID"
    fi
fi

################################################################################
# 4. ENVIRONMENT VARIABLES
################################################################################

section_header "4. Environment Variables"

# Check for .env file
if [[ -f ".env" ]]; then
    check_passed ".env file exists"
else
    check_warning ".env file not found"
fi

# Check critical env vars in eas.json
if [[ -f "eas.json" ]]; then
    if grep -q "EXPO_PUBLIC_SUPABASE_URL" eas.json; then
        check_passed "Supabase URL configured in eas.json"
    else
        check_warning "Supabase URL not in eas.json"
    fi

    if grep -q "EXPO_PUBLIC_SUPABASE_ANON_KEY" eas.json; then
        check_passed "Supabase anon key configured in eas.json"
    else
        check_warning "Supabase anon key not in eas.json"
    fi

    if grep -q "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY" eas.json; then
        check_passed "Google Maps API key configured in eas.json"
    else
        check_warning "Google Maps API key not in eas.json"
    fi
fi

################################################################################
# 5. BUILD ASSETS
################################################################################

section_header "5. Build Assets"

# Check for required assets
REQUIRED_ASSETS=(
    "assets/icon.png"
    "assets/splash-icon.png"
    "assets/adaptive-icon.png"
    "assets/favicon.png"
)

for asset in "${REQUIRED_ASSETS[@]}"; do
    if [[ -f "${asset}" ]]; then
        check_passed "${asset} exists"
    else
        check_warning "${asset} not found"
    fi
done

# Check for Play Store service account (for production)
if [[ -f "google-play-service-account.json" ]]; then
    check_passed "Play Store service account configured"
else
    check_warning "Play Store service account not found (required for submission)"
fi

################################################################################
# 6. CODE QUALITY
################################################################################

section_header "6. Code Quality"

# Check TypeScript
if [[ -f "tsconfig.json" ]]; then
    check_passed "TypeScript configured"

    # Try to run TypeScript check
    if command -v npx &> /dev/null; then
        log_info "Running TypeScript check..."
        if npx tsc --noEmit 2>&1 | head -5 > /tmp/tsc-output.txt; then
            check_passed "TypeScript check passed"
        else
            ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-output.txt || echo "0")
            if [[ "${ERROR_COUNT}" -gt "0" ]]; then
                check_warning "TypeScript errors found (${ERROR_COUNT})"
                if [[ "${STRICT_MODE}" == "true" ]]; then
                    cat /tmp/tsc-output.txt | sed 's/^/    /'
                fi
            else
                check_passed "TypeScript check passed"
            fi
        fi
        rm -f /tmp/tsc-output.txt
    fi
else
    check_warning "No tsconfig.json found"
fi

# Check for test script
if grep -q '"test":' package.json; then
    check_passed "Test script configured"

    # Optionally run tests
    if [[ "${STRICT_MODE}" == "true" ]]; then
        log_info "Running tests (strict mode)..."
        if npm test 2>&1 | tail -10; then
            check_passed "All tests passed"
        else
            check_failed "Tests failed"
        fi
    fi
else
    check_warning "No test script in package.json"
fi

################################################################################
# 7. DEPLOYMENT SCRIPTS
################################################################################

section_header "7. Deployment Scripts"

DEPLOYMENT_SCRIPTS=(
    "scripts/deploy-hotfix.sh"
    "scripts/deploy-feature.sh"
    "scripts/deploy-native.sh"
    "scripts/rollback.sh"
    "scripts/verify-deployment.sh"
)

for script in "${DEPLOYMENT_SCRIPTS[@]}"; do
    if [[ -f "${script}" ]]; then
        if [[ -x "${script}" ]]; then
            check_passed "${script} exists and is executable"
        else
            check_warning "${script} exists but not executable (chmod +x ${script})"
        fi
    else
        check_warning "${script} not found"
    fi
done

################################################################################
# 8. DISK SPACE
################################################################################

section_header "8. System Resources"

# Check disk space (cross-platform)
if command -v df &> /dev/null; then
    DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ "${DISK_USAGE}" -lt 90 ]]; then
        check_passed "Disk space available (${DISK_USAGE}% used)"
    else
        check_warning "Low disk space (${DISK_USAGE}% used)"
    fi
fi

# Check available memory (if on Linux/Mac)
if command -v free &> /dev/null; then
    MEMORY_AVAILABLE=$(free -h | grep "Mem:" | awk '{print $7}')
    check_passed "Memory available: ${MEMORY_AVAILABLE}"
fi

################################################################################
# 9. INTERNET CONNECTIVITY
################################################################################

section_header "9. Connectivity"

# Test internet connectivity
if ping -c 1 8.8.8.8 &> /dev/null; then
    check_passed "Internet connectivity OK"
else
    check_failed "No internet connectivity"
fi

# Test EAS servers
if ping -c 1 expo.dev &> /dev/null; then
    check_passed "Can reach expo.dev"
else
    check_warning "Cannot reach expo.dev (may be temporary)"
fi

# Test Supabase
if grep -q "EXPO_PUBLIC_SUPABASE_URL" eas.json; then
    SUPABASE_URL=$(grep -o 'EXPO_PUBLIC_SUPABASE_URL[^,]*' eas.json | cut -d'"' -f3 | head -1)
    if [[ -n "${SUPABASE_URL}" ]]; then
        SUPABASE_HOST=$(echo "${SUPABASE_URL}" | sed 's|https://||' | sed 's|http://||' | cut -d'/' -f1)
        if ping -c 1 "${SUPABASE_HOST}" &> /dev/null; then
            check_passed "Can reach Supabase (${SUPABASE_HOST})"
        else
            check_warning "Cannot reach Supabase (${SUPABASE_HOST})"
        fi
    fi
fi

################################################################################
# 10. SECURITY CHECKS
################################################################################

section_header "10. Security"

# Check for .gitignore
if [[ -f ".gitignore" ]]; then
    check_passed ".gitignore exists"

    # Check if critical files are ignored
    CRITICAL_FILES=(".env" "google-play-service-account.json" "*.jks" "*.keystore")
    for file_pattern in "${CRITICAL_FILES[@]}"; do
        if grep -q "${file_pattern}" .gitignore; then
            check_passed "${file_pattern} in .gitignore"
        else
            check_warning "${file_pattern} not in .gitignore"
        fi
    done
else
    check_failed ".gitignore not found"
fi

# Check for exposed secrets
if [[ -f ".env" ]]; then
    if git ls-files | grep -q "^\.env$"; then
        check_warning ".env is tracked in git (security risk!)"
    else
        check_passed ".env not tracked in git"
    fi
fi

################################################################################
# SUMMARY
################################################################################

echo ""
echo -e "${BOLD}=========================================${NC}"
echo -e "${BOLD}PRE-FLIGHT CHECK SUMMARY${NC}"
echo -e "${BOLD}=========================================${NC}"
echo ""

CHECKS_FAILED=$((CHECKS_TOTAL - CHECKS_PASSED - WARNINGS))

echo -e "Total checks: ${BOLD}${CHECKS_TOTAL}${NC}"
echo -e "Passed: ${GREEN}${CHECKS_PASSED}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo -e "Failed: ${RED}${CHECKS_FAILED}${NC}"
echo ""

# Calculate percentage
if [[ ${CHECKS_TOTAL} -gt 0 ]]; then
    PASS_RATE=$(( (CHECKS_PASSED * 100) / CHECKS_TOTAL ))
    echo -e "Pass rate: ${BOLD}${PASS_RATE}%${NC}"
    echo ""
fi

# Determine overall status
if [[ ${ERRORS} -eq 0 && ${WARNINGS} -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✓ ALL CHECKS PASSED - READY TO DEPLOY!${NC}"
    EXIT_CODE=0
elif [[ ${ERRORS} -eq 0 ]]; then
    echo -e "${YELLOW}${BOLD}⚠ WARNINGS DETECTED - REVIEW BEFORE DEPLOYING${NC}"
    if [[ "${STRICT_MODE}" == "true" ]]; then
        EXIT_CODE=1
    else
        EXIT_CODE=0
    fi
elif [[ ${ERRORS} -lt 3 ]]; then
    echo -e "${YELLOW}${BOLD}⚠ MINOR ISSUES FOUND - PROCEED WITH CAUTION${NC}"
    EXIT_CODE=1
else
    echo -e "${RED}${BOLD}✗ CRITICAL ISSUES FOUND - DO NOT DEPLOY${NC}"
    EXIT_CODE=1
fi

echo ""
echo "Next steps:"
if [[ ${EXIT_CODE} -eq 0 ]]; then
    echo "  - Ready to deploy!"
    echo "  - Hotfix: ./scripts/deploy-hotfix.sh \"Fix description\""
    echo "  - Feature: ./scripts/deploy-feature.sh \"Feature description\""
    echo "  - Production: ./scripts/deploy-native.sh --production"
else
    echo "  - Fix the issues above"
    echo "  - Re-run this script to verify"
    echo "  - Run in strict mode: ./scripts/pre-flight-check.sh --strict"
fi

echo ""
exit ${EXIT_CODE}
