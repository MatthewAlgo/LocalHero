/**
 * Google Places API Service
 * Fetches local landmarks, schools, parks, and points of interest
 */

const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Place types to fetch for local SEO content
const PLACE_TYPES = [
  { type: 'school', category: 'education' },
  { type: 'park', category: 'recreation' },
  { type: 'museum', category: 'culture' },
  { type: 'library', category: 'education' },
  { type: 'shopping_mall', category: 'shopping' },
  { type: 'restaurant', category: 'dining' },
  { type: 'hospital', category: 'healthcare' },
  { type: 'church', category: 'worship' },
  { type: 'gym', category: 'fitness' },
  { type: 'stadium', category: 'sports' },
  { type: 'university', category: 'education' },
  { type: 'city_hall', category: 'government' },
  { type: 'post_office', category: 'services' },
  { type: 'fire_station', category: 'services' },
  { type: 'police', category: 'services' },
];

class PlacesService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Geocode an address to get lat/lng coordinates
   */
  async geocodeAddress(address, city, state, zipCode) {
    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: data.results[0].formatted_address
        };
      }
      throw new Error(`Geocoding failed: ${data.status}`);
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  /**
   * Search for nearby places of a specific type
   */
  async searchNearby(latitude, longitude, radiusMeters, placeType) {
    const url = `${GOOGLE_PLACES_BASE_URL}/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusMeters}&type=${placeType}&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
        return (data.results || []).map(place => ({
          placeId: place.place_id,
          name: place.name,
          type: placeType,
          address: place.vicinity,
          latitude: place.geometry?.location?.lat,
          longitude: place.geometry?.location?.lng,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total
        }));
      }
      
      if (data.status === 'REQUEST_DENIED') {
        throw new Error('Google Places API key is invalid or has insufficient permissions');
      }
      
      throw new Error(`Places search failed: ${data.status}`);
    } catch (error) {
      console.error(`Error fetching ${placeType}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all landmark types for a location
   */
  async fetchAllLandmarks(latitude, longitude, radiusMiles = 5) {
    const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
    const allLandmarks = [];
    const errors = [];

    // Fetch each place type
    for (const { type, category } of PLACE_TYPES) {
      try {
        const places = await this.searchNearby(latitude, longitude, radiusMeters, type);
        const landmarksWithCategory = places.map(p => ({ ...p, category }));
        allLandmarks.push(...landmarksWithCategory);
        
        // Rate limiting - small delay between requests
        await this.delay(100);
      } catch (error) {
        errors.push({ type, error: error.message });
      }
    }

    // Remove duplicates by place_id
    const uniqueLandmarks = this.deduplicateLandmarks(allLandmarks);

    return {
      landmarks: uniqueLandmarks,
      errors: errors.length > 0 ? errors : null,
      stats: {
        total: uniqueLandmarks.length,
        byType: this.groupByType(uniqueLandmarks)
      }
    };
  }

  /**
   * Remove duplicate landmarks by place_id
   */
  deduplicateLandmarks(landmarks) {
    const seen = new Set();
    return landmarks.filter(landmark => {
      if (seen.has(landmark.placeId)) {
        return false;
      }
      seen.add(landmark.placeId);
      return true;
    });
  }

  /**
   * Group landmarks by type and count
   */
  groupByType(landmarks) {
    return landmarks.reduce((acc, landmark) => {
      acc[landmark.type] = (acc[landmark.type] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Simple delay helper for rate limiting
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the available place types
   */
  static getPlaceTypes() {
    return PLACE_TYPES;
  }
}

// Factory function for creating service with API key from environment
function createPlacesService() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY not set. Places service will not work.');
  }
  return new PlacesService(apiKey);
}

module.exports = { PlacesService, createPlacesService };
