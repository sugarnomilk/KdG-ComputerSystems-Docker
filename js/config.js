// App-wide constants. Bump VERSION only for an explicit release (and update README.md).
export const VERSION = "v0.2";

// Do not change: it holds the learner's saved progress in localStorage.
export const STORAGE_KEY = "cs2-docker-quiz-v2";

export const REPO_URL = "https://github.com/sugarnomilk/KdG-ComputerSystems-Docker";

export const MIN_QUESTIONS = 10;
export const MAX_QUESTIONS = 40;
export const DEFAULT_QUESTIONS = 20;
export const COUNT_PRESETS = [10, 15, 20, 30]; // the maximum is added as a last preset

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
};
