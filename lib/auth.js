const crypto = require("crypto");

// Returns a random 16-byte salt (hex string) used to salt the password hash.
function generateSalt() {
  return crypto.randomBytes(16).toString("hex");
}

// Deterministically hashes a password with the given salt using SHA-256.
function hashPassword(password, saltHex) {
  const salt = Buffer.from(saltHex, "hex");
  const combined = Buffer.concat([salt, Buffer.from(password, "utf8")]);
  return crypto.createHash("sha256").update(combined).digest("hex");
}

// Generates a fresh, unpredictable session token (hex-encoded random bytes).
function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Validates an email address shape: a non-empty local part, an '@', and a
// non-empty domain containing at least one dot.
function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (local.length === 0 || domain.length === 0) return false;
  const domainParts = domain.split(".");
  if (domainParts.length < 2) return false;
  return domainParts.every((p) => p.length > 0);
}

// Validates that a password meets the minimum strength policy (8+ chars).
function isValidPassword(password) {
  return typeof password === "string" && password.length >= 8;
}

module.exports = {
  generateSalt,
  hashPassword,
  generateSessionToken,
  isValidEmail,
  isValidPassword,
};
