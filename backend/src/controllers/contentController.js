/**
 * Content Controller
 * Handles content generation endpoints
 */

const { body, validationResult } = require('express-validator');
const Content = require('../models/Content');
const ContentService = require('../services/contentService');

/**
 * Generate a GBP post
 * POST /api/locations/:locationId/content/gbp-post
 */
async function generateGBPPost(req, res) {
  try {
    const { tone } = req.body;
    const contentService = new ContentService();
    
    const result = await contentService.generateGBPPost(req.location.id, { tone });

    res.status(201).json({
      message: 'GBP post generated',
      content: result.content,
      tokensUsed: result.tokensUsed
    });
  } catch (error) {
    console.error('Generate GBP post error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate GBP post' });
  }
}

/**
 * Generate a location page
 * POST /api/locations/:locationId/content/location-page
 */
async function generateLocationPage(req, res) {
  try {
    const contentService = new ContentService();
    const result = await contentService.generateLocationPage(req.location.id);

    res.status(201).json({
      message: 'Location page generated',
      content: result.content,
      tokensUsed: result.tokensUsed
    });
  } catch (error) {
    console.error('Generate location page error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate location page' });
  }
}

/**
 * Generate social media posts
 * POST /api/locations/:locationId/content/social-posts
 */
async function generateSocialPosts(req, res) {
  try {
    const { count } = req.body;
    const contentService = new ContentService();
    const result = await contentService.generateSocialPosts(req.location.id, count || 3);

    res.status(201).json({
      message: 'Social posts generated',
      content: result.content,
      tokensUsed: result.tokensUsed
    });
  } catch (error) {
    console.error('Generate social posts error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate social posts' });
  }
}

/**
 * Get content history for a location
 * GET /api/locations/:locationId/content
 */
function getContentHistory(req, res) {
  try {
    const { type, limit } = req.query;
    
    let content;
    if (type) {
      content = Content.findByType(req.location.id, type, parseInt(limit) || 20);
    } else {
      content = Content.findByLocationId(req.location.id, parseInt(limit) || 50);
    }

    const stats = Content.getStats(req.location.id);

    res.json({
      content,
      stats,
      total: content.length
    });
  } catch (error) {
    console.error('Get content history error:', error);
    res.status(500).json({ error: 'Failed to fetch content history' });
  }
}

/**
 * Get a specific content item
 * GET /api/content/:id
 */
function getContent(req, res) {
  try {
    const content = Content.findById(parseInt(req.params.id));
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Verify ownership through location
    const Location = require('../models/Location');
    const location = Location.findById(content.location_id);
    
    if (!location || location.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ content });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
}

/**
 * Delete content
 * DELETE /api/content/:id
 */
function deleteContent(req, res) {
  try {
    const content = Content.findById(parseInt(req.params.id));
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const Location = require('../models/Location');
    const location = Location.findById(content.location_id);
    
    if (!location || location.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    Content.delete(content.id);
    res.json({ message: 'Content deleted' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
}

/**
 * Update content status
 * PATCH /api/content/:id/status
 */
function updateContentStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'posted', 'scheduled', 'archived'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const content = Content.findById(parseInt(req.params.id));
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const Location = require('../models/Location');
    const location = Location.findById(content.location_id);
    
    if (!location || location.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = Content.updateStatus(content.id, status);
    res.json({ message: 'Status updated', content: updated });
  } catch (error) {
    console.error('Update content status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
}

module.exports = {
  generateGBPPost,
  generateLocationPage,
  generateSocialPosts,
  getContentHistory,
  getContent,
  deleteContent,
  updateContentStatus
};
