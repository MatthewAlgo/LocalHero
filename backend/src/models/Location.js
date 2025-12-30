const db = require('../config/database');

class Location {
  static create({ userId, businessName, address, city, state, zipCode, serviceType, keywords = null, latitude = null, longitude = null, radiusMiles = 5 }) {
    db.run(
      `INSERT INTO locations (user_id, business_name, address, city, state, zip_code, service_type, keywords, latitude, longitude, radius_miles)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, businessName, address, city, state, zipCode, serviceType, keywords, latitude, longitude, radiusMiles]
    );
    // Get the newly created location by MAX(id) which is the most recently inserted
    const location = db.get('SELECT * FROM locations WHERE id = (SELECT MAX(id) FROM locations WHERE user_id = ?)', [userId]);
    return location;
  }

  static findById(id) {
    return db.get('SELECT * FROM locations WHERE id = ?', [id]);
  }

  static findByUserId(userId) {
    return db.all('SELECT * FROM locations WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  }

  static update(id, updates) {
    const fieldMap = {
      businessName: 'business_name',
      address: 'address',
      city: 'city',
      state: 'state',
      zipCode: 'zip_code',
      serviceType: 'service_type',
      keywords: 'keywords',
      latitude: 'latitude',
      longitude: 'longitude',
      radiusMiles: 'radius_miles'
    };

    const setClauses = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key];
      if (dbField && value !== undefined) {
        setClauses.push(`${dbField} = ?`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.run(`UPDATE locations SET ${setClauses.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static delete(id) {
    return db.run('DELETE FROM locations WHERE id = ?', [id]);
  }

  static getStats(locationId) {
    const landmarkResult = db.get('SELECT COUNT(*) as count FROM landmarks WHERE location_id = ?', [locationId]);
    const contentResult = db.get('SELECT COUNT(*) as count FROM content WHERE location_id = ?', [locationId]);
    const reviewResult = db.get('SELECT COUNT(*) as count FROM reviews WHERE location_id = ?', [locationId]);
    
    return { 
      landmarkCount: landmarkResult?.count || 0, 
      contentCount: contentResult?.count || 0, 
      reviewCount: reviewResult?.count || 0 
    };
  }
}

module.exports = Location;
