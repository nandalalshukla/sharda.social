/**
 * iOS can't present a modal while another is still animating out — the
 * second one is silently dropped (or, worse, dismissed along with the first).
 * Several flows do exactly that: close the post-options sheet, then open a
 * confirm dialog or the report sheet. Anything that opens a modal consults
 * this first and waits for the previous one to finish leaving.
 */
const SETTLE_MS = 280;
let closedAt = 0;

export const markModalClosing = () => {
  closedAt = Date.now();
};

/** How long a new modal should hold off, in ms (0 when nothing just closed). */
export const modalSettleDelay = () => Math.max(0, closedAt + SETTLE_MS - Date.now());

export const waitForModalsToSettle = () =>
  new Promise<void>((resolve) => setTimeout(resolve, modalSettleDelay()));
