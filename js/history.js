// Per-question results, kept in this browser only. Separate from the saved exam,
// so "Wis geschiedenis" does not touch a running exam.
import { HISTORY_KEY } from "./config.js";

// history[questionId] = { r: "c" | "p" | "w", t: timestamp }
//   c = fully correct, p = partially correct, w = wrong; t orders the attempts.

export function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "null");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved;
  } catch (e) {
    /* unreadable or blocked storage: start with an empty history */
  }
  return {};
}

export function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    /* storage full or blocked: results are just not remembered */
  }
}

/** Store the latest result of a question. Timestamps always increase. */
export function recordResult(history, q, points, now = Date.now()) {
  const latest = Math.max(0, ...Object.values(history).map((entry) => entry.t || 0));
  const r = points >= q.pts ? "c" : points <= 0 ? "w" : "p";
  history[q.id] = { r, t: Math.max(now, latest + 1) };
}

export function clearHistory(history) {
  Object.keys(history).forEach((id) => delete history[id]);
}
