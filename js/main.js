// Entry point: load the data, restore the saved state and draw the right screen.
import { $, cloneTemplate } from "./dom.js";
import { loadData } from "./data.js";
import { loadHistory, saveHistory } from "./history.js";
import { loadState, saveState } from "./state.js";
import { initHeader, renderHeader } from "./views/header.js";
import { renderStart } from "./views/start.js";
import { renderQuestion } from "./views/question.js";
import { renderEnd } from "./views/end.js";

async function init() {
  let data;
  try {
    data = await loadData();
  } catch (error) {
    console.error(error);
    $("#main").replaceChildren(cloneTemplate("tpl-load-error"));
    return;
  }

  const state = loadState(new Set(Object.keys(data.byId)));
  const history = loadHistory();
  const ctx = {
    data,
    state,
    history,
    save: () => saveState(state),
    saveHistory: () => saveHistory(history),
    render,
  };

  function render() {
    renderHeader(ctx);
    if (state.phase === "start") renderStart(ctx);
    else if (state.cur === "end") renderEnd(ctx);
    else renderQuestion(ctx);
  }

  initHeader(ctx);
  render();
}

init();
