const db = require('../config/database');

class Landmark {
  static bulkCreate(locationId, landmarks) {
    // Delete existing landmarks first
    db.run('DELETE FROM landmarks WHERE location_id = ?', [locationId]);
    
    // Insert new landmarks
    for (const landmark of landmarks) {
      db.run(
        `INSERT INTO landmarks (location_id, place_id, name, type, category, address, latitude, longitude, rating, user_ratings_total, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          locationId,
          landmark.placeId,
          landmark.name,
          landmark.type,
          landmark.category || null,
          landmark.address || null,
          landmark.latitude || null,
          landmark.longitude || null,
          landmark.rating || null,
          landmark.userRatingsTotal || null
        ]
      );
    }

    return this.findByLocationId(locationId);
  }

  static findByLocationId(locationId) {
    return db.all('SELECT * FROM landmarks WHERE location_id = ? ORDER BY type, name', [locationId]);
  }

  static findByType(locationId, type) {
    return db.all('SELECT * FROM landmarks WHERE location_id = ? AND type = ? ORDER BY name', [locationId, type]);
  }

  static getRandomByType(locationId, type, limit = 3) {
    return db.all(
      `SELECT * FROM landmarks WHERE location_id = ? AND type = ? ORDER BY RANDOM() LIMIT ?`,
      [locationId, type, limit]
    );
  }

  static getRandomMix(locationId, limit = 5) {
    return db.all(
      `SELECT * FROM landmarks WHERE location_id = ? ORDER BY RANDOM() LIMIT ?`,
      [locationId, limit]
    );
  }

  static deleteByLocationId(locationId) {
    return db.run('DELETE FROM landmarks WHERE location_id = ?', [locationId]);
  }

  static getCacheAge(locationId) {
    const result = db.get(
      `SELECT MIN(cached_at) as oldest_cache FROM landmarks WHERE location_id = ?`,
      [locationId]
    );
    if (!result || !result.oldest_cache) return null;
    
    const cacheDate = new Date(result.oldest_cache);
    const now = new Date();
    const diffDays = Math.floor((now - cacheDate) / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  static getTypes(locationId) {
    return db.all(
      `SELECT type, COUNT(*) as count FROM landmarks WHERE location_id = ? GROUP BY type ORDER BY count DESC`,
      [locationId]
    );
  }
}

module.exports = Landmark;
