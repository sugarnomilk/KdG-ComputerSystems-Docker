// Result screen: totals, per topic, per question and a copyable report.
import { VERSION } from "../config.js";
import { $, action, cloneTemplate, el, field, scrollToTop, summaryRow } from "../dom.js";
import { buildReport, summarize } from "../quiz.js";
import { formatNumber } from "../util.js";

function toneFor(ratio) {
  return ratio >= 0.75 ? "tone-ok" : ratio >= 0.5 ? "tone-warn" : "tone-bad";
}

export function renderEnd(ctx) {
  const { data, state, save, render } = ctx;
  const summary = summarize(state, data);
  const screen = cloneTemplate("tpl-end");

  field(screen, "score").textContent = `${formatNumber(summary.got)} / ${summary.max}`;
  field(screen, "bar").setAttribute("aria-valuenow", summary.pct);
  field(screen, "bar-fill").style.width = `${summary.pct}%`;
  const openText = summary.open
    ? ` · nog ${summary.open} vra${summary.open > 1 ? "gen" : "ag"} open`
    : "";
  field(screen, "percentage").textContent = `${summary.pct}%${openText}`;

  field(screen, "by-topic").append(
    ...data.topics
      .filter((t) => summary.perTopic[t.id].max)
      .map((t) => {
        const { got, max } = summary.perTopic[t.id];
        return summaryRow(t.name, `${formatNumber(got)} / ${max}`, toneFor(got / max));
      })
  );

  const byQuestion = field(screen, "by-question");
  state.sel.forEach((id, k) => {
    const q = data.byId[id];
    const a = state.ans[id];
    const points = a && a.done && a.pts != null ? `${formatNumber(a.pts)} / ${q.pts}` : "—";
    const li = el("li");
    const link = el("button", "summary-link");
    link.type = "button";
    link.append(el("span", "", `Vraag ${k + 1} · ${data.topicNames[q.topic]}`), el("span", "", points));
    link.addEventListener("click", () => {
      state.cur = k;
      save();
      render();
      scrollToTop();
    });
    li.append(link);
    byQuestion.append(li);
  });

  const report = buildReport(state, data, summary, VERSION);
  const reportBox = screen.querySelector("#report");
  const copied = field(screen, "copied");
  reportBox.value = report;
  action(screen, "copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(report);
      copied.textContent = "Gekopieerd.";
    } catch (e) {
      reportBox.focus();
      reportBox.select();
      copied.textContent = "Selecteer en kopieer de tekst hierboven (Ctrl/Cmd+C).";
    }
  });
  action(screen, "again").addEventListener("click", () => {
    state.phase = "start";
    save();
    render();
    scrollToTop();
  });

  $("#main").replaceChildren(screen);
}
