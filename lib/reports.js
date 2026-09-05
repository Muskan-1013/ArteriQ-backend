// Appends a report for the user and returns the stored record.
function saveReport(db, userId, report) {
  const createdAt = Date.now();
  const stmt = db.prepare(
    "INSERT INTO reports (user_id, report_json, created_at) VALUES (?, ?, ?)"
  );
  const result = stmt.run(userId, JSON.stringify(report), createdAt);
  return { id: result.lastInsertRowid, report, createdAt };
}

// Returns all reports saved by the user, newest first.
function listReports(db, userId) {
  const rows = db
    .prepare(
      "SELECT id, report_json, created_at FROM reports WHERE user_id = ? ORDER BY created_at DESC"
    )
    .all(userId);
  return rows.map((row) => ({
    id: row.id,
    report: JSON.parse(row.report_json),
    createdAt: row.created_at,
  }));
}

module.exports = { saveReport, listReports };
