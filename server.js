const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const db = require("./db");
const auth = require("./lib/auth");
const reports = require("./lib/reports");
const riskAssessment = require("./lib/riskAssessment");

const app = express();
app.use(cors());
app.use(express.json());

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// --- helpers ---------------------------------------------------------

function findUserByEmail(email) {
  return db.data.users.find((u) => u.email === email);
}

function findUserById(id) {
  return db.data.users.find((u) => u.id === id);
}

function getSession(token) {
  if (!token) return null;
  const session = db.data.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (session.expires_at < Date.now()) return null;
  return session;
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return req.body?.token || req.query?.token;
}

// --- routes ------------------------------------------------------------

// POST /signup { name, email, password }
app.post("/signup", (req, res) => {
  const { name, email, password } = req.body || {};

  if (!auth.isValidEmail(email)) {
    return res.status(400).json({ error: "invalidEmail" });
  }
  if (!auth.isValidPassword(password)) {
    return res.status(400).json({ error: "weakPassword" });
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "emailTaken" });
  }

  const salt = auth.generateSalt();
  const passwordHash = auth.hashPassword(password, salt);
  const id = crypto.randomUUID();
  const createdAt = Date.now();

  db.data.users.push({ id, name, email, passwordHash, salt, createdAt });
  db.save();

  res.json({ id, name, email, createdAt });
});

// POST /login { email, password } -> { token }
app.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = findUserByEmail(email);
  if (!user) return res.status(401).json({ error: "invalidCredentials" });

  const hash = auth.hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return res.status(401).json({ error: "invalidCredentials" });
  }

  const token = auth.generateSessionToken();
  const now = Date.now();
  db.data.sessions.push({
    token,
    user_id: user.id,
    created_at: now,
    expires_at: now + SESSION_LIFETIME_MS,
  });
  db.save();

  res.json({ token });
});

// POST /logout { token }
app.post("/logout", (req, res) => {
  const token = getBearerToken(req);
  if (token) {
    db.data.sessions = db.data.sessions.filter((s) => s.token !== token);
    db.save();
  }
  res.json({ ok: true });
});

// GET /me -> current user or null
app.get("/me", (req, res) => {
  const token = getBearerToken(req);
  const session = getSession(token);
  if (!session) return res.json(null);
  const user = findUserById(session.user_id);
  if (!user) return res.json(null);
  res.json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
});

// POST /assess-risk { ...RiskAssessmentInput } -> RiskReport (no auth required)
app.post("/assess-risk", (req, res) => {
  const report = riskAssessment.assessRisk(req.body || {});
  res.json(report);
});

// POST /reports { report } -> saved report (auth required)
app.post("/reports", (req, res) => {
  const token = getBearerToken(req);
  const session = getSession(token);
  if (!session) return res.status(401).json({ error: "notAuthenticated" });

  const saved = reports.saveReport(db, session.user_id, req.body?.report);
  res.json(saved);
});

// GET /reports -> list of saved reports (auth required)
app.get("/reports", (req, res) => {
  const token = getBearerToken(req);
  const session = getSession(token);
  if (!session) return res.status(401).json({ error: "notAuthenticated" });

  res.json(reports.listReports(db, session.user_id));
});

// GET /api-doc
app.get("/api-doc", (_req, res) => {
  res.type("text/plain").send(
    "ArteriQ backend: email+password auth, deterministic risk assessment, and per-user saved reports."
  );
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`ArteriQ backend listening on port ${PORT}`);
});