/**
 * Review Controller
 * Handles review management and response generation
 */

const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const ContentService = require('../services/contentService');

/**
 * Validation for creating a review
 */
const reviewValidation = [
  body('reviewerName').optional().trim(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('reviewText').trim().notEmpty().withMessage('Review text required')
];

/**
 * Get reviews for a location
 * GET /api/locations/:locationId/reviews
 */
function getReviews(req, res) {
  try {
    const { pending } = req.query;
    
    let reviews;
    if (pending === 'true') {
      reviews = Review.findPendingResponses(req.location.id);
    } else {
      reviews = Review.findByLocationId(req.location.id);
    }

    const stats = Review.getStats(req.location.id);

    res.json({
      reviews,
      stats,
      total: reviews.length
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}

/**
 * Add a review
 * POST /api/locations/:locationId/reviews
 */
function addReview(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reviewerName, rating, reviewText } = req.body;

    const review = Review.create({
      locationId: req.location.id,
      reviewerName,
      rating,
      reviewText
    });

    res.status(201).json({
      message: 'Review added',
      review
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
}

/**
 * Generate a response for a review
 * POST /api/locations/:locationId/reviews/:reviewId/generate-response
 */
async function generateResponse(req, res) {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const review = Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.location_id !== req.location.id) {
      return res.status(403).json({ error: 'Review does not belong to this location' });
    }

    const { tone } = req.body;
    const contentService = new ContentService();

    const result = await contentService.generateReviewResponse(req.location.id, {
      reviewerName: review.reviewer_name,
      rating: review.rating,
      reviewText: review.review_text,
      tone: tone || 'professional'
    });

    res.json({
      message: 'Response generated',
      response: result.response,
      tokensUsed: result.tokensUsed,
      review
    });
  } catch (error) {
    console.error('Generate response error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate response' });
  }
}

/**
 * Save a response to a review
 * PUT /api/locations/:locationId/reviews/:reviewId/response
 */
function saveResponse(req, res) {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const review = Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.location_id !== req.location.id) {
      return res.status(403).json({ error: 'Review does not belong to this location' });
    }

    const { responseText } = req.body;
    if (!responseText || !responseText.trim()) {
      return res.status(400).json({ error: 'Response text required' });
    }

    const updated = Review.addResponse(reviewId, responseText.trim());

    res.json({
      message: 'Response saved',
      review: updated
    });
  } catch (error) {
    console.error('Save response error:', error);
    res.status(500).json({ error: 'Failed to save response' });
  }
}

/**
 * Delete a review
 * DELETE /api/locations/:locationId/reviews/:reviewId
 */
function deleteReview(req, res) {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const review = Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.location_id !== req.location.id) {
      return res.status(403).json({ error: 'Review does not belong to this location' });
    }

    Review.delete(reviewId);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
}

module.exports = {
  getReviews,
  addReview,
  generateResponse,
  saveResponse,
  deleteReview,
  reviewValidation
};
