// "Slim" exam selection: unmastered concepts first, topic distribution unchanged.
import { BLOCK_SIZE } from "./config.js";
import { correctCount, eligibleQuestions, isMastered, masteryTarget } from "./concepts.js";
import { allocateCountsRandom } from "./quiz.js";
import { shuffle } from "./util.js";

/**
 * Order of the unmastered concepts of a topic. Concepts you missed and concepts with
 * questions you never saw have the same priority, so a miss does not come straight
 * back. Concepts where only a partially correct question is left return last.
 */
const conceptGroup = ({ items }) => (items[0].tier === 2 ? 1 : 0);

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
    .sort((a, b) => conceptGroup(a) - conceptGroup(b));

  // 1. Per concept one or two questions, so it can reach mastery within this exam.
  for (const { concept, items } of active) {
    const needed = Math.max(1, masteryTarget(concept) - correctCount(concept, history));
    // Random block size: sometimes two questions of this concept, sometimes one.
    const size = 1 + Math.floor(random() * Math.min(BLOCK_SIZE, needed));
    items.slice(0, size).forEach(({ q }) => take(q));
  }
  // 2. More from the unmastered concepts.
  for (const { items } of active) items.forEach(({ q }) => take(q));
  // 3. Nothing left (everything mastered): any question of the topic. A topic always appears.
  shuffle(data.pool.filter((q) => q.topic === topicId && !used.has(q.id)), random).forEach(take);
  return chosen;
}

const MAX_SHUFFLE_TRIES = 500;

/**
 * Shuffle the exam, but keep questions of the same concept apart where possible,
 * so a pair of related questions never follows each other.
 */
export function spread(ids, conceptOf, random = Math.random) {
  const hasNeighbours = (order) =>
    order.some((id, i) => i > 0 && conceptOf[id] === conceptOf[order[i - 1]]);
  let order = shuffle([...ids], random);
  for (let tries = 0; tries < MAX_SHUFFLE_TRIES && hasNeighbours(order); tries++) {
    order = shuffle([...ids], random);
  }
  return order;
}

/** Draw n question ids; every topic gets at least one, as in the random draw. */
export function pickSmart(data, history, n, random = Math.random) {
  const sizes = data.topics.map((t) => data.pool.filter((q) => q.topic === t.id).length);
  const counts = allocateCountsRandom(sizes, n, random);
  const ids = data.topics.flatMap((t, i) => selectForTopic(t.id, data, history, counts[i], random));
  const conceptOf = Object.fromEntries(
    data.concepts.flatMap((c) => c.questions.map((q) => [q.id, c.id]))
  );
  return spread(ids, conceptOf, random);
}
