const db = require('../config/database');

// Common citation directories for local businesses
const CITATION_DIRECTORIES = [
  { name: 'Google Business Profile', url: 'https://business.google.com', priority: 1 },
  { name: 'Yelp', url: 'https://yelp.com', priority: 1 },
  { name: 'Facebook Business', url: 'https://facebook.com/business', priority: 1 },
  { name: 'Apple Maps', url: 'https://mapsconnect.apple.com', priority: 1 },
  { name: 'Bing Places', url: 'https://bingplaces.com', priority: 2 },
  { name: 'Yellow Pages', url: 'https://yellowpages.com', priority: 2 },
  { name: 'BBB', url: 'https://bbb.org', priority: 2 },
  { name: 'Angi', url: 'https://angi.com', priority: 2 },
  { name: 'HomeAdvisor', url: 'https://homeadvisor.com', priority: 2 },
  { name: 'Thumbtack', url: 'https://thumbtack.com', priority: 2 },
  { name: 'Nextdoor', url: 'https://nextdoor.com', priority: 2 },
  { name: 'MapQuest', url: 'https://mapquest.com', priority: 3 },
  { name: 'Foursquare', url: 'https://foursquare.com', priority: 3 },
  { name: 'Manta', url: 'https://manta.com', priority: 3 },
  { name: 'Superpages', url: 'https://superpages.com', priority: 3 },
];

class Citation {
  static initializeForLocation(locationId) {
    for (const dir of CITATION_DIRECTORIES) {
      // Check if already exists
      const existing = db.get(
        'SELECT id FROM citations WHERE location_id = ? AND directory_name = ?',
        [locationId, dir.name]
      );
      
      if (!existing) {
        db.run(
          `INSERT INTO citations (location_id, directory_name, directory_url, status) VALUES (?, ?, ?, 'unchecked')`,
          [locationId, dir.name, dir.url]
        );
      }
    }
    return this.findByLocationId(locationId);
  }

  static findByLocationId(locationId) {
    return db.all(
      `SELECT * FROM citations WHERE location_id = ? ORDER BY directory_name`,
      [locationId]
    );
  }

  static updateStatus(id, { status, napConsistent = null }) {
    const updates = ['status = ?', 'last_checked = CURRENT_TIMESTAMP'];
    const values = [status];

    if (napConsistent !== null) {
      updates.push('nap_consistent = ?');
      values.push(napConsistent ? 1 : 0);
    }

    values.push(id);
    db.run(`UPDATE citations SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static findById(id) {
    return db.get('SELECT * FROM citations WHERE id = ?', [id]);
  }

  static getAuditSummary(locationId) {
    return db.get(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'found' THEN 1 ELSE 0 END) as found,
        SUM(CASE WHEN status = 'missing' THEN 1 ELSE 0 END) as missing,
        SUM(CASE WHEN status = 'unchecked' THEN 1 ELSE 0 END) as unchecked,
        SUM(CASE WHEN nap_consistent = 1 THEN 1 ELSE 0 END) as consistent
      FROM citations WHERE location_id = ?`,
      [locationId]
    );
  }

  static getDirectories() {
    return CITATION_DIRECTORIES;
  }
}

module.exports = Citation;
