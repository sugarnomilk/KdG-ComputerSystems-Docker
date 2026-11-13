// Loads topics and questions from data/*.json.
import { DATA_FILES } from "./config.js";

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url.pathname}: HTTP ${response.status}`);
  return response.json();
}

/** Turn the plain JSON records into the objects the app works with. */
export function prepareData(topics, rawQuestions, rawConcepts = []) {
  const questions = rawQuestions.map((q) =>
    q.regex ? { ...q, regex: new RegExp(q.regex, q.regexFlags || "") } : q
  );
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
  // A concept groups questions that test the same content, easiest first.
  const concepts = rawConcepts.map((c) => ({ ...c, questions: c.questions.map((id) => byId[id]) }));
  return {
    topics,
    questions,
    concepts,
    pool: questions.filter((q) => q.topic), // only questions with a topic are drawn
    byId,
    topicNames: Object.fromEntries(topics.map((t) => [t.id, t.name])),
  };
}

export async function loadData() {
  const [topics, questions, concepts] = await Promise.all([
    fetchJson(DATA_FILES.topics),
    fetchJson(DATA_FILES.questions),
    fetchJson(DATA_FILES.concepts),
  ]);
  return prepareData(topics, questions, concepts);
}
