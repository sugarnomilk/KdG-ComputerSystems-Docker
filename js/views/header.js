// Page header: score, "new exam" button and the question navigation.
import { VERSION } from "../config.js";
import { $, el, scrollToTop } from "../dom.js";
import { answerOutcome } from "../quiz.js";
import { formatNumber } from "../util.js";

const ARM_TIMEOUT_MS = 3000;

/** One-time setup: version label and the two-step "new exam" button. */
export function initHeader(ctx) {
  $("#version").textContent = VERSION;

  const button = $("#new-exam");
  let armed = false;
  button.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      button.textContent = "Zeker? Klik nog eens";
      setTimeout(() => {
        armed = false;
        button.textContent = "Nieuw examen";
      }, ARM_TIMEOUT_MS);
      return;
    }
    armed = false;
    button.textContent = "Nieuw examen";
    ctx.state.phase = "start";
    ctx.save();
    ctx.render();
    scrollToTop();
  });
}

function renderScore({ state, data }) {
  const score = $("#score");
  if (state.phase !== "quiz") {
    score.textContent = "";
    return;
  }
  let got = 0;
  let max = 0;
  let done = 0;
  state.sel.forEach((id) => {
    const a = state.ans[id];
    if (a && a.done && a.pts != null) {
      got += a.pts;
      max += data.byId[id].pts;
      done++;
    }
  });
  if (!done) {
    score.textContent = `${state.sel.length} vragen`;
    return;
  }
  const strong = el("b", "", `${formatNumber(got)} / ${max}`);
  score.replaceChildren("Score: ", strong, ` · ${done}/${state.sel.length} beantwoord`);
}

function navButton(label, title, { current, outcome, onClick }) {
  const li = el("li");
  const button = el("button", "dot", label);
  button.type = "button";
  button.title = title;
  button.setAttribute("aria-label", title);
  if (current) {
    button.classList.add("is-current");
    button.setAttribute("aria-current", "step");
  }
  if (outcome) button.classList.add(`is-${outcome}`);
  button.addEventListener("click", onClick);
  li.append(button);
  return li;
}

function renderNavigation({ state, data, save, render }) {
  const nav = $("#question-nav");
  const inQuiz = state.phase === "quiz";
  nav.hidden = !inQuiz;
  $("#toolbar").hidden = !inQuiz;
  const list = $("#question-grid");
  list.replaceChildren();
  if (!inQuiz) return;

  const goTo = (target) => () => {
    state.cur = target;
    save();
    render();
  };
  state.sel.forEach((id, k) => {
    const q = data.byId[id];
    list.append(
      navButton(String(k + 1), `Vraag ${k + 1} · ${data.topicNames[q.topic]}`, {
        current: state.cur === k,
        outcome: answerOutcome(q, state.ans[id]),
        onClick: goTo(k),
      })
    );
  });
  list.append(navButton("✓", "Resultaat", { current: state.cur === "end", onClick: goTo("end") }));
}

export function renderHeader(ctx) {
  renderScore(ctx);
  renderNavigation(ctx);
}
