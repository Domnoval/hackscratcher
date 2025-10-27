# SSL Certificate Pinning - Rotation & Maintenance Guide

## Overview

This application uses SSL certificate pinning to prevent Man-in-the-Middle (MITM) attacks on API communications with:
- **Supabase** (wqealxmdjpwjbhfrnplk.supabase.co)
- **Google Maps API** (maps.googleapis.com)

Certificate pinning validates that the server's SSL certificate matches a known public key hash, ensuring you're communicating with the legitimate server.

## Current Certificate Pins

Last updated: **2025-10-26**

| Service | Domain | Pin (SHA-256) | Issuer |
|---------|--------|---------------|---------|
| Supabase | wqealxmdjpwjbhfrnplk.supabase.co | `sha256/o7y2J41zMtHgAsZJDXeU13tHTo2m4Br+9xBR8RdSCvY=` | Google Trust Services (WE1) |
| Google Maps | maps.googleapis.com | `sha256/m8h135Q5bFsCuQl8ScNcDBvbdEgP7HIoC/Z1tBUiWQo=` | Google Trust Services (WR2) |

## Why Certificate Rotation is Necessary

SSL certificates expire and need to be renewed periodically (typically every 90 days to 1 year). When a server's certificate is renewed, the public key hash changes, and the app's pinned hashes must be updated.

**Signs that certificates need to be rotated:**
- App cannot connect to Supabase or Google Maps APIs
- Certificate validation errors in logs
- SSL/TLS handshake failures
- Users report "MITM attack" warnings

## How to Detect Expired or Rotated Certificates

### Method 1: Check Certificate Expiration Dates

```bash
# Check Supabase certificate
openssl s_client -showcerts -servername wqealxmdjpwjbhfrnplk.supabase.co \
  -connect wqealxmdjpwjbhfrnplk.supabase.co:443 < /dev/null 2>&1 | \
  openssl x509 -noout -dates

# Check Google Maps certificate
openssl s_client -showcerts -servername maps.googleapis.com \
  -connect maps.googleapis.com:443 < /dev/null 2>&1 | \
  openssl x509 -noout -dates
```

### Method 2: Monitor App Logs

The certificate pinning service logs validation failures:
```
[SECURITY] Certificate pinning validation failed
[SECURITY] SSL Certificate Validation Failed. This could indicate a Man-in-the-Middle attack.
```

### Method 3: Test in Development

```typescript
import { validateCertificates } from './services/security/certificatePinning';

const result = await validateCertificates();
console.log('Certificate validation:', result);
```

## How to Update Certificate Hashes

### Step 1: Fetch New Certificates

Navigate to the project root:

```bash
cd D:\Scratch_n_Sniff\scratch-oracle-app
```

**For Supabase:**
```bash
(echo Q | openssl s_client -showcerts -servername wqealxmdjpwjbhfrnplk.supabase.co \
  -connect wqealxmdjpwjbhfrnplk.supabase.co:443 2>&1) | \
  openssl x509 -outform PEM > supabase-cert-new.pem
```

**For Google Maps:**
```bash
(echo Q | openssl s_client -showcerts -servername maps.googleapis.com \
  -connect maps.googleapis.com:443 2>&1) | \
  openssl x509 -outform PEM > google-maps-cert-new.pem
```

### Step 2: Extract SHA-256 Public Key Hashes

**For Supabase:**
```bash
openssl x509 -in supabase-cert-new.pem -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64
```

**For Google Maps:**
```bash
openssl x509 -in google-maps-cert-new.pem -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64
```

**Example output:**
```
o7y2J41zMtHgAsZJDXeU13tHTo2m4Br+9xBR8RdSCvY=
```

### Step 3: Update Certificate Hashes in Code

Open `services/security/certificatePinning.ts` and update the hashes:

```typescript
const CERTIFICATE_PINS = {
  SUPABASE: {
    primary: 'sha256/NEW_HASH_HERE', // Replace with new hash
    // Keep old hash as backup during transition
    backup: 'sha256/OLD_HASH_HERE',
  },
  GOOGLE_MAPS: {
    primary: 'sha256/NEW_HASH_HERE',
    backup: 'sha256/OLD_HASH_HERE',
  },
};
```

### Step 4: Update the getCertificatePins Function

Modify the function to support both primary and backup pins during the transition period:

```typescript
function getCertificatePins(hostname: string): string[] | null {
  if (hostname.includes('supabase.co')) {
    return [
      CERTIFICATE_PINS.SUPABASE.primary,
      CERTIFICATE_PINS.SUPABASE.backup, // Include backup
    ].filter(Boolean); // Remove undefined values
  }
  // ... similar for Google Maps
}
```

### Step 5: Test the Update

1. **Development Testing:**
   ```bash
   npm start
   # Test all Supabase API calls
   # Test Google Maps functionality
   ```

2. **Monitor Logs:**
   Look for successful pinning logs:
   ```
   [SECURITY] Performing pinned fetch to: wqealxmdjpwjbhfrnplk.supabase.co
   ```

3. **Test Certificate Validation:**
   Ensure the app can connect to both services without errors.

### Step 6: Deploy Update

1. **Build new app version:**
   ```bash
   npm run build
   ```

2. **Test on physical devices:**
   - iOS device
   - Android device

3. **Deploy to app stores:**
   - Submit updated build to App Store
   - Submit updated build to Google Play

### Step 7: Remove Backup Pins

After users have updated to the new version (allow 2-4 weeks for adoption), remove the backup pins:

```typescript
const CERTIFICATE_PINS = {
  SUPABASE: {
    primary: 'sha256/NEW_HASH_HERE',
    // backup removed after transition period
  },
};
```

### Step 8: Update Documentation

Update this file with:
- New certificate hashes
- New "Last updated" date
- Certificate issuer information
- Expiration dates

## Best Practices

### 1. Pin Multiple Certificates (Recommended)

Always pin both:
- **Leaf certificate** (server's certificate)
- **Intermediate CA certificate** (Certificate Authority)

This provides redundancy if the leaf certificate rotates but the CA remains the same.

To get the intermediate CA certificate:
```bash
openssl s_client -showcerts -servername wqealxmdjpwjbhfrnplk.supabase.co \
  -connect wqealxmdjpwjbhfrnplk.supabase.co:443 < /dev/null 2>&1 | \
  awk '/BEGIN CERTIFICATE/,/END CERTIFICATE/ {print}' | \
  awk 'BEGIN {count=0} /BEGIN CERTIFICATE/ {count++} count==2 {print}' > intermediate-ca.pem

openssl x509 -in intermediate-ca.pem -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64
```

### 2. Set Up Certificate Monitoring

Create a scheduled task to check certificate expiration:

```typescript
// Add to app startup
import { validateCertificates } from './services/security/certificatePinning';

async function checkCertificates() {
  const result = await validateCertificates();
  if (!result.valid) {
    console.warn('Certificate issues detected:', result.warnings);
    // Send alert to development team
  }
}

// Run on app startup
checkCertificates();
```

### 3. Maintain a Certificate Rotation Schedule

Set calendar reminders:
- **30 days before expiration**: Generate new pins and prepare update
- **14 days before expiration**: Deploy updated app
- **7 days before expiration**: Monitor adoption rates
- **After expiration**: Remove backup pins after sufficient adoption

### 4. Testing Certificate Pinning

To test that pinning is working correctly:

```typescript
// In development only
import { configureCertificatePinning, pinnedFetch } from './services/security/certificatePinning';

// Test with invalid pin (should fail)
async function testInvalidPin() {
  try {
    // Temporarily use wrong pin in certificatePinning.ts
    await pinnedFetch('https://wqealxmdjpwjbhfrnplk.supabase.co/rest/v1/');
    console.error('ERROR: Invalid pin should have been rejected!');
  } catch (error) {
    console.log('SUCCESS: Invalid pin was correctly rejected');
  }
}
```

### 5. Emergency Certificate Update Procedure

If certificates rotate unexpectedly:

1. **Immediate Action:**
   - Generate new pins using steps above
   - Create hotfix branch
   - Update `certificatePinning.ts`
   - Deploy emergency update

2. **Temporary Workaround (Development Only):**
   ```typescript
   // ONLY IN EMERGENCY - Remove before production
   configureCertificatePinning({
     enabled: false,
     fallbackToNormalFetch: true,
   });
   ```

3. **Communication:**
   - Notify users of required update
   - Push notification about security update
   - Update app store descriptions

## Troubleshooting

### Problem: "SSL Certificate Validation Failed" Error

**Causes:**
- Certificate has been rotated by the server
- MITM attack (rare but possible)
- Network configuration issues

**Solutions:**
1. Check if certificate has been rotated (see Step 1-2 above)
2. Update certificate pins if needed
3. Test on different networks
4. Check with other team members

### Problem: App Works in Development but Not Production

**Causes:**
- Development mode has `fallbackToNormalFetch: true`
- Different network configurations

**Solutions:**
1. Test with production build locally
2. Enable pinning in development:
   ```typescript
   configureCertificatePinning({
     fallbackToNormalFetch: false,
   });
   ```

### Problem: Certificate Pinning Not Working on iOS/Android

**Causes:**
- Native module not properly linked
- react-native-ssl-pinning not installed correctly

**Solutions:**
1. Rebuild native modules:
   ```bash
   # iOS
   cd ios && pod install && cd ..

   # Android
   cd android && ./gradlew clean && cd ..
   ```

2. Verify installation:
   ```bash
   npm list react-native-ssl-pinning
   ```

## Security Considerations

1. **Never Disable Pinning in Production**
   - Only use `fallbackToNormalFetch` in development
   - Always validate pins before deployment

2. **Store Pins Securely**
   - Pins are stored in code (not a secret)
   - Never store private keys in the app

3. **Monitor for MITM Attacks**
   - Log all pinning failures
   - Alert security team on repeated failures
   - Investigate unusual patterns

4. **Keep Dependencies Updated**
   - Update `react-native-ssl-pinning` regularly
   - Monitor for security advisories

## References

- [OWASP Mobile Security Project](https://owasp.org/www-project-mobile-security/)
- [Certificate Pinning Best Practices](https://owasp.org/www-community/controls/Certificate_and_Public_Key_Pinning)
- [React Native SSL Pinning Documentation](https://github.com/MaxToyberman/react-native-ssl-pinning)
- [OpenSSL Documentation](https://www.openssl.org/docs/)

## Support

For questions or issues with certificate pinning:
1. Check this documentation first
2. Review logs for error details
3. Contact the security team
4. Create an issue in the project repository

---

**Last Updated:** 2025-10-26
**Maintainer:** Security Team
**Next Review:** Check certificates monthly
