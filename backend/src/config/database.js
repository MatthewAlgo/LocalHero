const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// Database singleton
let db = null;
let dbReady = false;
let initPromise = null;

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'localhero.db');

// SQL to initialize schema
const initSchemaSql = `
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    company_name TEXT,
    plan TEXT DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Locations table
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    business_name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    service_type TEXT NOT NULL,
    keywords TEXT,
    latitude REAL,
    longitude REAL,
    radius_miles REAL DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Cached landmarks from Google Places
  CREATE TABLE IF NOT EXISTS landmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    place_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    rating REAL,
    user_ratings_total INTEGER,
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
  );

  -- Generated content
  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    title TEXT,
    body TEXT NOT NULL,
    landmarks_used TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
  );

  -- Reviews for response generation
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    reviewer_name TEXT,
    rating INTEGER,
    review_text TEXT NOT NULL,
    response_text TEXT,
    responded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
  );

  -- Citation audit results
  CREATE TABLE IF NOT EXISTS citations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    directory_name TEXT NOT NULL,
    directory_url TEXT,
    status TEXT DEFAULT 'unchecked',
    nap_consistent INTEGER DEFAULT 0,
    last_checked DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_locations_user ON locations(user_id);
  CREATE INDEX IF NOT EXISTS idx_landmarks_location ON landmarks(location_id);
  CREATE INDEX IF NOT EXISTS idx_content_location ON content(location_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_location ON reviews(location_id);
`;

// Initialize the database
async function initDatabase() {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    const SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
    
    // Initialize schema
    db.run(initSchemaSql);
    
    // Save to file
    saveDatabase();
    
    dbReady = true;
    console.log('Database initialized');
    return db;
  })();
  
  return initPromise;
}

// Save database to file
function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Get database instance (synchronous, throws if not ready)
function getDb() {
  if (!db || !dbReady) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Helper to run a query and save
function run(sql, params = []) {
  const database = getDb();
  database.run(sql, params);
  saveDatabase();
  
  // Get last insert id
  const result = database.exec('SELECT last_insert_rowid() as id');
  return { 
    lastInsertRowid: result.length > 0 ? result[0].values[0][0] : null,
    changes: database.getRowsModified()
  };
}

// Helper to get single row
function get(sql, params = []) {
  const database = getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  
  if (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    stmt.free();
    
    const row = {};
    columns.forEach((col, i) => row[col] = values[i]);
    return row;
  }
  
  stmt.free();
  return undefined;
}

// Helper to get all rows
function all(sql, params = []) {
  const database = getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  
  const results = [];
  const columns = stmt.getColumnNames();
  
  while (stmt.step()) {
    const values = stmt.get();
    const row = {};
    columns.forEach((col, i) => row[col] = values[i]);
    results.push(row);
  }
  
  stmt.free();
  return results;
}

// Export API compatible with better-sqlite3 style usage
module.exports = {
  initDatabase,
  getDb,
  run,
  get,
  all,
  saveDatabase,
  // For compatibility
  exec: (sql) => {
    const database = getDb();
    database.run(sql);
    saveDatabase();
  }
};
