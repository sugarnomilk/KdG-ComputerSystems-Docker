// "Report a mistake": a link that opens a pre-filled GitHub issue.
import { OPTION_LETTERS, REPO_URL } from "./config.js";

const MAX_ANSWER_LENGTH = 200; // keeps the URL well below GitHub's length limit

/** The learner's answer as short text, or "" while the question is unanswered. */
function describeAnswer(q, a) {
  if (!a.done) return "";
  if (q.opts) return a.sel.map((j) => OPTION_LETTERS[j]).join(", ") || "-";
  return a.text.trim().slice(0, MAX_ANSWER_LENGTH);
}

export function buildIssueUrl(q, a, topicName, version) {
  const answer = describeAnswer(q, a);
  const body = [
    `Vraag: ${q.id}`,
    `Versie: ${version}`,
    `Onderdeel: ${topicName}`,
    answer ? `Mijn antwoord: ${answer}` : "",
    "",
    "Wat klopt er niet? (graag met slide of bron)",
    "",
    "",
    "_Dit issue is openbaar: zet er geen persoonlijke gegevens in._",
  ]
    .filter((line, i, lines) => line !== "" || lines[i - 1] !== "")
    .join("\n");
  const params = new URLSearchParams({ title: `[${q.id}] Fout in vraag`, body });
  return `${REPO_URL}/issues/new?${params}`;
}
