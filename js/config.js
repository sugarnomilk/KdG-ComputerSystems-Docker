// App-wide constants. Bump VERSION only for an explicit release (and update README.md).
export const VERSION = "v0.2";

// Do not change: it holds the learner's saved progress in localStorage.
export const STORAGE_KEY = "cs2-docker-quiz-v2";

export const REPO_URL = "https://github.com/sugarnomilk/KdG-ComputerSystems-Docker";

export const MIN_QUESTIONS = 10;
export const MAX_QUESTIONS = 40;
export const DEFAULT_QUESTIONS = 20;
export const COUNT_PRESETS = [10, 15, 20, 30]; // the maximum is added as a last preset

export const HISTORY_KEY = "cs2-docker-history-v1"; // per-question results (separate from the saved exam)

// Mastery: a concept is done when this many of its questions were answered fully correct.
export const MASTERY_COUNT = 2;
// After a miss, a question only returns once at least this many other questions were
// answered for the first time since ("1 new question in between").
export const COOLDOWN_NEW_QUESTIONS = 1;

// "Slim" may draw up to this many questions of one concept (spread through the exam),
// so a concept can reach mastery within one exam.
export const BLOCK_SIZE = 2;

export const MODES = { smart: "Slim", random: "Rando" };
export const DEFAULT_MODE = "smart";

export const OPTION_LETTERS = "ABCDEFGH";

export const TYPE_LABELS = {
  mc: "Meerkeuze",
  multi: "Meerdere antwoorden",
  fill: "Invulvraag",
  open: "Open vraag",
};

export const DATA_FILES = {
  topics: new URL("../data/topics.json", import.meta.url),
  questions: new URL("../data/questions.json", import.meta.url),
  concepts: new URL("../data/concepts.json", import.meta.url),
};
