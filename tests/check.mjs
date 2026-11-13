// Sanity checks for the question data and the quiz rules.
// Run from the repository root: node tests/check.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { prepareData } from "../js/data.js";
import { grade, pick, questionLimits } from "../js/quiz.js";

const read = (file) => JSON.parse(fs.readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8"));
const data = prepareData(read("topics.json"), read("questions.json"));
let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (e) {
    failures++;
    console.log(`FAIL ${name}\n     ${e.message}`);
  }
};

// Known and accepted: these questions have six options.
const SIX_OPTIONS = new Set(["R5-3", "R5-4", "R5-6", "R5-9", "R5-10"]);
const answerText = (q) => q.answer.match(/<code>(.*?)<\/code>/s)[1].replace(/<[^>]+>/g, "");

check("unique ids", () => {
  const ids = data.questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

check("every pooled question has a known topic, type and points", () => {
  for (const q of data.pool) {
    assert.ok(data.topicNames[q.topic], `${q.id}: topic`);
    assert.ok(["mc", "multi", "fill", "open"].includes(q.type), `${q.id}: type`);
    assert.ok(q.pts > 0, `${q.id}: pts`);
    assert.ok(q.source, `${q.id}: source`);
  }
});

check("choice questions: valid ok, never none or all options correct", () => {
  for (const q of data.pool.filter((q) => q.opts)) {
    assert.ok(q.ok.length > 0 && q.ok.length < q.opts.length, `${q.id}: ok count`);
    assert.ok(q.ok.every((i) => Number.isInteger(i) && i >= 0 && i < q.opts.length), `${q.id}: ok range`);
    if (q.type === "mc") assert.equal(q.ok.length, 1, `${q.id}: mc has one correct option`);
    if (!SIX_OPTIONS.has(q.id)) assert.ok(q.opts.length <= 5, `${q.id}: more than 5 options`);
  }
});

check("fill questions have an answer and a matcher", () => {
  for (const q of data.pool.filter((q) => q.type === "fill")) {
    assert.ok(q.answer, `${q.id}: answer`);
    assert.ok(q.regex || q.accept?.length, `${q.id}: regex or accept`);
  }
});

check("open questions have a model answer", () => {
  for (const q of data.pool.filter((q) => q.type === "open")) assert.ok(q.model?.length, q.id);
});

check("grade: the correct answer gives full points", () => {
  for (const q of data.pool) {
    if (q.opts) assert.equal(grade(q, { sel: q.ok }), q.pts, q.id);
    if (q.type === "fill") assert.equal(grade(q, { text: answerText(q) }), q.pts, q.id);
  }
});

check("grade: clearly wrong fill answers give 0", () => {
  for (const q of data.pool.filter((q) => q.type === "fill")) {
    for (const text of ["x", "docker", "docker run"]) assert.equal(grade(q, { text }), 0, `${q.id}: ${text}`);
  }
});

check("grade: multi-answer penalty", () => {
  const q = { type: "multi", pts: 2, ok: [0, 1] };
  assert.equal(grade(q, { sel: [0, 2] }), 0);
  assert.equal(grade(q, { sel: [0] }), 1);
  assert.equal(grade(q, { sel: [2, 3] }), 0);
  assert.equal(grade(q, { sel: [0, 1, 2] }), 1);
});

check("pick: right size, no duplicates, every topic present", () => {
  const { min, max } = questionLimits(data.pool);
  for (let n = min; n <= max; n++) {
    const ids = pick(data.pool, data.topics, n);
    assert.equal(ids.length, n, `n=${n}`);
    assert.equal(new Set(ids).size, n, `n=${n}: duplicates`);
    const topics = new Set(ids.map((id) => data.byId[id].topic));
    assert.equal(topics.size, data.topics.length, `n=${n}: topics`);
  }
});

console.log(`\n${data.questions.length} questions, ${data.pool.length} in the draw`);
process.exit(failures ? 1 : 0);
