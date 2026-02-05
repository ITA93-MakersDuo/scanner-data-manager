import pool from './database';

const migrations = [
  `CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS scans (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    object_name TEXT NOT NULL,
    scan_date DATE,
    notes TEXT,
    scanner_model TEXT,
    resolution TEXT,
    accuracy TEXT,
    file_path TEXT NOT NULL,
    file_format TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    thumbnail_path TEXT,
    current_version INTEGER DEFAULT 1,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS scan_tags (
    scan_id INTEGER NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (scan_id, tag_id)
  )`,

  `CREATE TABLE IF NOT EXISTS scan_versions (
    id SERIAL PRIMARY KEY,
    scan_id INTEGER NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    change_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_scans_project ON scans(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_scans_scan_date ON scans(scan_date)`,
  `CREATE INDEX IF NOT EXISTS idx_scans_object_name ON scans(object_name)`,
  `CREATE INDEX IF NOT EXISTS idx_scan_versions_scan ON scan_versions(scan_id)`,
];

async function runMigrations() {
  console.log('Running migrations...');

  for (const migration of migrations) {
    try {
      await pool.query(migration);
      console.log('✓ Migration executed successfully');
    } catch (error) {
      console.error('✗ Migration failed:', error);
      throw error;
    }
  }

  console.log('All migrations completed successfully!');
  await pool.end();
}

runMigrations().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
