const db = require('../config/database');

class User {
  static create({ email, passwordHash, companyName = null }) {
    const result = db.run(
      `INSERT INTO users (email, password_hash, company_name) VALUES (?, ?, ?)`,
      [email, passwordHash, companyName]
    );
    
    // Get the newly created user by email since lastInsertRowid may be unreliable
    const user = db.get('SELECT * FROM users WHERE email = ?', [email]);
    return user;
  }

  static findById(id) {
    return db.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  static findByEmail(email) {
    return db.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  static update(id, { companyName, plan }) {
    const updates = [];
    const values = [];

    if (companyName !== undefined) {
      updates.push('company_name = ?');
      values.push(companyName);
    }
    if (plan !== undefined) {
      updates.push('plan = ?');
      values.push(plan);
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static delete(id) {
    return db.run('DELETE FROM users WHERE id = ?', [id]);
  }

  static getLocationCount(userId) {
    const result = db.get('SELECT COUNT(*) as count FROM locations WHERE user_id = ?', [userId]);
    return result ? result.count : 0;
  }
}

module.exports = User;
