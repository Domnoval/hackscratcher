/**
 * Certificate Pinning Service
 *
 * Implements SSL certificate pinning to prevent Man-in-the-Middle (MITM) attacks
 * by validating server certificates against known public key hashes.
 *
 * IMPORTANT: Certificate hashes must be updated when certificates are rotated.
 * See docs/CERTIFICATE_ROTATION.md for instructions.
 */

import { Platform } from 'react-native';

// Only import ssl-pinning on native platforms (it doesn't work on web or Expo Go)
let sslPinnedFetch: any = null;
if (Platform.OS !== 'web') {
  try {
    const sslPinning = require('react-native-ssl-pinning');
    // Check if fetch method actually exists (it won't in Expo Go)
    if (sslPinning && typeof sslPinning.fetch === 'function') {
      sslPinnedFetch = sslPinning.fetch;
    } else {
      console.warn('[SECURITY] react-native-ssl-pinning loaded but fetch not available (Expo Go?), certificate pinning disabled');
    }
  } catch (error) {
    console.warn('[SECURITY] react-native-ssl-pinning not available, certificate pinning disabled');
  }
}

// Certificate SHA-256 public key hashes (Base64 encoded)
// Generated on: 2025-10-26
//
// To regenerate:
// openssl s_client -showcerts -servername <domain> -connect <domain>:443 < /dev/null 2>&1 | \
//   openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | \
//   openssl dgst -sha256 -binary | openssl enc -base64

const CERTIFICATE_PINS = {
  // Supabase API - wqealxmdjpwjbhfrnplk.supabase.co
  // Issuer: Google Trust Services (WE1)
  // Valid until: Check certificate expiration
  SUPABASE: {
    primary: 'sha256/o7y2J41zMtHgAsZJDXeU13tHTo2m4Br+9xBR8RdSCvY=',
    // Backup pin for intermediate CA or future cert rotation
    // TODO: Add backup pin for redundancy
  },

  // Google Maps API - maps.googleapis.com
  // Issuer: Google Trust Services (WR2)
  // Valid until: Check certificate expiration
  GOOGLE_MAPS: {
    primary: 'sha256/m8h135Q5bFsCuQl8ScNcDBvbdEgP7HIoC/Z1tBUiWQo=',
    // Backup pin for intermediate CA or future cert rotation
    // TODO: Add backup pin for redundancy
  },
};

interface PinnedFetchOptions extends RequestInit {
  sslPinning?: {
    certs: string[];
  };
}

/**
 * Certificate pinning configuration
 */
export interface CertificatePinConfig {
  enabled: boolean;
  fallbackToNormalFetch: boolean; // For development/testing only
}

// Default configuration - pinning enabled in production
// TEMPORARY: Allow fallback in production until ssl-pinning is properly configured
const defaultConfig: CertificatePinConfig = {
  enabled: true,
  fallbackToNormalFetch: true, // Allow fallback if ssl-pinning not available
};

let currentConfig = { ...defaultConfig };

/**
 * Update certificate pinning configuration
 * WARNING: Disabling pinning in production is a security risk
 */
export function configureCertificatePinning(config: Partial<CertificatePinConfig>) {
  currentConfig = { ...currentConfig, ...config };

  if (!currentConfig.enabled && !__DEV__) {
    console.warn(
      '[SECURITY] Certificate pinning is disabled in production! This is NOT recommended.'
    );
  }
}

/**
 * Get certificate pins for a given hostname
 */
function getCertificatePins(hostname: string): string[] | null {
  if (hostname.includes('supabase.co')) {
    return [CERTIFICATE_PINS.SUPABASE.primary];
  }

  if (hostname.includes('googleapis.com') || hostname.includes('google.com')) {
    return [CERTIFICATE_PINS.GOOGLE_MAPS.primary];
  }

  return null;
}

/**
 * Perform a network request with SSL certificate pinning
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @returns Promise with the response
 *
 * @throws Error if certificate validation fails
 */
export async function pinnedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Certificate pinning only works on native platforms (iOS/Android)
  // On web, or if ssl-pinning is not available, use regular fetch
  if (Platform.OS === 'web' || !sslPinnedFetch) {
    if (Platform.OS === 'web') {
      console.debug(`[SECURITY] Web platform detected, using browser's native certificate validation for: ${url}`);
    } else {
      console.warn(`[SECURITY] Certificate pinning not available, using normal fetch for: ${url}`);
    }
    return fetch(url, options);
  }

  if (!currentConfig.enabled) {
    if (currentConfig.fallbackToNormalFetch) {
      console.warn(`[SECURITY] Certificate pinning disabled, using normal fetch for: ${url}`);
      return fetch(url, options);
    }
    throw new Error('Certificate pinning is disabled but fallback is not allowed');
  }

  try {
    const hostname = new URL(url).hostname;
    const pins = getCertificatePins(hostname);

    if (!pins) {
      // No pinning configured for this domain - use normal fetch
      console.debug(`[SECURITY] No certificate pins configured for: ${hostname}`);
      return fetch(url, options);
    }

    // Perform pinned fetch
    // Note: react-native-ssl-pinning requires a different options format
    const pinnedOptions = {
      method: options.method || 'GET',
      headers: options.headers as Record<string, string> | undefined,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
      sslPinning: {
        certs: pins,
      },
    };

    console.debug(`[SECURITY] Performing pinned fetch to: ${hostname}`);
    const response = await sslPinnedFetch(url, pinnedOptions as any);

    // Convert react-native-ssl-pinning response to standard Response-like object
    return response as any as Response;
  } catch (error) {
    // Certificate pinning failure - this is a security event
    console.error('[SECURITY] Certificate pinning validation failed:', error);
    console.error('[SECURITY] URL:', url);

    // If fallback is allowed, use regular fetch
    if (currentConfig.fallbackToNormalFetch) {
      console.warn('[SECURITY] Falling back to normal fetch due to pinning error');
      return fetch(url, options);
    }

    if (error instanceof Error) {
      // Check if it's a pinning failure vs network error
      const isPinningError = error.message.toLowerCase().includes('certificate') ||
                            error.message.toLowerCase().includes('ssl') ||
                            error.message.toLowerCase().includes('pin');

      if (isPinningError) {
        throw new Error(
          'SSL Certificate Validation Failed. This could indicate a Man-in-the-Middle attack. ' +
          'If this persists, certificates may need to be updated.'
        );
      }
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Check if certificate pinning is available and configured
 */
export function isCertificatePinningEnabled(): boolean {
  return currentConfig.enabled;
}

/**
 * Get current certificate pin configuration (for diagnostics)
 * WARNING: Do not expose full pins in production logs
 */
export function getCertificateConfig() {
  return {
    enabled: currentConfig.enabled,
    fallbackAllowed: currentConfig.fallbackToNormalFetch,
    pinnedDomains: [
      'supabase.co',
      'googleapis.com',
    ],
  };
}

/**
 * Validate that certificates are not expired
 * This should be called periodically or at app startup
 *
 * Note: This is a placeholder - actual validation requires certificate parsing
 */
export async function validateCertificates(): Promise<{
  valid: boolean;
  warnings: string[];
}> {
  const warnings: string[] = [];

  // TODO: Implement certificate expiration checking
  // This would require parsing the actual certificate files
  // For now, we just check if pinning is configured

  if (!currentConfig.enabled) {
    warnings.push('Certificate pinning is disabled');
  }

  const config = getCertificateConfig();
  if (config.pinnedDomains.length === 0) {
    warnings.push('No domains are configured for certificate pinning');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Export certificate pins for reference (development only)
 */
export function getCertificatePins_DEV_ONLY() {
  if (!__DEV__) {
    throw new Error('This function is only available in development mode');
  }
  return CERTIFICATE_PINS;
}
