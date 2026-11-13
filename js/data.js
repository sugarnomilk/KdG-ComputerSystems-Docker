// Loads topics and questions from data/*.json.
import { DATA_FILES } from "./config.js";

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url.pathname}: HTTP ${response.status}`);
  return response.json();
}

/** Turn the plain JSON records into the objects the app works with. */
export function prepareData(topics, rawQuestions) {
  const questions = rawQuestions.map((q) =>
    q.regex ? { ...q, regex: new RegExp(q.regex, q.regexFlags || "") } : q
  );
  return {
    topics,
    questions,
    pool: questions.filter((q) => q.topic), // only questions with a topic are drawn
    byId: Object.fromEntries(questions.map((q) => [q.id, q])),
    topicNames: Object.fromEntries(topics.map((t) => [t.id, t.name])),
  };
}

export async function loadData() {
  const [topics, questions] = await Promise.all([
    fetchJson(DATA_FILES.topics),
    fetchJson(DATA_FILES.questions),
  ]);
  return prepareData(topics, questions);
}
