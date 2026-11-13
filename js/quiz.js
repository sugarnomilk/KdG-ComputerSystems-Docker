// Quiz rules without any DOM: question selection, grading and the result report.
import { MAX_QUESTIONS, MIN_QUESTIONS, OPTION_LETTERS } from "./config.js";
import { formatDate, formatNumber, shuffle } from "./util.js";

export const questionLimits = (pool) => ({
  min: MIN_QUESTIONS,
  max: Math.min(MAX_QUESTIONS, pool.length),
});

/** Strip quotes around an answer, collapse spaces and lowercase it. */
export const normalize = (s) =>
  s.trim().replace(/^[`'"“”‘’]+|[`'"“”‘’]+$/g, "").trim().replace(/\s+/g, " ").toLowerCase();

/**
 * How many questions each topic gets out of n: every topic at least once, the rest go to random topics (more likely to
 * larger topics), so the draw differs from exam to exam.
 */
export function allocateCountsRandom(sizes, n, random = Math.random) {
  const alloc = sizes.map(() => 1);
  for (let left = n - sizes.length; left > 0; left--) {
    const weights = sizes.map((size, i) => Math.max(0, size - alloc[i]));
    const total = weights.reduce((a, b) => a + b, 0);
    if (total === 0) break;
    let r = random() * total;
    const i = weights.findIndex((w) => (r -= w) < 0);
    alloc[i]++;
  }
  return alloc;
}

/** "Rando": random questions in a random order, ignoring the history; every topic appears. */
export function pick(pool, topics, n, random = Math.random) {
  const groups = topics.map((t) => shuffle(pool.filter((q) => q.topic === t.id), random));
  const counts = allocateCountsRandom(groups.map((g) => g.length), n, random);
  const ids = groups.flatMap((g, i) => g.slice(0, counts[i]).map((q) => q.id));
  return shuffle(ids, random);
}

/** Points for an answer; null for an open question that is not self-assessed yet. */
export function grade(q, a) {
  if (q.type === "mc") return a.sel.length === 1 && q.ok.includes(a.sel[0]) ? q.pts : 0;
  if (q.type === "multi") {
    const hit = a.sel.filter((i) => q.ok.includes(i)).length;
    const miss = a.sel.length - hit;
    return Math.max(0, Math.round(((q.pts * (hit - miss)) / q.ok.length) * 10) / 10);
  }
  if (q.type === "fill") {
    const v = normalize(a.text);
    const w = v.replace(/[.;,]+$/, "");
    const matches = (x) => (q.regex ? q.regex.test(x) : q.accept.map(normalize).includes(x));
    return matches(v) || matches(w) ? q.pts : 0;
  }
  return a.self == null ? null : a.self;
}

/** "correct" | "partial" | "wrong" for a points value. */
export const outcome = (points, max) => (points >= max ? "correct" : points <= 0 ? "wrong" : "partial");

const isGraded = (a) => Boolean(a && a.done && a.pts != null);

/** Outcome of a stored answer, or "" while it is unanswered. */
export const answerOutcome = (q, a) => (isGraded(a) ? outcome(a.pts, q.pts) : "");

/** Totals for the selected questions, in total and per topic. */
export function summarize(state, data) {
  let got = 0;
  let max = 0;
  let open = 0;
  const perTopic = Object.fromEntries(data.topics.map((t) => [t.id, { got: 0, max: 0 }]));
  state.sel.forEach((id) => {
    const q = data.byId[id];
    const a = state.ans[id];
    max += q.pts;
    perTopic[q.topic].max += q.pts;
    if (isGraded(a)) {
      got += a.pts;
      perTopic[q.topic].got += a.pts;
    } else {
      open++;
    }
  });
  const pct = max ? Math.round((got / max) * 100) : 0;
  return { got, max, open, pct, perTopic };
}

/** Plain-text report that the learner can copy. */
export function buildReport(state, data, summary, version, date = new Date()) {
  const lines = [
    `Resultaat oefenpagina CS2 Docker ${version} – ${formatDate(date)}`,
    `Score: ${formatNumber(summary.got)} / ${summary.max} (${summary.pct}%)`,
    "",
  ];
  state.sel.forEach((id) => {
    const q = data.byId[id];
    const a = state.ans[id];
    const done = isGraded(a);
    const icon = { correct: "✅", wrong: "❌", partial: "🟡" }[answerOutcome(q, a)];
    const score = done ? `${icon} ${formatNumber(a.pts)}/${q.pts}` : "– niet beantwoord";
    let chosen = "";
    if (a && a.done) {
      if (q.opts) chosen = ` (gekozen: ${a.sel.map((j) => OPTION_LETTERS[j]).join(",") || "-"})`;
      else if (q.type === "fill") chosen = ` (antwoord: ${a.text.trim()})`;
    }
    lines.push(`${id} · ${q.topic} · ${score}${chosen}`);
  });
  return lines.join("\n");
}
