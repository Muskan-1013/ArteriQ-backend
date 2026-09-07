// Status codes: 0 = Normal, 1 = Borderline, 2 = Abnormal.
function statusText(status) {
  if (status === 0) return "Normal";
  if (status === 1) return "Borderline";
  return "Abnormal";
}

// Each helper returns [status, valueText, referenceRange].

function heartRate(hr) {
  if (hr >= 60 && hr <= 100) return [0, `${hr} bpm`, "60-100 bpm"];
  if (hr >= 50 && hr <= 110) return [1, `${hr} bpm`, "60-100 bpm"];
  return [2, `${hr} bpm`, "60-100 bpm"];
}

function stSegment(st) {
  if (st >= -0.5 && st <= 0.5) return [0, `${st} mV`, "-0.5 to +0.5 mV"];
  if (st >= -1.0 && st <= 1.0) return [1, `${st} mV`, "-0.5 to +0.5 mV"];
  return [2, `${st} mV`, "-0.5 to +0.5 mV"];
}

function qtInterval(qt) {
  if (qt >= 350 && qt <= 450) return [0, `${qt} ms`, "350-450 ms"];
  if (qt >= 330 && qt <= 470) return [1, `${qt} ms`, "350-450 ms"];
  return [2, `${qt} ms`, "350-450 ms"];
}

function prInterval(pr) {
  if (pr >= 120 && pr <= 200) return [0, `${pr} ms`, "120-200 ms"];
  if (pr >= 110 && pr <= 220) return [1, `${pr} ms`, "120-200 ms"];
  return [2, `${pr} ms`, "120-200 ms"];
}

function qrsDuration(qrs) {
  if (qrs >= 80 && qrs <= 120) return [0, `${qrs} ms`, "80-120 ms"];
  if (qrs >= 70 && qrs <= 130) return [1, `${qrs} ms`, "80-120 ms"];
  return [2, `${qrs} ms`, "80-120 ms"];
}

function rrInterval(rr) {
  if (rr >= 600 && rr <= 1000) return [0, `${rr} ms`, "600-1000 ms"];
  if (rr >= 500 && rr <= 1100) return [1, `${rr} ms`, "600-1000 ms"];
  return [2, `${rr} ms`, "600-1000 ms"];
}

function spo2(s) {
  if (s >= 95 && s <= 100) return [0, `${s} %`, "95-100%"];
  if (s >= 90 && s <= 94) return [1, `${s} %`, "95-100%"];
  return [2, `${s} %`, "95-100%"];
}

function temperature(temp) {
  if (temp >= 36.5 && temp <= 37.5) return [0, `${temp} \u00b0C`, "36.5-37.5 \u00b0C"];
  if (temp >= 36.0 && temp <= 38.0) return [1, `${temp} \u00b0C`, "36.5-37.5 \u00b0C"];
  return [2, `${temp} \u00b0C`, "36.5-37.5 \u00b0C"];
}

// P/QRS/T complexes are described as free text. A normal/regular morphology
// is scored normal; an explicitly abnormal/irregular description is scored
// abnormal; anything else is treated as borderline (unable to confirm).
function complexes(desc) {
  const lower = String(desc || "").toLowerCase();
  if (lower.includes("normal") || lower.includes("regular")) {
    return [0, desc, "Normal morphology"];
  }
  if (lower.includes("abnormal") || lower.includes("irregular") || lower.includes("ectopic")) {
    return [2, desc, "Normal morphology"];
  }
  return [1, desc, "Normal morphology"];
}

function finding(parameter, [status, value, referenceRange]) {
  return { parameter, value, referenceRange, status: statusText(status) };
}

function riskLevel(score) {
  if (score <= 2) return "low";
  if (score <= 5) return "moderate";
  return "high";
}

function explanation(level, abnormalCount, borderlineCount) {
  const base = {
    low: "Based on the physiological parameters provided, the overall cardiovascular risk appears low. Most measured values fall within normal reference ranges.",
    moderate:
      "Based on the physiological parameters provided, the overall cardiovascular risk appears moderate. One or more measured values fall outside the normal reference range and warrant closer attention.",
    high: "Based on the physiological parameters provided, the overall cardiovascular risk appears high. Several measured values deviate significantly from normal reference ranges and require prompt clinical review.",
  }[level];

  let detail = "";
  if (abnormalCount > 0) {
    detail = ` ${abnormalCount} parameter(s) were outside the normal range and ${borderlineCount} were borderline.`;
  } else if (borderlineCount > 0) {
    detail = ` ${borderlineCount} parameter(s) were borderline and would benefit from re-measurement.`;
  }
  return base + detail;
}

// input: { heartRate, stSegment, qtInterval, prInterval, qrsDuration, rrInterval, complexes, spo2, temperature }
function assessRisk(input) {
  const hr = heartRate(Number(input.heartRate));
  const st = stSegment(Number(input.stSegment));
  const qt = qtInterval(Number(input.qtInterval));
  const pr = prInterval(Number(input.prInterval));
  const qrs = qrsDuration(Number(input.qrsDuration));
  const rr = rrInterval(Number(input.rrInterval));
  const cx = complexes(input.complexes);
  const sp = spo2(Number(input.spo2));
  const temp = temperature(Number(input.temperature));

  const findings = [
    finding("Heart rate", hr),
    finding("ST segment", st),
    finding("QT interval", qt),
    finding("PR interval", pr),
    finding("QRS duration", qrs),
    finding("RR interval", rr),
    finding("P/QRS/T complexes", cx),
    finding("SpO\u2082", sp),
    finding("Temperature", temp),
  ];

  const statuses = [hr, st, qt, pr, qrs, rr, cx, sp, temp].map((x) => x[0]);
  const score = statuses.reduce((a, b) => a + b, 0);
  const abnormalCount = statuses.filter((s) => s === 2).length;
  const borderlineCount = statuses.filter((s) => s === 1).length;

  const level = riskLevel(score);

  return {
    riskLevel: level,
    findings,
    clinicalExplanation: explanation(level, abnormalCount, borderlineCount),
    disclaimer:
      "This report is a preliminary screening tool only and is not a medical diagnosis. It does not replace professional medical evaluation. Please consult a qualified healthcare provider for any concerns.",
  };
}

module.exports = { assessRisk };
