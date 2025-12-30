/**
 * Audit Controller
 * Handles citation audit functionality
 */

const Citation = require('../models/Citation');

/**
 * Get citation audit for a location
 * GET /api/locations/:locationId/citations
 */
function getCitations(req, res) {
  try {
    const citations = Citation.findByLocationId(req.location.id);
    const summary = Citation.getAuditSummary(req.location.id);

    // Calculate audit score
    const score = calculateAuditScore(summary);

    res.json({
      citations,
      summary,
      score,
      directories: Citation.getDirectories()
    });
  } catch (error) {
    console.error('Get citations error:', error);
    res.status(500).json({ error: 'Failed to fetch citations' });
  }
}

/**
 * Update citation status
 * PUT /api/locations/:locationId/citations/:citationId
 */
function updateCitation(req, res) {
  try {
    const citationId = parseInt(req.params.citationId);
    const citation = Citation.findById(citationId);

    if (!citation) {
      return res.status(404).json({ error: 'Citation not found' });
    }

    // Verify it belongs to the location
    const Location = require('../models/Location');
    const location = Location.findById(citation.location_id);
    
    if (!location || location.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { status, napConsistent } = req.body;
    const validStatuses = ['found', 'missing', 'unchecked', 'pending'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = Citation.updateStatus(citationId, { status, napConsistent });

    res.json({
      message: 'Citation updated',
      citation: updated
    });
  } catch (error) {
    console.error('Update citation error:', error);
    res.status(500).json({ error: 'Failed to update citation' });
  }
}

/**
 * Get audit summary for dashboard
 * GET /api/locations/:locationId/audit-summary
 */
function getAuditSummary(req, res) {
  try {
    const summary = Citation.getAuditSummary(req.location.id);
    const score = calculateAuditScore(summary);

    // Get priority citations that are missing
    const citations = Citation.findByLocationId(req.location.id);
    const missingPriority = citations
      .filter(c => c.status === 'missing')
      .slice(0, 5);

    res.json({
      summary,
      score,
      missingPriority,
      recommendations: generateRecommendations(summary, citations)
    });
  } catch (error) {
    console.error('Get audit summary error:', error);
    res.status(500).json({ error: 'Failed to fetch audit summary' });
  }
}

/**
 * Initialize citations for a location (usually done on location create)
 * POST /api/locations/:locationId/citations/initialize
 */
function initializeCitations(req, res) {
  try {
    const citations = Citation.initializeForLocation(req.location.id);

    res.json({
      message: 'Citations initialized',
      citations,
      total: citations.length
    });
  } catch (error) {
    console.error('Initialize citations error:', error);
    res.status(500).json({ error: 'Failed to initialize citations' });
  }
}

/**
 * Calculate audit score (0-100)
 */
function calculateAuditScore(summary) {
  if (!summary || summary.total === 0) return 0;

  const foundWeight = 0.6;
  const consistentWeight = 0.4;

  const foundScore = (summary.found / summary.total) * 100 * foundWeight;
  const consistentScore = summary.found > 0 
    ? (summary.consistent / summary.found) * 100 * consistentWeight 
    : 0;

  return Math.round(foundScore + consistentScore);
}

/**
 * Generate recommendations based on audit
 */
function generateRecommendations(summary, citations) {
  const recommendations = [];

  if (summary.missing > 0) {
    recommendations.push({
      priority: 'high',
      message: `You're missing from ${summary.missing} directories. Add your business to increase visibility.`,
      action: 'Add to missing directories'
    });
  }

  if (summary.found > 0 && summary.consistent < summary.found) {
    const inconsistent = summary.found - summary.consistent;
    recommendations.push({
      priority: 'high',
      message: `${inconsistent} listings have inconsistent NAP data. This hurts your local SEO.`,
      action: 'Fix NAP consistency'
    });
  }

  if (summary.unchecked > 0) {
    recommendations.push({
      priority: 'medium',
      message: `${summary.unchecked} directories haven't been checked. Review your presence.`,
      action: 'Audit unchecked directories'
    });
  }

  // Check for priority directories
  const priorityDirectories = ['Google Business Profile', 'Yelp', 'Facebook Business', 'Apple Maps'];
  const missingPriority = citations
    .filter(c => priorityDirectories.includes(c.directory_name) && c.status === 'missing');

  if (missingPriority.length > 0) {
    recommendations.push({
      priority: 'critical',
      message: `You're missing from key directories: ${missingPriority.map(c => c.directory_name).join(', ')}`,
      action: 'Add to priority directories immediately'
    });
  }

  return recommendations;
}

module.exports = {
  getCitations,
  updateCitation,
  getAuditSummary,
  initializeCitations
};
