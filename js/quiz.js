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
 * How many questions each topic gets out of n: every topic at least once, the rest
 * spread proportionally to the topic sizes.
 */
export function allocateCounts(sizes, n, random = Math.random) {
  const alloc = sizes.map(() => 1);
  const rest = n - sizes.length;
  const extra = sizes.reduce((sum, size) => sum + size - 1, 0);
  const want = sizes.map((size) => (rest * (size - 1)) / extra);
  want.forEach((w, i) => {
    alloc[i] += Math.floor(w);
  });
  let left = n - alloc.reduce((a, b) => a + b, 0);
  const order = sizes
    .map((size, i) => i)
    .sort((a, b) => (want[b] % 1) - (want[a] % 1) || random() - 0.5);
  for (const i of order) {
    if (left <= 0) break;
    if (alloc[i] < sizes[i]) {
      alloc[i]++;
      left--;
    }
  }
  while (left > 0) {
    const i = sizes.findIndex((size, k) => alloc[k] < size);
    alloc[i]++;
    left--;
  }
  return alloc;
}

/** "Rando": a random draw, ignoring the history. */
export function pick(pool, topics, n, random = Math.random) {
  const groups = topics.map((t) => ({
    t: t.id,
    qs: shuffle(pool.filter((q) => q.topic === t.id), random),
  }));
  const counts = allocateCounts(groups.map((g) => g.qs.length), n, random);
  return groups.flatMap((g, i) => g.qs.slice(0, counts[i]).map((q) => q.id));
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
