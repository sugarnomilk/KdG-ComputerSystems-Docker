// "Slim" exam selection: unmastered concepts first, topic distribution unchanged.
import { BLOCK_SIZE } from "./config.js";
import { correctCount, eligibleQuestions, isMastered, masteryTarget } from "./concepts.js";
import { allocateCounts } from "./quiz.js";
import { shuffle } from "./util.js";

/** Pick k question ids of one topic. */
function selectForTopic(topicId, data, history, k, random) {
  const chosen = [];
  const used = new Set();
  const take = (q) => {
    if (chosen.length < k && !used.has(q.id)) {
      used.add(q.id);
      chosen.push(q.id);
    }
  };

  const active = shuffle(
    data.concepts.filter((c) => c.topic === topicId && !isMastered(c, history)),
    random
  )
    .map((concept) => ({ concept, items: eligibleQuestions(concept, history) }))
    .filter((entry) => entry.items.length)
    .sort((a, b) => a.items[0].tier - b.items[0].tier);

  // 1. Per concept a block of questions, so it can reach mastery within this exam.
  for (const { concept, items } of active) {
    const needed = Math.max(1, masteryTarget(concept) - correctCount(concept, history));
    items.slice(0, Math.min(BLOCK_SIZE, needed)).forEach(({ q }) => take(q));
  }
  // 2. More from the unmastered concepts.
  for (const { items } of active) items.forEach(({ q }) => take(q));
  // 3. Nothing left (everything mastered): any question of the topic. A topic always appears.
  shuffle(data.pool.filter((q) => q.topic === topicId && !used.has(q.id)), random).forEach(take);
  return chosen;
}

/** Draw n question ids; every topic gets at least one, as in the random draw. */
export function pickSmart(data, history, n, random = Math.random) {
  const sizes = data.topics.map((t) => data.pool.filter((q) => q.topic === t.id).length);
  const counts = allocateCounts(sizes, n, random);
  return data.topics.flatMap((t, i) => selectForTopic(t.id, data, history, counts[i], random));
}
