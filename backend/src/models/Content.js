const db = require('../config/database');

class Content {
  static create({ locationId, contentType, title, body, landmarksUsed = null }) {
    const landmarksJson = landmarksUsed ? JSON.stringify(landmarksUsed) : null;
    const result = db.run(
      `INSERT INTO content (location_id, content_type, title, body, landmarks_used) VALUES (?, ?, ?, ?, ?)`,
      [locationId, contentType, title, body, landmarksJson]
    );
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const result = db.get('SELECT * FROM content WHERE id = ?', [id]);
    if (result && result.landmarks_used) {
      try {
        result.landmarks_used = JSON.parse(result.landmarks_used);
      } catch (e) {
        result.landmarks_used = null;
      }
    }
    return result;
  }

  static findByLocationId(locationId, limit = 50) {
    const results = db.all(
      `SELECT * FROM content WHERE location_id = ? ORDER BY created_at DESC LIMIT ?`,
      [locationId, limit]
    );
    return results.map(r => {
      if (r.landmarks_used) {
        try {
          r.landmarks_used = JSON.parse(r.landmarks_used);
        } catch (e) {
          r.landmarks_used = null;
        }
      }
      return r;
    });
  }

  static findByType(locationId, contentType, limit = 20) {
    const results = db.all(
      `SELECT * FROM content WHERE location_id = ? AND content_type = ? ORDER BY created_at DESC LIMIT ?`,
      [locationId, contentType, limit]
    );
    return results.map(r => {
      if (r.landmarks_used) {
        try {
          r.landmarks_used = JSON.parse(r.landmarks_used);
        } catch (e) {
          r.landmarks_used = null;
        }
      }
      return r;
    });
  }

  static updateStatus(id, status) {
    db.run('UPDATE content SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }

  static delete(id) {
    return db.run('DELETE FROM content WHERE id = ?', [id]);
  }

  static getStats(locationId) {
    return db.all(
      `SELECT content_type, COUNT(*) as count FROM content WHERE location_id = ? GROUP BY content_type`,
      [locationId]
    );
  }
}

module.exports = Content;
