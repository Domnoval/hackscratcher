# Security Services

This directory contains security-related services for the Scratch Oracle application.

## Certificate Pinning

**File:** `certificatePinning.ts`

Implements SSL certificate pinning to prevent Man-in-the-Middle (MITM) attacks on API communications.

### Pinned Services

1. **Supabase API** (wqealxmdjpwjbhfrnplk.supabase.co)
   - All database operations
   - Authentication
   - Real-time subscriptions

2. **Google Maps API** (maps.googleapis.com)
   - Geocoding
   - Places API
   - Directions API (when implemented)

### Usage

Certificate pinning is automatically enabled for all Supabase API calls. The Supabase client in `lib/supabase.ts` is configured to use the `pinnedFetch` function.

For other API calls that need pinning:

```typescript
import { pinnedFetch } from './services/security/certificatePinning';

// Use instead of regular fetch
const response = await pinnedFetch('https://api.example.com/endpoint', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Configuration

By default, certificate pinning is:
- **Enabled in production** (`__DEV__ = false`)
- **Enabled with fallback in development** (`__DEV__ = true`)

To change configuration:

```typescript
import { configureCertificatePinning } from './services/security/certificatePinning';

configureCertificatePinning({
  enabled: true,
  fallbackToNormalFetch: false, // Strict mode
});
```

### Testing

Check if pinning is working:

```typescript
import {
  isCertificatePinningEnabled,
  getCertificateConfig,
  validateCertificates
} from './services/security/certificatePinning';

// Check if enabled
console.log('Pinning enabled:', isCertificatePinningEnabled());

// Get configuration
console.log('Config:', getCertificateConfig());

// Validate certificates
const result = await validateCertificates();
console.log('Valid:', result.valid);
console.log('Warnings:', result.warnings);
```

### Certificate Rotation

SSL certificates expire and must be rotated periodically. See the detailed guide:

**[docs/CERTIFICATE_ROTATION.md](../../docs/CERTIFICATE_ROTATION.md)**

Quick checklist:
1. Monitor certificate expiration dates
2. Fetch new certificates when they rotate
3. Extract new SHA-256 hashes
4. Update `certificatePinning.ts`
5. Test thoroughly
6. Deploy updated app

### Security Best Practices

1. **Never disable pinning in production** unless absolutely necessary
2. **Always pin multiple certificates** (leaf + intermediate CA)
3. **Monitor pinning failures** - they may indicate attacks
4. **Keep certificates updated** - set calendar reminders
5. **Test on real devices** before deploying

### Troubleshooting

**Problem:** Certificate validation errors

**Solutions:**
1. Check if certificates have been rotated by the server
2. Update certificate hashes (see CERTIFICATE_ROTATION.md)
3. Verify network connectivity
4. Check logs for specific error messages

**Problem:** Works in dev but not production

**Solutions:**
1. Build production version and test locally
2. Verify pinning is enabled in production mode
3. Check that native modules are properly linked

For more details, see [docs/CERTIFICATE_ROTATION.md](../../docs/CERTIFICATE_ROTATION.md)

## Future Security Features

Planned security enhancements:

- [ ] Root detection for jailbroken/rooted devices
- [ ] Code obfuscation
- [ ] Runtime application self-protection (RASP)
- [ ] Secure storage for sensitive data
- [ ] Biometric authentication integration

---

**Maintained by:** Security Team
**Last Updated:** 2025-10-26
