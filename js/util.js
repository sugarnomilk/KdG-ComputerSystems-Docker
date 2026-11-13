// Small pure helpers.

/** Round to one decimal and use a decimal comma: 1.5 -> "1,5". */
export const formatNumber = (x) => (Math.round(x * 10) / 10).toString().replace(".", ",");

/** In-place Fisher–Yates shuffle. `random` can be replaced in tests. */
export function shuffle(items, random = Math.random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Today as YYYY-MM-DD in local time. */
export function formatDate(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
