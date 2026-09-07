const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

async function analyzeUltrasound(fileBuffer, filename) {
  const form = new FormData();
  const blob = new Blob([fileBuffer]);
  form.append("image", blob, filename || "image.png");

  const response = await fetch(`${ML_SERVICE_URL}/analyze`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ML service error: ${errText}`);
  }

  return response.json();
}

module.exports = { analyzeUltrasound };
