// Start screen: choose the number of questions and the kind of exam.
import { COUNT_PRESETS } from "../config.js";
import { clearHistory } from "../history.js";
import { isMastered } from "../concepts.js";
import { $, action, cloneTemplate, el, field, scrollToTop, summaryRow } from "../dom.js";
import { pick, questionLimits } from "../quiz.js";
import { pickSmart } from "../selection.js";

const ARM_TIMEOUT_MS = 3000;

// A tooltip can be dismissed with Escape, also while the pointer only hovers it (WCAG 1.4.13).
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.querySelectorAll("[role=tooltip]").forEach((tip) => (tip.hidden = true));
});

/** Mastered and total concepts, for all topics or one topic. */
function conceptProgress(data, history, topicId) {
  const concepts = data.concepts.filter((c) => !topicId || c.topic === topicId);
  return { done: concepts.filter((c) => isMastered(c, history)).length, total: concepts.length };
}

export function renderStart(ctx) {
  const { data, state, history, save, saveHistory, render } = ctx;
  const { min, max } = questionLimits(data.pool);
  const screen = cloneTemplate("tpl-start");

  field(screen, "pool-size").textContent = data.pool.length;

  const range = screen.querySelector("#count-range");
  const count = field(screen, "count");
  const setCount = (n) => {
    state.n = n;
    range.value = n;
    count.textContent = n;
    save();
  };
  Object.assign(range, { min, max, value: state.n });
  count.textContent = state.n;
  range.addEventListener("input", () => setCount(+range.value));

  const presets = field(screen, "presets");
  [...COUNT_PRESETS, max].forEach((n) => {
    const button = el("button", "btn", String(n));
    button.type = "button";
    button.addEventListener("click", () => setCount(n));
    presets.append(button);
  });

  // Kind of exam.
  screen.querySelectorAll("input[name=mode]").forEach((input) => {
    input.checked = input.value === state.mode;
    input.addEventListener("change", () => {
      state.mode = input.value;
      save();
    });
  });

  // Questions and progress per topic.
  field(screen, "topics").append(
    ...data.topics.map((t) => {
      const questions = data.pool.filter((q) => q.topic === t.id).length;
      const { done, total } = conceptProgress(data, history, t.id);
      return summaryRow(t.name, `${questions} vragen · ${done}/${total} begrippen afgerond`, "muted");
    })
  );
  const overall = conceptProgress(data, history);
  field(screen, "progress").textContent = `Afgeronde begrippen: ${overall.done} van ${overall.total}.`;

  action(screen, "start").addEventListener("click", () => {
    state.sel =
      state.mode === "smart"
        ? pickSmart(data, history, state.n)
        : pick(data.pool, data.topics, state.n);
    state.ans = {};
    state.cur = 0;
    state.phase = "quiz";
    save();
    render();
    scrollToTop();
  });

  // Two-step reset of the history only; a running exam stays untouched.
  const reset = action(screen, "reset-history");
  // The tooltip text is hidden with the `hidden` attribute, so it stays hidden even if
  // an older cached stylesheet is used.
  const tooltip = reset.closest(".tooltip");
  const tip = tooltip.querySelector("[role=tooltip]");
  const setTip = (visible) => () => {
    tip.hidden = !visible;
  };
  tooltip.addEventListener("mouseenter", setTip(true));
  tooltip.addEventListener("mouseleave", setTip(false));
  tooltip.addEventListener("focusin", setTip(true));
  tooltip.addEventListener("focusout", setTip(false));
  let armed = false;
  reset.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      reset.textContent = "Zeker? Klik nog eens";
      setTimeout(() => {
        armed = false;
        reset.textContent = "Wis geschiedenis";
      }, ARM_TIMEOUT_MS);
      return;
    }
    clearHistory(history);
    saveHistory();
    render();
  });

  const resume = action(screen, "resume");
  if (state.sel.length > 0) {
    resume.hidden = false;
    field(screen, "resume-count").textContent = state.sel.length;
    resume.addEventListener("click", () => {
      state.phase = "quiz";
      if (state.cur !== "end" && state.cur >= state.sel.length) state.cur = 0;
      save();
      render();
    });
  }

  $("#main").replaceChildren(screen);
}
