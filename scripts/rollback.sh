#!/bin/bash

################################################################################
# SCRATCH ORACLE - INSTANT ROLLBACK SCRIPT
#
# Purpose: Rollback to a previous version (FAST!)
# Use when: Deployment went wrong, critical bugs found
#
# Usage:
#   ./scripts/rollback.sh <tag>                    # Rollback to specific tag
#   ./scripts/rollback.sh                          # Show recent tags and choose
#   ./scripts/rollback.sh --last                   # Rollback to last backup
################################################################################

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Start timer
START_TIME=$(date +%s)

################################################################################
# CONFIGURATION
################################################################################

ROLLBACK_TAG="${1:-}"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
SAFETY_BACKUP_TAG="safety_backup_before_rollback_$(date +%Y%m%d_%H%M%S)"

################################################################################
# FUNCTIONS
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_elapsed_time() {
    local END_TIME=$(date +%s)
    local ELAPSED=$((END_TIME - START_TIME))
    local MINUTES=$((ELAPSED / 60))
    local SECONDS=$((ELAPSED % 60))
    echo -e "${GREEN}Time elapsed: ${MINUTES}m ${SECONDS}s${NC}"
}

show_recent_tags() {
    log_info "Recent backup tags:"
    echo ""
    git tag -l "backup_*" --sort=-creatordate | head -10 | nl
    echo ""
    git tag -l "v*" --sort=-creatordate | head -10 | nl
}

################################################################################
# PRE-FLIGHT CHECKS
################################################################################

log_info "========================================="
log_info "ROLLBACK SCRIPT"
log_info "========================================="
log_info "Current branch: ${CURRENT_BRANCH}"
log_info ""

# Check if git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not a git repository!"
    exit 1
fi

################################################################################
# SELECT ROLLBACK TARGET
################################################################################

# If --last flag, get most recent backup tag
if [[ "${ROLLBACK_TAG}" == "--last" ]]; then
    ROLLBACK_TAG=$(git tag -l "backup_*" --sort=-creatordate | head -1)
    if [[ -z "${ROLLBACK_TAG}" ]]; then
        log_error "No backup tags found!"
        exit 1
    fi
    log_info "Most recent backup: ${ROLLBACK_TAG}"
fi

# If no tag specified, show options
if [[ -z "${ROLLBACK_TAG}" ]]; then
    log_info "No rollback target specified."
    echo ""
    show_recent_tags
    echo ""
    read -p "Enter tag name to rollback to: " ROLLBACK_TAG

    if [[ -z "${ROLLBACK_TAG}" ]]; then
        log_error "No tag specified. Exiting."
        exit 1
    fi
fi

# Verify tag exists
if ! git rev-parse "${ROLLBACK_TAG}" >/dev/null 2>&1; then
    log_error "Tag '${ROLLBACK_TAG}' does not exist!"
    echo ""
    show_recent_tags
    exit 1
fi

log_success "Rollback target: ${ROLLBACK_TAG}"
echo ""

################################################################################
# CONFIRM ROLLBACK
################################################################################

# Get info about the tag
TAG_DATE=$(git log -1 --format=%ai "${ROLLBACK_TAG}")
TAG_MESSAGE=$(git tag -l --format='%(contents:subject)' "${ROLLBACK_TAG}")
TAG_COMMIT=$(git rev-parse --short "${ROLLBACK_TAG}")

log_warning "========================================="
log_warning "ROLLBACK CONFIRMATION"
log_warning "========================================="
log_warning "You are about to rollback to:"
echo ""
echo "  Tag: ${ROLLBACK_TAG}"
echo "  Date: ${TAG_DATE}"
echo "  Commit: ${TAG_COMMIT}"
echo "  Message: ${TAG_MESSAGE}"
echo ""
log_warning "This will:"
echo "  1. Create a safety backup of current state"
echo "  2. Reset your working directory to ${ROLLBACK_TAG}"
echo "  3. Update app.json version info"
echo "  4. Force push to remote (DANGEROUS!)"
echo ""
log_warning "========================================="
read -p "Type 'ROLLBACK' to confirm: " -r

if [[ ! $REPLY == "ROLLBACK" ]]; then
    log_error "Rollback cancelled"
    exit 1
fi

echo ""

################################################################################
# CREATE SAFETY BACKUP
################################################################################

log_info "Step 1/6: Creating safety backup..."

# Commit any uncommitted changes
if [[ -n $(git status -s) ]]; then
    log_warning "Uncommitted changes found. Committing to safety backup..."
    git add -A
    git commit -m "Safety backup before rollback to ${ROLLBACK_TAG}" || true
fi

# Create safety backup tag
git tag -a "${SAFETY_BACKUP_TAG}" -m "Safety backup before rolling back to ${ROLLBACK_TAG}"

if git push origin "${SAFETY_BACKUP_TAG}" 2>&1 | grep -v "warning:"; then
    log_success "Safety backup created: ${SAFETY_BACKUP_TAG}"
else
    log_warning "Could not push safety backup tag (continuing anyway)"
fi

echo ""

################################################################################
# ROLLBACK CODE
################################################################################

log_info "Step 2/6: Rolling back code to ${ROLLBACK_TAG}..."

# Hard reset to tag
if git reset --hard "${ROLLBACK_TAG}"; then
    log_success "Code rolled back to ${ROLLBACK_TAG}"
else
    log_error "Failed to reset to tag!"
    exit 1
fi

echo ""

################################################################################
# EXTRACT VERSION INFO
################################################################################

log_info "Step 3/6: Extracting version information..."

ROLLBACK_VERSION=$(grep -o '"version": "[^"]*"' app.json | cut -d'"' -f4)
ROLLBACK_VERSION_CODE=$(grep -o '"versionCode": [0-9]*' app.json | grep -o '[0-9]*')

log_info "Rolled back to version: ${ROLLBACK_VERSION}"
log_info "Version code: ${ROLLBACK_VERSION_CODE}"

echo ""

################################################################################
# REBUILD APP
################################################################################

log_info "Step 4/6: Triggering new build..."

read -p "Build preview APK now? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v eas &> /dev/null; then
        log_info "Starting EAS build (preview)..."
        eas build --platform android --profile preview --non-interactive --no-wait

        log_success "Build submitted"
        log_info "Check status: eas build:list"
    else
        log_warning "EAS CLI not found. Build manually with: eas build --platform android --profile preview"
    fi
else
    log_info "Skipping build. Build manually when ready:"
    log_info "  eas build --platform android --profile preview"
fi

echo ""

################################################################################
# FORCE PUSH TO REMOTE
################################################################################

log_warning "Step 5/6: Force pushing to remote..."
log_warning "This is a DESTRUCTIVE operation!"

read -p "Force push to origin/${CURRENT_BRANCH}? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if git push origin "${CURRENT_BRANCH}" --force; then
        log_success "Force pushed to origin/${CURRENT_BRANCH}"
    else
        log_error "Force push failed!"
        log_warning "Your local code is rolled back, but remote is unchanged"
        log_warning "Try: git push origin ${CURRENT_BRANCH} --force"
        exit 1
    fi
else
    log_warning "Skipped force push."
    log_warning "Your local code is rolled back, but remote is unchanged"
    log_warning "To sync remote: git push origin ${CURRENT_BRANCH} --force"
fi

echo ""

################################################################################
# CREATE ROLLBACK TAG
################################################################################

log_info "Step 6/6: Creating rollback tag..."

ROLLBACK_MARKER_TAG="rollback_to_${ROLLBACK_TAG}_$(date +%Y%m%d_%H%M%S)"
git tag -a "${ROLLBACK_MARKER_TAG}" -m "Rolled back to ${ROLLBACK_TAG} from ${SAFETY_BACKUP_TAG}"

if git push origin "${ROLLBACK_MARKER_TAG}" 2>&1 | grep -v "warning:"; then
    log_success "Rollback tag created: ${ROLLBACK_MARKER_TAG}"
else
    log_warning "Could not push rollback tag (non-critical)"
fi

echo ""

################################################################################
# SUMMARY
################################################################################

log_success "========================================="
log_success "ROLLBACK COMPLETE!"
log_success "========================================="
echo ""
echo "Rollback Details:"
echo "  Rolled back to: ${ROLLBACK_TAG}"
echo "  Version: ${ROLLBACK_VERSION}"
echo "  Version Code: ${ROLLBACK_VERSION_CODE}"
echo "  Safety backup: ${SAFETY_BACKUP_TAG}"
echo "  Rollback marker: ${ROLLBACK_MARKER_TAG}"
echo ""
echo "Current State:"
echo "  Branch: ${CURRENT_BRANCH}"
echo "  Commit: $(git rev-parse --short HEAD)"
echo "  Version: ${ROLLBACK_VERSION}"
echo ""
echo "Next Steps:"
echo "  1. Test the rolled-back version"
echo "  2. Wait for new build to complete (if requested)"
echo "  3. Deploy to testers"
echo "  4. Fix the issue that caused the rollback"
echo "  5. When fixed, deploy the fix"
echo ""
echo "To restore the previous state (undo rollback):"
echo "  ./scripts/rollback.sh ${SAFETY_BACKUP_TAG}"
echo ""
echo "To check build status:"
echo "  eas build:list"
echo ""

show_elapsed_time

log_info "Rollback started at: $(date -d @${START_TIME} '+%Y-%m-%d %H:%M:%S')"
log_info "Completed at: $(date '+%Y-%m-%d %H:%M:%S')"

log_warning "Remember: The issue that caused this rollback still needs to be fixed!"
