// Start screen: choose the number of questions.
import { COUNT_PRESETS } from "../config.js";
import { $, action, cloneTemplate, el, field, scrollToTop, summaryRow } from "../dom.js";
import { pick, questionLimits } from "../quiz.js";

export function renderStart(ctx) {
  const { data, state, save, render } = ctx;
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

  field(screen, "topics").append(
    ...data.topics.map((t) =>
      summaryRow(t.name, `${data.pool.filter((q) => q.topic === t.id).length} vragen`, "muted")
    )
  );

  action(screen, "start").addEventListener("click", () => {
    state.sel = pick(data.pool, data.topics, state.n);
    state.ans = {};
    state.cur = 0;
    state.phase = "quiz";
    save();
    render();
    scrollToTop();
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
