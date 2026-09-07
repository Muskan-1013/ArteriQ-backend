// Status codes: 0 = Normal, 1 = Borderline, 2 = Abnormal.
function statusText(status) {
  if (status === 0) return "Normal";
  if (status === 1) return "Borderline";
  return "Abnormal";
}

// Each helper returns [status, valueText, referenceRange].

function atrialRate(ar) {
  if (ar >= 60 && ar <= 100) return [0, `${ar} bpm`, "60-100 bpm"];
  if (ar >= 50 && ar <= 110) return [1, `${ar} bpm`, "60-100 bpm"];
  return [2, `${ar} bpm`, "60-100 bpm"];
}

function ventricularRate(vr) {
  if (vr >= 60 && vr <= 100) return [0, `${vr} bpm`, "60-100 bpm"];
  if (vr >= 50 && vr <= 110) return [1, `${vr} bpm`, "60-100 bpm"];
  return [2, `${vr} bpm`, "60-100 bpm"];
}

function qrsDuration(qrsd) {
  if (qrsd >= 70 && qrsd <= 110) return [0, `${qrsd} ms`, "70-110 ms"];
  if (qrsd >= 60 && qrsd <= 120) return [1, `${qrsd} ms`, "70-110 ms"];
  return [2, `${qrsd} ms`, "70-110 ms"];
}

function qtInterval(qt) {
  if (qt >= 350 && qt <= 450) return [0, `${qt} ms`, "350-450 ms"];
  if (qt >= 330 && qt <= 470) return [1, `${qt} ms`, "350-450 ms"];
  return [2, `${qt} ms`, "350-450 ms"];
}

function qtcB(qtcb) {
  if (qtcb <= 440) return [0, `${qtcb} ms`, "\u2264440 ms"];
  if (qtcb <= 460) return [1, `${qtcb} ms`, "\u2264440 ms"];
  return [2, `${qtcb} ms`, "\u2264440 ms"];
}

function prInterval(pri) {
  if (pri >= 120 && pri <= 200) return [0, `${pri} ms`, "120-200 ms"];
  if (pri >= 110 && pri <= 220) return [1, `${pri} ms`, "120-200 ms"];
  return [2, `${pri} ms`, "120-200 ms"];
}

// Electrical axes (P, QRS/R, T) all share the same normal range.
function axis(deg, label) {
  if (deg >= -30 && deg <= 90) return [0, `${deg}\u00b0`, "-30\u00b0 to +90\u00b0"];
  if (deg >= -40 && deg <= 100) return [1, `${deg}\u00b0`, "-30\u00b0 to +90\u00b0"];
  return [2, `${deg}\u00b0`, "-30\u00b0 to +90\u00b0"];
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
    low: "Based on the ECG parameters provided, the overall cardiovascular risk appears low. Most measured values fall within normal reference ranges.",
    moderate:
      "Based on the ECG parameters provided, the overall cardiovascular risk appears moderate. One or more measured values fall outside the normal reference range and warrant closer attention.",
    high: "Based on the ECG parameters provided, the overall cardiovascular risk appears high. Several measured values deviate significantly from normal reference ranges and require prompt clinical review.",
  }[level];

  let detail = "";
  if (abnormalCount > 0) {
    detail = ` ${abnormalCount} parameter(s) were outside the normal range and ${borderlineCount} were borderline.`;
  } else if (borderlineCount > 0) {
    detail = ` ${borderlineCount} parameter(s) were borderline and would benefit from re-measurement.`;
  }
  return base + detail;
}

// input: { AR, VR, QRSD, QT, QTcB, PRI, pAxis, qrsAxis, tAxis }
function assessRisk(input) {
  const ar = atrialRate(input.AR);
  const vr = ventricularRate(input.VR);
  const qrsd = qrsDuration(input.QRSD);
  const qt = qtInterval(input.QT);
  const qtcb = qtcB(input.QTcB);
  const pri = prInterval(input.PRI);
  const pAx = axis(input.pAxis);
  const qrsAx = axis(input.qrsAxis);
  const tAx = axis(input.tAxis);

  const findings = [
    finding("AR (Atrial Rate)", ar),
    finding("VR (Ventricular Rate)", vr),
    finding("QRSD (QRS Duration)", qrsd),
    finding("QT Interval", qt),
    finding("QTcB", qtcb),
    finding("PRI (PR Interval)", pri),
    finding("P Axis", pAx),
    finding("QRS Axis", qrsAx),
    finding("T Axis", tAx),
  ];

  const statuses = [ar, vr, qrsd, qt, qtcb, pri, pAx, qrsAx, tAx].map(
    (x) => x[0],
  );
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
