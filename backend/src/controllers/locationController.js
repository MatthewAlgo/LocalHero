/**
 * Location Controller
 * Handles location CRUD and landmark management
 */

const { body, validationResult } = require('express-validator');
const Location = require('../models/Location');
const Landmark = require('../models/Landmark');
const Citation = require('../models/Citation');
const ContentService = require('../services/contentService');

/**
 * Validation rules for creating/updating locations
 */
const locationValidation = [
  body('businessName').trim().notEmpty().withMessage('Business name required'),
  body('address').trim().notEmpty().withMessage('Address required'),
  body('city').trim().notEmpty().withMessage('City required'),
  body('state').trim().notEmpty().isLength({ min: 2, max: 2 }).withMessage('State required (2 letter code)'),
  body('zipCode').trim().notEmpty().withMessage('ZIP code required'),
  body('serviceType').trim().notEmpty().withMessage('Service type required'),
  body('keywords').optional().trim(),
  body('radiusMiles').optional().isFloat({ min: 1, max: 50 })
];

/**
 * Get all locations for current user
 * GET /api/locations
 */
function getLocations(req, res) {
  try {
    const locations = Location.findByUserId(req.user.id);
    
    // Add stats for each location
    const locationsWithStats = locations.map(loc => ({
      ...loc,
      stats: Location.getStats(loc.id)
    }));

    res.json({ locations: locationsWithStats });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
}

/**
 * Get a single location
 * GET /api/locations/:id
 */
function getLocation(req, res) {
  try {
    const location = req.location; // Set by authorizeLocation middleware
    const stats = Location.getStats(location.id);
    const landmarks = Landmark.findByLocationId(location.id);
    const landmarkTypes = Landmark.getTypes(location.id);
    const cacheAge = Landmark.getCacheAge(location.id);

    res.json({
      location,
      stats,
      landmarks: {
        items: landmarks,
        types: landmarkTypes,
        cacheAgeDays: cacheAge
      }
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
}

/**
 * Create a new location
 * POST /api/locations
 */
async function createLocation(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { businessName, address, city, state, zipCode, serviceType, keywords, radiusMiles } = req.body;

    const location = Location.create({
      userId: req.user.id,
      businessName,
      address,
      city,
      state: state.toUpperCase(),
      zipCode,
      serviceType,
      keywords,
      radiusMiles: radiusMiles || 5
    });

    // Initialize citation checklist
    Citation.initializeForLocation(location.id);

    res.status(201).json({
      message: 'Location created',
      location,
      nextStep: 'Fetch landmarks to enable content generation'
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
}

/**
 * Update a location
 * PUT /api/locations/:id
 */
function updateLocation(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const location = Location.update(req.location.id, req.body);

    res.json({
      message: 'Location updated',
      location
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
}

/**
 * Delete a location
 * DELETE /api/locations/:id
 */
function deleteLocation(req, res) {
  try {
    Location.delete(req.location.id);
    res.json({ message: 'Location deleted' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
}

/**
 * Refresh landmarks for a location
 * POST /api/locations/:id/refresh-landmarks
 */
async function refreshLandmarks(req, res) {
  try {
    const contentService = new ContentService();
    const result = await contentService.refreshLandmarks(req.location.id);

    res.json({
      message: 'Landmarks refreshed',
      ...result
    });
  } catch (error) {
    console.error('Refresh landmarks error:', error);
    res.status(500).json({ error: error.message || 'Failed to refresh landmarks' });
  }
}

/**
 * Get landmarks for a location
 * GET /api/locations/:id/landmarks
 */
function getLandmarks(req, res) {
  try {
    const landmarks = Landmark.findByLocationId(req.location.id);
    const types = Landmark.getTypes(req.location.id);
    const cacheAge = Landmark.getCacheAge(req.location.id);

    res.json({
      landmarks,
      types,
      cacheAgeDays: cacheAge,
      total: landmarks.length
    });
  } catch (error) {
    console.error('Get landmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch landmarks' });
  }
}

module.exports = {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  refreshLandmarks,
  getLandmarks,
  locationValidation
};
