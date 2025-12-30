const db = require('../config/database');

class Review {
  static create({ locationId, reviewerName, rating, reviewText }) {
    const result = db.run(
      `INSERT INTO reviews (location_id, reviewer_name, rating, review_text) VALUES (?, ?, ?, ?)`,
      [locationId, reviewerName, rating, reviewText]
    );
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    return db.get('SELECT * FROM reviews WHERE id = ?', [id]);
  }

  static findByLocationId(locationId, limit = 50) {
    return db.all(
      `SELECT * FROM reviews WHERE location_id = ? ORDER BY created_at DESC LIMIT ?`,
      [locationId, limit]
    );
  }

  static findPendingResponses(locationId) {
    return db.all(
      `SELECT * FROM reviews WHERE location_id = ? AND response_text IS NULL ORDER BY created_at DESC`,
      [locationId]
    );
  }

  static addResponse(id, responseText) {
    db.run(
      `UPDATE reviews SET response_text = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [responseText, id]
    );
    return this.findById(id);
  }

  static delete(id) {
    return db.run('DELETE FROM reviews WHERE id = ?', [id]);
  }

  static getStats(locationId) {
    return db.get(
      `SELECT 
        COUNT(*) as total,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN response_text IS NOT NULL THEN 1 ELSE 0 END) as responded,
        SUM(CASE WHEN response_text IS NULL THEN 1 ELSE 0 END) as pending
      FROM reviews WHERE location_id = ?`,
      [locationId]
    );
  }
}

module.exports = Review;
