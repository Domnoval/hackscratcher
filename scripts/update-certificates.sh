#!/bin/bash

# ============================================
# SSL Certificate Update Script
# ============================================
# This script helps update SSL certificate pins
# for Supabase and Google Maps APIs
#
# Usage:
#   ./scripts/update-certificates.sh
#
# Requirements:
#   - OpenSSL installed
#   - Internet connection
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Domains to check
SUPABASE_DOMAIN="wqealxmdjpwjbhfrnplk.supabase.co"
GOOGLE_MAPS_DOMAIN="maps.googleapis.com"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SSL Certificate Update Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to fetch and extract certificate hash
fetch_cert_hash() {
    local domain=$1
    local cert_file=$2

    echo -e "${YELLOW}Fetching certificate for ${domain}...${NC}"

    # Fetch certificate
    echo | openssl s_client -showcerts -servername "$domain" -connect "${domain}:443" 2>&1 | \
        openssl x509 -outform PEM > "$cert_file" 2>/dev/null || {
        echo -e "${RED}Failed to fetch certificate for ${domain}${NC}"
        return 1
    }

    # Extract hash
    local hash=$(openssl x509 -in "$cert_file" -pubkey -noout | \
        openssl pkey -pubin -outform der | \
        openssl dgst -sha256 -binary | \
        openssl enc -base64)

    echo -e "${GREEN}Certificate fetched successfully${NC}"
    echo -e "SHA-256 Hash: ${GREEN}${hash}${NC}"

    # Get certificate details
    echo -e "\nCertificate Details:"
    openssl x509 -in "$cert_file" -noout -text | grep -E "(Issuer:|Subject:|Not Before|Not After)" | sed 's/^/  /'

    echo ""
    echo -e "Pin format: ${BLUE}sha256/${hash}${NC}"
    echo ""

    return 0
}

# Function to check if certificate will expire soon
check_expiration() {
    local cert_file=$1
    local domain=$2

    # Get expiration date
    local not_after=$(openssl x509 -in "$cert_file" -noout -enddate | cut -d= -f2)
    local exp_epoch=$(date -d "$not_after" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$not_after" +%s 2>/dev/null)
    local now_epoch=$(date +%s)
    local days_until_expiry=$(( ($exp_epoch - $now_epoch) / 86400 ))

    echo -e "Certificate for ${domain}:"
    echo -e "  Expires: ${not_after}"

    if [ $days_until_expiry -lt 30 ]; then
        echo -e "  ${RED}WARNING: Expires in ${days_until_expiry} days!${NC}"
    elif [ $days_until_expiry -lt 60 ]; then
        echo -e "  ${YELLOW}Notice: Expires in ${days_until_expiry} days${NC}"
    else
        echo -e "  ${GREEN}Expires in ${days_until_expiry} days${NC}"
    fi
    echo ""
}

# Main execution
echo -e "${BLUE}1. Checking Supabase Certificate${NC}"
echo "================================"
fetch_cert_hash "$SUPABASE_DOMAIN" "supabase-cert-new.pem"
check_expiration "supabase-cert-new.pem" "$SUPABASE_DOMAIN"

echo ""
echo -e "${BLUE}2. Checking Google Maps Certificate${NC}"
echo "================================"
fetch_cert_hash "$GOOGLE_MAPS_DOMAIN" "google-maps-cert-new.pem"
check_expiration "google-maps-cert-new.pem" "$GOOGLE_MAPS_DOMAIN"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Next Steps${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "1. Update services/security/certificatePinning.ts with new hashes"
echo "2. Test the application thoroughly"
echo "3. Update docs/CERTIFICATE_ROTATION.md with new hashes and date"
echo "4. Commit and deploy the changes"
echo ""
echo -e "${GREEN}Certificate files saved:${NC}"
echo "  - supabase-cert-new.pem"
echo "  - google-maps-cert-new.pem"
echo ""
echo -e "${YELLOW}See docs/CERTIFICATE_ROTATION.md for detailed instructions${NC}"
echo ""
