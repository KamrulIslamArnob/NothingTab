/**
 * Tiny toast helper. Uses #toast defined in newTab.html.
 * Stays a self-contained singleton so any view can call `toast.show(msg)`.
 */
export class ToastView {
  /** @param {string} id element id of the toast node */
  constructor(id = "toast") {
    this.node = document.getElementById(id);
    this.timer = null;
  }

  /** @param {string} message @param {{ error?: boolean, durationMs?: number }} [opts] */
  show(message, opts = {}) {
    if (!this.node) return;
    this.node.textContent = message;
    this.node.classList.toggle("is-error", !!opts.error);
    this.node.classList.add("is-visible");
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.node.classList.remove("is-visible");
    }, opts.durationMs ?? 2400);
  }
}
