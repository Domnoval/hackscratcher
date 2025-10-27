/**
 * Secure Google Maps API Wrapper
 *
 * Provides secure, pinned API calls to Google Maps services.
 * Uses certificate pinning to prevent MITM attacks.
 */

import { pinnedFetch } from './certificatePinning';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('[SECURITY] Google Maps API key not found in environment variables');
}

/**
 * Google Maps API endpoints
 */
export const GOOGLE_MAPS_ENDPOINTS = {
  GEOCODING: 'https://maps.googleapis.com/maps/api/geocode/json',
  PLACES: 'https://maps.googleapis.com/maps/api/place',
  DIRECTIONS: 'https://maps.googleapis.com/maps/api/directions/json',
  DISTANCE_MATRIX: 'https://maps.googleapis.com/maps/api/distancematrix/json',
} as const;

/**
 * Generic Google Maps API request with certificate pinning
 *
 * @param endpoint - The API endpoint URL
 * @param params - Query parameters
 * @returns Promise with the API response
 */
async function secureMapsRequest<T>(
  endpoint: string,
  params: Record<string, string | number | boolean>
): Promise<T> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured');
  }

  // Build query string
  const queryParams = new URLSearchParams({
    ...params,
    key: GOOGLE_MAPS_API_KEY,
  } as Record<string, string>);

  const url = `${endpoint}?${queryParams.toString()}`;

  try {
    // Use pinned fetch for secure connection
    const response = await pinnedFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check API response status
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    return data as T;
  } catch (error) {
    console.error('[SECURITY] Google Maps API request failed:', error);
    throw error;
  }
}

/**
 * Geocoding API Response Types
 */
export interface GeocodeResult {
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    location_type: string;
    viewport: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  place_id: string;
  types: string[];
}

interface GeocodeResponse {
  results: GeocodeResult[];
  status: string;
  error_message?: string;
}

/**
 * Geocode an address to coordinates
 *
 * @param address - The address to geocode
 * @returns Promise with geocoding results
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult[]> {
  const response = await secureMapsRequest<GeocodeResponse>(
    GOOGLE_MAPS_ENDPOINTS.GEOCODING,
    { address }
  );

  return response.results;
}

/**
 * Reverse geocode coordinates to an address
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Promise with geocoding results
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeResult[]> {
  const response = await secureMapsRequest<GeocodeResponse>(
    GOOGLE_MAPS_ENDPOINTS.GEOCODING,
    { latlng: `${latitude},${longitude}` }
  );

  return response.results;
}

/**
 * Places API Response Types
 */
export interface PlaceResult {
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
}

interface PlacesSearchResponse {
  results: PlaceResult[];
  status: string;
  next_page_token?: string;
  error_message?: string;
}

/**
 * Search for places nearby
 *
 * @param latitude - Center latitude
 * @param longitude - Center longitude
 * @param radius - Search radius in meters
 * @param type - Place type (e.g., 'store', 'gas_station')
 * @param keyword - Optional keyword filter
 * @returns Promise with place results
 */
export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  radius: number,
  type?: string,
  keyword?: string
): Promise<PlaceResult[]> {
  const params: Record<string, string | number> = {
    location: `${latitude},${longitude}`,
    radius,
  };

  if (type) params.type = type;
  if (keyword) params.keyword = keyword;

  const response = await secureMapsRequest<PlacesSearchResponse>(
    `${GOOGLE_MAPS_ENDPOINTS.PLACES}/nearbysearch/json`,
    params
  );

  return response.results;
}

/**
 * Directions API Response Types
 */
export interface DirectionsRoute {
  summary: string;
  legs: Array<{
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    start_address: string;
    end_address: string;
    start_location: { lat: number; lng: number };
    end_location: { lat: number; lng: number };
  }>;
  overview_polyline: {
    points: string;
  };
}

interface DirectionsResponse {
  routes: DirectionsRoute[];
  status: string;
  error_message?: string;
}

/**
 * Get directions between two points
 *
 * @param origin - Starting point (address or coordinates)
 * @param destination - Ending point (address or coordinates)
 * @param mode - Travel mode ('driving', 'walking', 'bicycling', 'transit')
 * @returns Promise with directions
 */
export async function getDirections(
  origin: string,
  destination: string,
  mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): Promise<DirectionsRoute[]> {
  const response = await secureMapsRequest<DirectionsResponse>(
    GOOGLE_MAPS_ENDPOINTS.DIRECTIONS,
    {
      origin,
      destination,
      mode,
    }
  );

  return response.routes;
}

/**
 * Calculate distance and duration between multiple points
 *
 * @param origins - Array of origin addresses or coordinates
 * @param destinations - Array of destination addresses or coordinates
 * @param mode - Travel mode
 * @returns Promise with distance matrix
 */
export async function getDistanceMatrix(
  origins: string[],
  destinations: string[],
  mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): Promise<any> {
  const response = await secureMapsRequest<any>(
    GOOGLE_MAPS_ENDPOINTS.DISTANCE_MATRIX,
    {
      origins: origins.join('|'),
      destinations: destinations.join('|'),
      mode,
    }
  );

  return response;
}

/**
 * Helper: Format coordinates for Google Maps API
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude},${longitude}`;
}

/**
 * Helper: Check if Google Maps API is configured
 */
export function isGoogleMapsConfigured(): boolean {
  return !!GOOGLE_MAPS_API_KEY;
}

/**
 * Export for testing in development only
 */
export function getApiKey_DEV_ONLY(): string | undefined {
  if (!__DEV__) {
    throw new Error('This function is only available in development mode');
  }
  return GOOGLE_MAPS_API_KEY;
}
