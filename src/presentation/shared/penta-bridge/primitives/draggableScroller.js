/**
 * Penta Bridge — draggableScroller primitive
 * --------------------------------------------------------------------
 * Stateless factory that wires grab-and-drag horizontal scrolling
 * plus optional button-driven smooth scrolling onto any scrollable
 * element. Returns a handle exposing imperative scroll APIs and a
 * detach() cleanup function. Knows nothing about categories, tabs,
 * or any specific consumer — the widget layer composes it.
 *
 * Usage:
 *
 *   import { attachDraggableScroll } from "...";
 *
 *   const { scrollBy, scrollTo, refresh, detach } = attachDraggableScroll(
 *     containerEl,
 *     {
 *       leftButton:   prevBtnEl,    // optional
 *       rightButton:  nextBtnEl,    // optional
 *       stepPx:       200,
 *       onClickGuard: (e) => { ... }, // optional: cancel click if drag
 *     }
 *   );
 *
 * Button visibility: when leftButton / rightButton are passed, the
 * factory toggles a `is-disabled` attribute (and the matching CSS
 * class) based on whether scroll overflow exists in that direction.
 * The caller can subscribe via refresh() after layout changes.
 */

const DRAG_THRESHOLD_PX = 5;        // px before a press is a drag, not a click
const DRAG_MULTIPLIER   = 1.5;      // mouse-pixel → scroll-pixel ratio

/**
 * @typedef {Object} DraggableScrollOptions
 * @property {HTMLButtonElement} [leftButton]   — scrolls left on click
 * @property {HTMLButtonElement} [rightButton]  — scrolls right on click
 * @property {number} [stepPx=200]               — button step distance
 * @property {(event: MouseEvent) => void} [onClickGuard] — fires after drag
 *           detected; useful to swallow a click that ended a drag.
 */

/**
 * @typedef {Object} DraggableScrollHandle
 * @property {(delta: number) => void} scrollBy
 * @property {(target: number) => void} scrollTo
 * @property {() => void} refresh      — recompute button disabled state
 * @property {() => void} detach       — remove all listeners
 */

/**
 * Attach drag-to-scroll + button nav to a container.
 *
 * @param {HTMLElement} container
 * @param {DraggableScrollOptions} [options]
 * @returns {DraggableScrollHandle}
 */
export function attachDraggableScroll(container, options = {}) {
  if (!container) throw new Error("attachDraggableScroll: container is required");

  const {
    leftButton,
    rightButton,
    stepPx = 200,
    onClickGuard,
    disableDragScroll = false,
  } = options;

  // ── State (closure-scoped; the primitive is single-use per element)
  let isDown = false;
  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;
  let activePointerId = null;

  function onPointerDown(event) {
    if (disableDragScroll) return;
    
    // Only primary button / single touch / pen — ignore right-click etc.
    if (event.button !== undefined && event.button !== 0) return;
    
    // If the user is trying to natively drag an item, don't intercept for scrolling
    if (event.target.closest('[draggable="true"]')) return;

    isDown = true;
    isDragging = false;
    activePointerId = event.pointerId;
    startX = event.pageX;
    startScrollLeft = container.scrollLeft;
    container.classList.add("is-active");
  }

  function onPointerMove(event) {
    if (!isDown) return;
    if (activePointerId !== null && event.pointerId !== activePointerId) return;
    const dx = event.pageX - startX;
    if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD_PX) {
      isDragging = true;
      // Prevent native link/image drag mid-drag
      event.preventDefault();
    }
    if (isDragging) {
      event.preventDefault();
      container.scrollLeft = startScrollLeft - dx * DRAG_MULTIPLIER;
    }
  }

  function endDrag() {
    if (!isDown) return;
    isDown = false;
    container.classList.remove("is-active");
    activePointerId = null;
    refresh();
  }

  // ── Click guard: swallow the click that ended a drag
  function onClickCapture(event) {
    if (isDragging) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof onClickGuard === "function") onClickGuard(event);
      isDragging = false;
    }
  }

  // ── Wheel: translate vertical wheel to horizontal scroll for trackpads
  // that emit vertical delta only. Real horizontal trackpad gestures still
  // scroll natively; this just adds support for the common "vertical-only"
  // case (Shift+wheel users also get a horizontal feel).
  function onWheel(event) {
    if (event.deltaY === 0) return;
    // If the user is already scrolling horizontally, leave it alone.
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    container.scrollLeft += event.deltaY;
    event.preventDefault();
  }

  // ── Buttons
  function bindButton(button, direction) {
    if (!button) return;
    button.addEventListener("click", () => {
      const delta = direction === "left" ? -stepPx : stepPx;
      scrollBy(delta);
    });
  }
  bindButton(leftButton,  "left");
  bindButton(rightButton, "right");

  // ── Wiring
  container.addEventListener("pointerdown",  onPointerDown);
  container.addEventListener("pointermove",  onPointerMove);
  container.addEventListener("pointerup",    endDrag);
  container.addEventListener("pointercancel",endDrag);
  container.addEventListener("pointerleave", endDrag);
  container.addEventListener("click",        onClickCapture, true);
  container.addEventListener("wheel",        onWheel, { passive: false });

  // Re-evaluate button state when content size changes (categories added/removed).
  // ResizeObserver is the cleanest signal that overflow bounds changed.
  let observer = null;
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(() => refresh());
    observer.observe(container);
    for (const child of container.children) observer.observe(child);
  }
  window.addEventListener("resize", refresh);

  refresh();

  // ── Public API
  function scrollBy(delta) {
    container.scrollBy({ left: delta, top: 0, behavior: "smooth" });
    // Slight delay so the post-smooth-scroll overflow state is accurate.
    setTimeout(refresh, 250);
  }

  function scrollTo(target) {
    container.scrollTo({ left: target, top: 0, behavior: "smooth" });
    setTimeout(refresh, 250);
  }

  function refresh() {
    const maxScroll = container.scrollWidth - container.clientWidth;
    const canLeft  = container.scrollLeft > 1;
    const canRight = container.scrollLeft < maxScroll - 1;
    if (leftButton)  toggleDisabled(leftButton,  !canLeft);
    if (rightButton) toggleDisabled(rightButton, !canRight);
  }

  function detach() {
    container.removeEventListener("pointerdown",   onPointerDown);
    container.removeEventListener("pointermove",   onPointerMove);
    container.removeEventListener("pointerup",     endDrag);
    container.removeEventListener("pointercancel", endDrag);
    container.removeEventListener("pointerleave",  endDrag);
    container.removeEventListener("click",         onClickCapture, true);
    container.removeEventListener("wheel",         onWheel);
    window.removeEventListener("resize", refresh);
    if (observer) observer.disconnect();
  }

  return { scrollBy, scrollTo, refresh, detach };
}

function toggleDisabled(button, isDisabled) {
  button.toggleAttribute("disabled", isDisabled);
  button.classList.toggle("is-disabled", isDisabled);
  button.setAttribute("aria-hidden", isDisabled ? "true" : "false");
}