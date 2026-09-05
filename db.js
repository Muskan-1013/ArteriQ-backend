const Database = require("better-sqlite3");
const path = require("path");

// SQLite file lives alongside this script. On a VPS/Render/Railway this
// persists across restarts as long as the disk is persistent. On pure
// serverless platforms (e.g. Vercel Functions) this file will NOT persist
// between invocations -- swap this out for a hosted Postgres/MySQL instance
// (e.g. Supabase, Neon, PlanetScale) if you go that route.
const db = new Database(path.join(__dirname, "arteriq.db"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    report_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

module.exports = db;
