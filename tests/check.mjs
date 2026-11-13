// Sanity checks for the question data and the quiz rules.
// Run from the repository root: node tests/check.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { prepareData } from "../js/data.js";
import { grade, pick, questionLimits } from "../js/quiz.js";
import { recordResult } from "../js/history.js";
import { correctCount, eligibleQuestions, isMastered, masteryTarget } from "../js/concepts.js";
import { pickSmart } from "../js/selection.js";

const read = (file) => JSON.parse(fs.readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8"));
const data = prepareData(read("topics.json"), read("questions.json"), read("concepts.json"));
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
    assert.match(q.source, /^Hoofdstuk [1-6] – /, `${q.id}: source must point to a course chapter`);
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


check("concepts: every question in exactly one concept, of its own topic", () => {
  const seen = new Map();
  for (const c of data.concepts) {
    assert.ok(data.topicNames[c.topic], `${c.id}: topic`);
    assert.ok(c.questions.length > 0 && c.questions.every(Boolean), `${c.id}: questions`);
    for (const q of c.questions) {
      assert.ok(!seen.has(q.id), `${q.id} is in two concepts`);
      assert.equal(q.topic, c.topic, `${q.id} is in a concept of another topic`);
      seen.set(q.id, c.id);
    }
  }
  assert.equal(seen.size, data.pool.length, "questions without a concept");
});

const FULL = (q) => q.pts;
const fresh = () => ({});
const answerNew = (h, count = 1, skip = new Set()) => {
  // answer `count` questions for the first time
  for (const q of data.pool) {
    if (count === 0) break;
    if (!h[q.id] && !skip.has(q.id)) {
      recordResult(h, q, q.pts);
      count--;
    }
  }
};

check("mastery: two fully correct questions, one for a single-question concept", () => {
  const h = fresh();
  const [c] = data.concepts.filter((c) => c.questions.length >= 3);
  recordResult(h, c.questions[0], FULL(c.questions[0]));
  assert.equal(isMastered(c, h), false);
  recordResult(h, c.questions[1], 1e-9);
  assert.equal(isMastered(c, h), false, "partial does not count");
  recordResult(h, c.questions[2], FULL(c.questions[2]));
  assert.equal(correctCount(c, h), 2);
  assert.equal(isMastered(c, h), true);
  const single = data.concepts.find((c) => c.questions.length === 1);
  assert.equal(masteryTarget(single), 1);
});

check("eligibility: partial parks the question until a later question fails", () => {
  const h = fresh();
  const c = data.concepts.find((c) => c.questions.length >= 3);
  const [a, b, d] = c.questions;
  const skip = new Set(c.questions.map((q) => q.id));
  recordResult(h, a, 1e-9); // partial
  answerNew(h, 1, skip); // a new question in between, so the cooldown is over
  let tiers = Object.fromEntries(eligibleQuestions(c, h).map((i) => [i.q.id, i.tier]));
  assert.equal(tiers[a.id], 2);
  assert.equal(tiers[b.id], 0);
  recordResult(h, b, 0); // the follow-up fails
  answerNew(h, 1, skip);
  tiers = Object.fromEntries(eligibleQuestions(c, h).map((i) => [i.q.id, i.tier]));
  assert.equal(tiers[a.id], 1, "partial question is released");
  assert.equal(tiers[b.id], 1, "wrong question comes after unseen ones");
  assert.equal(tiers[d.id], 0);
  recordResult(h, d, FULL(d));
  assert.ok(!(d.id in Object.fromEntries(eligibleQuestions(c, h).map((i) => [i.q.id, 1]))), "correct is not eligible");
});

check("smart pick: right size, no duplicates, every topic present, also when everything is mastered", () => {
  const { min, max } = questionLimits(data.pool);
  const histories = [fresh()];
  const all = fresh();
  data.pool.forEach((q) => recordResult(all, q, FULL(q)));
  histories.push(all);
  const mixed = fresh();
  data.pool.forEach((q, i) => recordResult(mixed, q, i % 3 === 0 ? FULL(q) : i % 3 === 1 ? 0 : 1e-9));
  histories.push(mixed);
  for (const h of histories) {
    for (let n = min; n <= max; n++) {
      const ids = pickSmart(data, h, n);
      assert.equal(ids.length, n, `n=${n}`);
      assert.equal(new Set(ids).size, n, `n=${n}: duplicates`);
      assert.equal(new Set(ids.map((id) => data.byId[id].topic)).size, data.topics.length, `n=${n}: topics`);
    }
  }
});

check("smart pick: skips mastered concepts while others are left", () => {
  const h = fresh();
  const mastered = data.concepts.filter((c) => c.topic === "t4").slice(0, 3);
  mastered.forEach((c) => c.questions.slice(0, 2).forEach((q) => recordResult(h, q, FULL(q))));
  const skipped = new Set(mastered.flatMap((c) => c.questions.map((q) => q.id)));
  for (let i = 0; i < 50; i++) {
    const ids = pickSmart(data, h, 20);
    assert.ok(!ids.some((id) => skipped.has(id)), "a mastered concept was drawn");
  }
});

check("smart pick: missed and unseen concepts have the same priority; related questions are spread out", () => {
  const h = fresh();
  const missed = data.concepts.find((c) => c.topic === "t4");
  recordResult(h, missed.questions[0], 0);
  const conceptOf = Object.fromEntries(data.concepts.flatMap((c) => c.questions.map((q) => [q.id, c.id])));
  let drawn = 0;
  const runs = 400;
  for (let i = 0; i < runs; i++) {
    const t4 = pickSmart(data, h, 10).filter((id) => data.byId[id].topic === "t4");
    if (t4.some((id) => conceptOf[id] === missed.id)) drawn++;
    assert.ok(!t4.includes(missed.questions[0]), "another question of the concept comes first");
  }
  assert.ok(drawn > 0 && drawn < runs, `the missed concept is ${drawn}/${runs}: it should be neither always nor never`);
  for (let n = 10; n <= 40; n++) {
    for (let i = 0; i < 40; i++) {
      const ids = pickSmart(data, fresh(), n);
      for (let k = 1; k < ids.length; k++) {
        assert.notEqual(conceptOf[ids[k]], conceptOf[ids[k - 1]], `n=${n}: related questions are adjacent`);
      }
    }
  }
});

check("Rando: random order and random extras, every topic present", () => {
  const orders = new Set();
  const extras = new Set();
  for (let i = 0; i < 200; i++) {
    const ids = pick(data.pool, data.topics, 10);
    orders.add(ids.map((id) => data.byId[id].topic).join(""));
    const per = {};
    ids.forEach((id) => (per[data.byId[id].topic] = (per[data.byId[id].topic] || 0) + 1));
    Object.entries(per).filter(([, n]) => n > 1).forEach(([t]) => extras.add(t));
  }
  assert.ok(orders.size > 20, "the order is not shuffled");
  assert.ok(extras.size >= 5, "extras always go to the same topics");
});

check("smart pick: with few questions the extras and the pairs differ per exam", () => {
  const extraTopics = new Set();
  let pairs = 0;
  let noPairs = 0;
  const conceptOf = Object.fromEntries(data.concepts.flatMap((c) => c.questions.map((q) => [q.id, c.id])));
  for (let i = 0; i < 300; i++) {
    const ids = pickSmart(data, fresh(), 10);
    const perTopic = {};
    ids.forEach((id) => (perTopic[data.byId[id].topic] = (perTopic[data.byId[id].topic] || 0) + 1));
    Object.entries(perTopic).filter(([, n]) => n > 1).forEach(([t]) => extraTopics.add(t));
    const hasPair = new Set(ids.map((id) => conceptOf[id])).size < ids.length;
    hasPair ? pairs++ : noPairs++;
  }
  assert.ok(extraTopics.size >= 5, `extras always go to the same topics: ${[...extraTopics]}`);
  assert.ok(pairs > 0 && noPairs > 0, `pairs=${pairs} noPairs=${noPairs}`);
});

check("cooldown: a missed question rests until a new question was answered", () => {
  const h = fresh();
  const c = data.concepts.find((c) => c.topic === "t4" && c.questions.length >= 3);
  const missed = c.questions[0];
  recordResult(h, missed, 0);
  let tiers = Object.fromEntries(eligibleQuestions(c, h).map((i) => [i.q.id, i.tier]));
  assert.equal(tiers[missed.id], 3, "rests right after the miss");
  for (let i = 0; i < 100; i++) {
    assert.ok(!pickSmart(data, h, 10).includes(missed.id), "a resting question was drawn");
  }
  answerNew(h, 1, new Set(c.questions.map((q) => q.id)));
  tiers = Object.fromEntries(eligibleQuestions(c, h).map((i) => [i.q.id, i.tier]));
  assert.equal(tiers[missed.id], 1, "returns after one new question");
});

check("smart pick: a concept can be drawn twice, so mastery is possible within one exam", () => {
  const h = fresh();
  let twice = false;
  for (let i = 0; i < 30 && !twice; i++) {
    const ids = pickSmart(data, h, 15);
    const per = {};
    for (const c of data.concepts) per[c.id] = c.questions.filter((q) => ids.includes(q.id)).length;
    twice = Object.values(per).some((n) => n >= 2);
  }
  assert.ok(twice);
});

console.log(`\n${data.questions.length} questions, ${data.pool.length} in the draw`);
process.exit(failures ? 1 : 0);
