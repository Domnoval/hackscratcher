# SSL Certificate Pinning - Implementation Summary

**Implementation Date:** 2025-10-26
**Status:** COMPLETE
**Security Level:** HARDENED

---

## Quick Reference

### Current Certificate Hashes (as of 2025-10-26)

| Service | Domain | SHA-256 Public Key Hash |
|---------|--------|------------------------|
| **Supabase** | wqealxmdjpwjbhfrnplk.supabase.co | `sha256/o7y2J41zMtHgAsZJDXeU13tHTo2m4Br+9xBR8RdSCvY=` |
| **Google Maps** | maps.googleapis.com | `sha256/m8h135Q5bFsCuQl8ScNcDBvbdEgP7HIoC/Z1tBUiWQo=` |

### Certificate Expiration Dates

- **Supabase:** December 5, 2025 (90 days from issue)
- **Google Maps:** December 24, 2025 (84 days from issue)

**ACTION REQUIRED:** Update certificates before expiration dates!

---

## Files Created

### Core Implementation Files

1. **`services/security/certificatePinning.ts`**
   - Main certificate pinning service
   - Exports `pinnedFetch()` function
   - Configuration management
   - Certificate validation logic

2. **`services/security/googleMapsSecure.ts`**
   - Secure wrapper for Google Maps API
   - Geocoding, Places, Directions APIs
   - Type-safe interfaces
   - Certificate-pinned requests

### Documentation Files

3. **`docs/CERTIFICATE_ROTATION.md`**
   - Complete certificate rotation guide
   - Step-by-step update instructions
   - Troubleshooting guide
   - Best practices

4. **`docs/SECURITY_IMPLEMENTATION.md`**
   - Implementation summary
   - Testing procedures
   - Maintenance requirements

5. **`services/security/README.md`**
   - Security services overview
   - Usage examples
   - Quick reference

6. **`CERTIFICATE_PINNING_SUMMARY.md`** (this file)
   - Quick reference guide
   - All file paths
   - Certificate hashes

### Utility Scripts

7. **`scripts/update-certificates.sh`** (Linux/Mac)
   - Automated certificate update script
   - Fetches and extracts new hashes
   - Checks expiration dates

8. **`scripts/update-certificates.bat`** (Windows)
   - Windows version of update script
   - Same functionality as .sh version

### Certificate Files (Reference Only)

9. **`supabase-cert.pem`**
   - Current Supabase certificate
   - Valid until: Dec 5, 2025
   - Issuer: Google Trust Services (WE1)

10. **`google-maps-cert.pem`**
    - Current Google Maps certificate
    - Valid until: Dec 24, 2025
    - Issuer: Google Trust Services (WR2)

### Modified Files

11. **`lib/supabase.ts`**
    - Updated to use `pinnedFetch`
    - All Supabase API calls now pinned
    - Line 4: Import added
    - Line 22: Custom fetch configured

12. **`package.json`**
    - Added `react-native-ssl-pinning` dependency
    - Version: Latest (check file for exact version)

---

## Integration Points

### Supabase Client

All Supabase API calls automatically use certificate pinning:

```typescript
// lib/supabase.ts
import { pinnedFetch } from '../services/security/certificatePinning';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: pinnedFetch as unknown as typeof fetch,
  },
});
```

### Google Maps API (Future Use)

For any Google Maps API calls:

```typescript
import {
  geocodeAddress,
  reverseGeocode,
  searchNearbyPlaces,
  getDirections
} from './services/security/googleMapsSecure';

// All calls are automatically pinned
const results = await geocodeAddress('1600 Amphitheatre Parkway, Mountain View, CA');
```

---

## Testing Checklist

### Before Production Deployment

- [ ] Test on iOS physical device
- [ ] Test on Android physical device
- [ ] Verify all Supabase API calls work
- [ ] Test on Wi-Fi network
- [ ] Test on cellular network
- [ ] Check logs for certificate validation messages
- [ ] Verify no certificate validation errors
- [ ] Test authentication flows
- [ ] Test data fetching operations
- [ ] Build production version locally and test

### Post-Deployment Monitoring

- [ ] Monitor certificate validation logs
- [ ] Set up certificate expiration alerts
- [ ] Check error rates for SSL failures
- [ ] User feedback monitoring
- [ ] Performance impact assessment

---

## Maintenance Schedule

### Monthly (1st of each month)
- Run certificate update script
- Check expiration dates
- Review logs for pinning failures
- Update calendar reminders if needed

### 60 Days Before Expiration
- Prepare for certificate rotation
- Review rotation documentation
- Schedule update deployment

### 30 Days Before Expiration
- Fetch new certificates
- Update certificate hashes in code
- Create update branch
- Test thoroughly

### 14 Days Before Expiration
- Deploy updated app to stores
- Monitor adoption rates

### 7 Days Before Expiration
- Push notifications for update
- Monitor update percentages

### After Expiration
- Remove backup pins (after sufficient adoption)
- Update documentation

---

## Quick Commands

### Check Current Certificates

**Linux/Mac:**
```bash
./scripts/update-certificates.sh
```

**Windows:**
```cmd
scripts\update-certificates.bat
```

### Manual Certificate Fetch

**Supabase:**
```bash
(echo Q | openssl s_client -showcerts -servername wqealxmdjpwjbhfrnplk.supabase.co \
  -connect wqealxmdjpwjbhfrnplk.supabase.co:443 2>&1) | \
  openssl x509 -outform PEM > supabase-cert.pem
```

**Google Maps:**
```bash
(echo Q | openssl s_client -showcerts -servername maps.googleapis.com \
  -connect maps.googleapis.com:443 2>&1) | \
  openssl x509 -outform PEM > google-maps-cert.pem
```

### Extract SHA-256 Hash

```bash
openssl x509 -in cert.pem -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64
```

### Check Expiration

```bash
openssl x509 -in cert.pem -noout -dates
```

---

## File Paths Reference

All file paths from project root (`D:\Scratch_n_Sniff\scratch-oracle-app`):

```
Services:
  services/security/certificatePinning.ts
  services/security/googleMapsSecure.ts
  services/security/README.md

Documentation:
  docs/CERTIFICATE_ROTATION.md
  docs/SECURITY_IMPLEMENTATION.md
  CERTIFICATE_PINNING_SUMMARY.md

Scripts:
  scripts/update-certificates.sh
  scripts/update-certificates.bat

Certificates:
  supabase-cert.pem
  google-maps-cert.pem

Modified:
  lib/supabase.ts
  package.json
```

---

## Security Benefits

- **MITM Attack Prevention:** Validates server certificates against known public key hashes
- **SSL Stripping Protection:** Prevents downgrade attacks
- **Certificate Substitution Protection:** Blocks forged certificates
- **Data Integrity:** Ensures API traffic is not intercepted or modified
- **Authentication Security:** Protects user tokens and credentials
- **Compliance:** Meets OWASP Mobile Security best practices

---

## Support & Troubleshooting

### Issue: Certificate Validation Errors

1. Check if certificates have been rotated
2. Run update script: `./scripts/update-certificates.sh`
3. Compare new hashes with current hashes
4. Update if different
5. See `docs/CERTIFICATE_ROTATION.md` for details

### Issue: App Can't Connect to APIs

1. Check network connectivity
2. Review logs for specific errors
3. Verify certificate expiration dates
4. Test with certificate pinning disabled (dev only)
5. Contact security team

### Resources

- [CERTIFICATE_ROTATION.md](docs/CERTIFICATE_ROTATION.md) - Complete rotation guide
- [SECURITY_IMPLEMENTATION.md](docs/SECURITY_IMPLEMENTATION.md) - Implementation details
- [services/security/README.md](services/security/README.md) - Service documentation
- [OWASP Certificate Pinning](https://owasp.org/www-community/controls/Certificate_and_Public_Key_Pinning)

---

## Emergency Contacts

**Security Team:** [Contact information here]
**DevOps Team:** [Contact information here]
**On-Call:** [Contact information here]

---

**Last Updated:** 2025-10-26
**Next Review:** 2025-11-26 (monthly)
**Certificate Update Due:** December 2025
**Maintainer:** Security Hardening Specialist
