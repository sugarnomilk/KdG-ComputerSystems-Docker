// Quiz state and its persistence in localStorage (per browser, never sent anywhere).
import { DEFAULT_QUESTIONS, STORAGE_KEY } from "./config.js";

export const createState = () => ({
  phase: "start", // "start" | "quiz"
  n: DEFAULT_QUESTIONS, // chosen number of questions
  sel: [], // ids of the selected questions
  cur: 0, // current question index, or "end"
  ans: {}, // answers by question id
});

export const createAnswer = () => ({ sel: [], text: "", self: null, done: false, pts: null });

/** Restore the saved state, if it only refers to questions that still exist. */
export function loadState(knownIds) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && Array.isArray(saved.sel) && saved.sel.every((id) => knownIds.has(id))) return saved;
  } catch (e) {
    /* unreadable or blocked storage: start fresh */
  }
  return createState();
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    /* storage full or blocked: progress just isn't saved */
  }
}
