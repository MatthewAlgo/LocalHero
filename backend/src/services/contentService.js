/**
 * Content Service
 * Orchestrates landmark fetching and content generation
 */

const { createPlacesService } = require('./placesService');
const { createGeminiService } = require('./geminiService');
const Landmark = require('../models/Landmark');
const Content = require('../models/Content');
const Location = require('../models/Location');

class ContentService {
  constructor() {
    this.placesService = createPlacesService();
    this.geminiService = createGeminiService();
  }

  /**
   * Fetch and cache landmarks for a location
   */
  async refreshLandmarks(locationId) {
    const location = Location.findById(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    // Geocode if needed
    let latitude = location.latitude;
    let longitude = location.longitude;

    if (!latitude || !longitude) {
      const geo = await this.placesService.geocodeAddress(
        location.address,
        location.city,
        location.state,
        location.zip_code
      );
      latitude = geo.latitude;
      longitude = geo.longitude;

      // Update location with coordinates
      Location.update(locationId, { latitude, longitude });
    }

    // Fetch landmarks
    const result = await this.placesService.fetchAllLandmarks(
      latitude,
      longitude,
      location.radius_miles || 5
    );

    // Clear old landmarks and save new ones
    Landmark.deleteByLocationId(locationId);
    Landmark.bulkCreate(locationId, result.landmarks);

    return {
      location: Location.findById(locationId),
      landmarks: Landmark.findByLocationId(locationId),
      stats: result.stats,
      errors: result.errors
    };
  }

  /**
   * Generate a GBP post for a location
   */
  async generateGBPPost(locationId, options = {}) {
    const location = Location.findById(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    // Get random landmarks for variety
    const landmarks = Landmark.getRandomMix(locationId, 5);
    if (landmarks.length === 0) {
      throw new Error('No landmarks cached. Please refresh landmarks first.');
    }

    const result = await this.geminiService.generateGBPPost({
      businessName: location.business_name,
      serviceType: location.service_type,
      city: location.city,
      state: location.state,
      landmarks,
      keywords: location.keywords ? location.keywords.split(',').map(k => k.trim()) : [],
      tone: options.tone || 'professional'
    });

    // Save the generated content
    const content = Content.create({
      locationId,
      contentType: 'gbp_post',
      title: `GBP Post - ${new Date().toLocaleDateString()}`,
      body: result.content,
      landmarksUsed: result.landmarksUsed
    });

    return {
      content,
      tokensUsed: result.tokensUsed
    };
  }

  /**
   * Generate a location page
   */
  async generateLocationPage(locationId) {
    const location = Location.findById(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    const landmarks = Landmark.getRandomMix(locationId, 8);
    if (landmarks.length === 0) {
      throw new Error('No landmarks cached. Please refresh landmarks first.');
    }

    const result = await this.geminiService.generateLocationPage({
      businessName: location.business_name,
      serviceType: location.service_type,
      city: location.city,
      state: location.state,
      zipCode: location.zip_code,
      landmarks,
      keywords: location.keywords ? location.keywords.split(',').map(k => k.trim()) : []
    });

    const content = Content.create({
      locationId,
      contentType: 'location_page',
      title: `${location.service_type} in ${location.city}, ${location.state}`,
      body: result.content,
      landmarksUsed: result.landmarksUsed
    });

    return {
      content,
      tokensUsed: result.tokensUsed
    };
  }

  /**
   * Generate a review response
   */
  async generateReviewResponse(locationId, reviewData) {
    const location = Location.findById(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    const result = await this.geminiService.generateReviewResponse({
      businessName: location.business_name,
      serviceType: location.service_type,
      reviewerName: reviewData.reviewerName,
      rating: reviewData.rating,
      reviewText: reviewData.reviewText,
      tone: reviewData.tone || 'professional'
    });

    return {
      response: result.response,
      tokensUsed: result.tokensUsed
    };
  }

  /**
   * Generate social media posts
   */
  async generateSocialPosts(locationId, count = 3) {
    const location = Location.findById(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    const landmarks = Landmark.getRandomMix(locationId, 5);
    
    const result = await this.geminiService.generateSocialPosts({
      businessName: location.business_name,
      serviceType: location.service_type,
      city: location.city,
      landmarks,
      count
    });

    const content = Content.create({
      locationId,
      contentType: 'social_posts',
      title: `Social Posts - ${new Date().toLocaleDateString()}`,
      body: result.posts,
      landmarksUsed: landmarks.map(l => l.name)
    });

    return {
      content,
      tokensUsed: result.tokensUsed
    };
  }
}

module.exports = ContentService;
