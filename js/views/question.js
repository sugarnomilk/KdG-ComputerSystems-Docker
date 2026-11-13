// Question screen: one question, its answer inputs and the feedback after confirming.
import { OPTION_LETTERS, TYPE_LABELS } from "../config.js";
import { $, action, cloneTemplate, el, field, scrollToTop } from "../dom.js";
import { grade, outcome } from "../quiz.js";
import { buildIssueUrl } from "../report.js";
import { createAnswer } from "../state.js";
import { formatNumber } from "../util.js";
import { VERSION } from "../config.js";

function pointsLabel(pts) {
  return `${pts} punt${pts > 1 ? "en" : ""}`;
}

function fillExplanation(list, lines) {
  list.replaceChildren(
    ...lines.map((html) => {
      const li = el("li");
      li.innerHTML = html;
      return li;
    })
  );
}

/** Feedback block for an open question: model answer plus self-assessment. */
function openResult(q, a, onSelfAssess) {
  const result = cloneTemplate("tpl-result-open");
  const box = result.firstElementChild;
  if (a.self != null) box.classList.add(`is-${outcome(a.self, q.pts)}`);
  fillExplanation(field(result, "model"), q.model);

  const assess = field(result, "self-assess");
  const verdict = field(result, "self-verdict");
  if (a.self == null) {
    const labels = [
      [q.pts, `Juist (${q.pts})`],
      [q.pts / 2, `Half (${formatNumber(q.pts / 2)})`],
      [0, "Fout (0)"],
    ];
    assess.querySelectorAll("button").forEach((button, i) => {
      button.textContent = labels[i][1];
      button.addEventListener("click", () => onSelfAssess(labels[i][0]));
    });
  } else {
    assess.hidden = true;
    verdict.hidden = false;
    verdict.textContent = `Jouw beoordeling: ${formatNumber(a.self)} / ${q.pts}`;
  }
  return result;
}

/** Feedback block for a closed question: verdict, correct answer and explanation. */
function closedResult(q, a) {
  const result = cloneTemplate("tpl-result");
  const kind = outcome(a.pts, q.pts);
  result.firstElementChild.classList.add(`is-${kind}`);
  field(result, "title").textContent = `${
    { correct: "Juist!", wrong: "Fout", partial: "Gedeeltelijk juist" }[kind]
  } · ${formatNumber(a.pts)} / ${q.pts}`;

  const answer = field(result, "answer");
  if (q.opts) {
    const letters = el("b", "", q.ok.map((j) => OPTION_LETTERS[j]).join(", "));
    answer.replaceChildren(letters);
  } else {
    answer.innerHTML = q.answer;
  }
  const explanation = field(result, "explanation");
  if (q.ex) fillExplanation(explanation, q.ex);
  else explanation.remove();
  return result;
}

function buildOptions(fieldset, q, a) {
  const inputType = q.type === "mc" ? "radio" : "checkbox";
  q.opts.forEach((html, j) => {
    const option = cloneTemplate("tpl-option");
    const label = option.firstElementChild;
    const input = label.querySelector("input");
    input.type = inputType;
    input.value = j;
    input.checked = a.sel.includes(j);
    input.disabled = a.done;
    label.querySelector(".option-letter").textContent = `${OPTION_LETTERS[j]}.`;
    label.querySelector(".option-text").innerHTML = html;
    if (a.done) {
      const chosen = a.sel.includes(j);
      const correct = q.ok.includes(j);
      if (correct && chosen) label.classList.add("is-correct");
      else if (chosen) label.classList.add("is-wrong");
      else if (correct) label.classList.add("is-missed");
    }
    fieldset.append(option);
  });
}

export function renderQuestion(ctx) {
  const { data, state, save, render } = ctx;
  const k = state.cur;
  const id = state.sel[k];
  const q = data.byId[id];
  const total = state.sel.length;
  const a = state.ans[id] || (state.ans[id] = createAnswer());

  const screen = cloneTemplate("tpl-question");
  const card = field(screen, "card");
  const error = field(screen, "error");
  card.classList.toggle("is-locked", a.done);
  field(screen, "number").textContent = `Vraag ${k + 1} / ${total}`;
  field(screen, "kind").textContent = `${TYPE_LABELS[q.type]} · ${pointsLabel(q.pts)}`;
  field(screen, "topic").textContent = data.topicNames[q.topic];
  field(screen, "text").innerHTML = q.q;
  field(screen, "multi-hint").hidden = q.type !== "multi";
  field(screen, "source").textContent = q.source;
  field(screen, "report").href = buildIssueUrl(q, a, data.topicNames[q.topic], VERSION);

  const clearError = () => {
    error.textContent = "";
  };

  // Answer input, depending on the question type.
  if (q.type === "mc" || q.type === "multi") {
    const fieldset = field(screen, "options");
    fieldset.hidden = false;
    buildOptions(fieldset, q, a);
    fieldset.addEventListener("change", () => {
      a.sel = [...fieldset.querySelectorAll("input:checked")].map((input) => +input.value);
      clearError();
      save();
    });
  } else if (q.type === "fill") {
    const wrapper = field(screen, "fill");
    const input = wrapper.querySelector("input");
    wrapper.hidden = false;
    input.value = a.text;
    input.disabled = a.done;
    input.addEventListener("input", () => {
      a.text = input.value;
      clearError();
      save();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") confirmAnswer();
    });
  } else {
    const wrapper = field(screen, "open");
    const textarea = wrapper.querySelector("textarea");
    wrapper.hidden = false;
    textarea.value = a.text;
    textarea.disabled = a.done;
    textarea.addEventListener("input", () => {
      a.text = textarea.value;
      clearError();
      save();
    });
  }

  // Feedback or the confirm button.
  const confirmButton = action(screen, "confirm");
  if (a.done) {
    const feedback =
      q.type === "open"
        ? openResult(q, a, (points) => {
            a.self = points;
            a.pts = points;
            save();
            render();
          })
        : closedResult(q, a);
    field(screen, "feedback").append(feedback);
    confirmButton.parentElement.remove();
  } else {
    confirmButton.addEventListener("click", confirmAnswer);
  }

  // Previous / next.
  const prev = action(screen, "prev");
  const next = action(screen, "next");
  prev.disabled = k === 0;
  next.textContent = k === total - 1 ? "Naar resultaat →" : "Volgende →";
  const goTo = (target) => () => {
    state.cur = target;
    save();
    render();
    scrollToTop();
  };
  prev.addEventListener("click", goTo(k - 1));
  next.addEventListener("click", goTo(k === total - 1 ? "end" : k + 1));

  $("#main").replaceChildren(screen);

  function confirmAnswer() {
    if ((q.type === "mc" || q.type === "multi") && !a.sel.length) {
      error.textContent = "Duid eerst een antwoord aan.";
      return;
    }
    if ((q.type === "fill" || q.type === "open") && !a.text.trim()) {
      error.textContent = "Vul eerst een antwoord in.";
      return;
    }
    a.done = true;
    a.pts = grade(q, a);
    save();
    render();
  }
}
