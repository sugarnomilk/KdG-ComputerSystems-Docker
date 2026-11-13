// DOM helpers: templates, field lookup and element creation.

export const $ = (selector, root = document) => root.querySelector(selector);

/** Clone the content of a <template id="..."> from index.html. */
export function cloneTemplate(id) {
  return document.getElementById(id).content.cloneNode(true);
}

/** Find the element marked data-field="name" inside root. */
export function field(root, name) {
  return root.querySelector(`[data-field="${name}"]`);
}

/** Find the element marked data-action="name" inside root. */
export function action(root, name) {
  return root.querySelector(`[data-action="${name}"]`);
}

/** Create an element with an optional class and text. */
export function el(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** A list row with a label on the left and a value on the right. */
export function summaryRow(label, value, valueClass = "") {
  const li = el("li");
  li.append(el("span", "", label), el("span", valueClass, value));
  return li;
}

export const scrollToTop = () => window.scrollTo(0, 0);
