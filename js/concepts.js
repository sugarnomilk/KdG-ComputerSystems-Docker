// Concept mastery, based on the history. No DOM.
import { MASTERY_COUNT } from "./config.js";

/** How many fully correct questions a concept needs (a one-question concept needs one). */
export const masteryTarget = (concept) => Math.min(MASTERY_COUNT, concept.questions.length);

export const correctCount = (concept, history) =>
  concept.questions.filter((q) => history[q.id]?.r === "c").length;

export const isMastered = (concept, history) => correctCount(concept, history) >= masteryTarget(concept);

/**
 * Priority of a question inside its concept (lower = drawn sooner), or null when it
 * is not eligible (answered fully correct).
 *   0  not answered yet
 *   1  answered wrong, or partially correct but a later question of the concept failed
 *   2  partially correct and nothing failed since: only when nothing else is left
 */
export function questionTier(concept, q, history) {
  const entry = history[q.id];
  if (!entry) return 0;
  if (entry.r === "c") return null;
  if (entry.r === "w") return 1;
  const failedSince = concept.questions.some((other) => {
    const o = history[other.id];
    return other !== q && o && o.r !== "c" && o.t > entry.t;
  });
  return failedSince ? 1 : 2;
}

/** Eligible questions of a concept, best first (ties keep the order of the concept). */
export function eligibleQuestions(concept, history) {
  return concept.questions
    .map((q) => ({ q, tier: questionTier(concept, q, history) }))
    .filter((item) => item.tier !== null)
    .sort((a, b) => a.tier - b.tier);
}
