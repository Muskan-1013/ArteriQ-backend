const fs = require("fs");
const path = require("path");

// Simple JSON-file-backed storage -- no native compilation required, works
// identically on any OS. Data persists in arteriq-db.json next to this file.
// Not meant for high concurrency/production scale, but fine for a small app.
const DB_FILE = path.join(__dirname, "arteriq-db.json");

function loadData() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    } catch {
      // Fall through to a fresh DB if the file is corrupted/unreadable.
    }
  }
  return { users: [], sessions: [], reports: [], nextReportId: 1 };
}

const data = loadData();

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = { data, save };