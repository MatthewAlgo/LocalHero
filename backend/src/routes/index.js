/**
 * API Routes
 * Defines all API endpoints for LocalHero
 */

const express = require('express');
const router = express.Router();

// Middleware
const { authenticate, authorizeLocation } = require('../middleware/auth');

// Controllers
const authController = require('../controllers/authController');
const locationController = require('../controllers/locationController');
const contentController = require('../controllers/contentController');
const reviewController = require('../controllers/reviewController');
const auditController = require('../controllers/auditController');

// ============================================================
// Auth Routes (Public)
// ============================================================
router.post('/auth/register', authController.registerValidation, authController.register);
router.post('/auth/login', authController.loginValidation, authController.login);

// Auth Routes (Protected)
router.get('/auth/me', authenticate, authController.getProfile);
router.put('/auth/me', authenticate, authController.updateProfile);

// ============================================================
// Location Routes
// ============================================================
router.get('/locations', authenticate, locationController.getLocations);
router.post('/locations', authenticate, locationController.locationValidation, locationController.createLocation);
router.get('/locations/:id', authenticate, authorizeLocation, locationController.getLocation);
router.put('/locations/:id', authenticate, authorizeLocation, locationController.locationValidation, locationController.updateLocation);
router.delete('/locations/:id', authenticate, authorizeLocation, locationController.deleteLocation);

// Landmark Routes
router.get('/locations/:id/landmarks', authenticate, authorizeLocation, locationController.getLandmarks);
router.post('/locations/:id/refresh-landmarks', authenticate, authorizeLocation, locationController.refreshLandmarks);

// ============================================================
// Content Routes
// ============================================================
router.get('/locations/:locationId/content', authenticate, authorizeLocation, contentController.getContentHistory);
router.post('/locations/:locationId/content/gbp-post', authenticate, authorizeLocation, contentController.generateGBPPost);
router.post('/locations/:locationId/content/location-page', authenticate, authorizeLocation, contentController.generateLocationPage);
router.post('/locations/:locationId/content/social-posts', authenticate, authorizeLocation, contentController.generateSocialPosts);

// Content item routes
router.get('/content/:id', authenticate, contentController.getContent);
router.delete('/content/:id', authenticate, contentController.deleteContent);
router.patch('/content/:id/status', authenticate, contentController.updateContentStatus);

// ============================================================
// Review Routes
// ============================================================
router.get('/locations/:locationId/reviews', authenticate, authorizeLocation, reviewController.getReviews);
router.post('/locations/:locationId/reviews', authenticate, authorizeLocation, reviewController.reviewValidation, reviewController.addReview);
router.post('/locations/:locationId/reviews/:reviewId/generate-response', authenticate, authorizeLocation, reviewController.generateResponse);
router.put('/locations/:locationId/reviews/:reviewId/response', authenticate, authorizeLocation, reviewController.saveResponse);
router.delete('/locations/:locationId/reviews/:reviewId', authenticate, authorizeLocation, reviewController.deleteReview);

// ============================================================
// Audit/Citation Routes
// ============================================================
router.get('/locations/:locationId/citations', authenticate, authorizeLocation, auditController.getCitations);
router.put('/locations/:locationId/citations/:citationId', authenticate, authorizeLocation, auditController.updateCitation);
router.get('/locations/:locationId/audit-summary', authenticate, authorizeLocation, auditController.getAuditSummary);
router.post('/locations/:locationId/citations/initialize', authenticate, authorizeLocation, auditController.initializeCitations);

// ============================================================
// Health Check
// ============================================================
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
