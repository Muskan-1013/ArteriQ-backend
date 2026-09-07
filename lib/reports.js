// Appends a report for the user and returns the stored record.
function saveReport(db, userId, report) {
  const createdAt = Date.now();
  const id = db.data.nextReportId++;
  db.data.reports.push({ id, user_id: userId, report, created_at: createdAt });
  db.save();
  return { id, report, createdAt };
}

// Returns all reports saved by the user, newest first.
function listReports(db, userId) {
  return db.data.reports
    .filter((r) => r.user_id === userId)
    .sort((a, b) => b.created_at - a.created_at)
    .map((r) => ({ id: r.id, report: r.report, createdAt: r.created_at }));
}

module.exports = { saveReport, listReports };