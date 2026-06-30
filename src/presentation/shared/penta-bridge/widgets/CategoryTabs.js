/**
 * Penta Bridge — CategoryTabs Widget
 * --------------------------------------------------------------------
 * Dumb, presentational category tab bar. Composes:
 *   • draggableScroller primitive   — drag + arrow-key scrolling
 *   • pb-tab primitive              — single tab pill
 *   • pb-scroll-arrow primitive     — left / right navigation buttons
 *
 * Knows nothing about categories storage. Receives everything as
 * props, emits selection events through callbacks. Keeps the
 * shell/components pristine and the logic reusable.
 *
 * Usage:
 *
 *   const tabs = createCategoryTabs({
 *     items: [
 *       { id: "code",    label: "Code" },
 *       { id: "ai",      label: "AI" },
 *       ...
 *     ],
 *     activeId: "code",
 *     onSelect: (id) => { ... },
 *     onAdd:    ()    => { ... },
 *     onRename: (id)  => { ... },
 *   });
 *   document.body.appendChild(tabs.root);
 *
 *   // When the items list changes:
 *   tabs.update({ items, activeId });
 */

import { el } from "../../dom.js";
import { icon } from "../../icons.js";
import { attachDraggableScroll } from "../primitives/draggableScroller.js";

/**
 * @typedef {Object} CategoryItem
 * @property {string} id
 * @property {string} label
 */

/**
 * @typedef {Object} CategoryTabsProps
 * @property {CategoryItem[]} items
 * @property {string | null} activeId
 * @property {(id: string) => void} [onSelect]
 * @property {(id: string) => void} [onRename]
 * @property {() => void}          [onAdd]
 * @property {number}              [scrollStepPx=200]
 */

/**
 * @typedef {Object} CategoryTabsHandle
 * @property {HTMLElement} root
 * @property {(next: Partial<CategoryTabsProps>) => void} update
 * @property {() => void} destroy
 */

const ROOT_CLASS = "pb-category-tabs";

/**
 * Create a CategoryTabs widget.
 *
 * @param {CategoryTabsProps} props
 * @returns {CategoryTabsHandle}
 */
export function createCategoryTabs(props) {
  // ── Internal state (the widget is "dumb" — state lives here only
  //    because the DOM is the source of truth for rendering, not
  //    because the widget owns the domain).
  let currentProps = { ...props };
  let scrollHandle = null;

  // ── Root layout: [‹]  [scroller]  [›]  [+]
  const leftArrow  = makeArrowButton("left");
  const rightArrow = makeArrowButton("right");
  const scroller   = el("div", {
    className: "pb-scroller",
    role: "tablist",
    "aria-label": "Categories",
    style: { flex: "1 1 0", minWidth: "0" },
  });
  const addBtn = el("button", {
    type: "button",
    className: "pb-tab pb-tab__add",
    title: "Add Category",
    "aria-label": "Add Category",
    style: { flexShrink: "0" },
  }, "+");

  // Add button is its own element outside the scroller — that way
  // dragging on it doesn't conflict with the scroller gesture.
  addBtn.addEventListener("click", () => currentProps.onAdd?.());

  const root = el("div", {
    className: ROOT_CLASS,
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--pb-space-2)",
      width: "100%",
      minHeight: "var(--pb-space-8)",
    },
  }, leftArrow, scroller, rightArrow, addBtn);

  // ── Initial render
  paint(scroller, currentProps);
  scrollHandle = attachDraggableScroll(scroller, {
    leftButton:  leftArrow,
    rightButton: rightArrow,
    stepPx:      currentProps.scrollStepPx ?? 200,
    disableDragScroll: true,
  });

  // ── Public API
  return {
    root,
    update(next) {
      currentProps = { ...currentProps, ...next };
      paint(scroller, currentProps);
      // After the DOM updates, recompute button disabled state.
      scrollHandle?.refresh();
    },
    destroy() {
      scrollHandle?.detach();
      scrollHandle = null;
      root.remove();
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────

let activeDragTab = null;
let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;
let placeholder = null;

function paint(scroller, { items = [], activeId = null, onSelect, onRename, onReorder }) {
  scroller.replaceChildren();
  scroller.style.position = "relative";

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const isActive = item.id === activeId;
    const tab = el("button", {
      type: "button",
      className: "pb-tab" + (isActive ? " is-active" : ""),
      role: "tab",
      "aria-selected": isActive ? "true" : "false",
      title: item.label,
      dataset: { id: item.id, lastClick: "0" },
      style: { touchAction: "none" },
    }, item.label);

    tab.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      activeDragTab = tab;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      isDragging = false;
      tab.setPointerCapture(e.pointerId);
    });

    tab.addEventListener("pointermove", (e) => {
      if (!activeDragTab || activeDragTab !== tab) return;
      
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      
      if (!isDragging && Math.sqrt(dx*dx + dy*dy) > 5) {
        isDragging = true;
        
        placeholder = el("div", {
          className: "pb-tab",
          style: { visibility: "hidden", width: tab.offsetWidth + "px" }
        });
        
        const rect = tab.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        
        scroller.insertBefore(placeholder, tab);
        
        tab.style.position = "absolute";
        tab.style.zIndex = "1000";
        tab.style.left = (rect.left - scrollerRect.left + scroller.scrollLeft) + "px";
        tab.style.top = (rect.top - scrollerRect.top) + "px";
        tab.classList.add("is-dragging");
      }
      
      if (isDragging) {
        tab.style.transform = `translateX(${dx}px)`;
        
        const siblings = Array.from(scroller.children).filter(c => c !== tab && c !== placeholder && c.classList.contains("pb-tab"));
        for (const sibling of siblings) {
          const sRect = sibling.getBoundingClientRect();
          if (e.clientX > sRect.left && e.clientX < sRect.right) {
            if (e.clientX < sRect.left + sRect.width / 2) {
               scroller.insertBefore(placeholder, sibling);
            } else {
               scroller.insertBefore(placeholder, sibling.nextSibling);
            }
            break;
          }
        }
      }
    });

    const endDrag = (e) => {
      if (!activeDragTab || activeDragTab !== tab) return;
      
      if (!isDragging) {
        if (activeDragTab === tab) {
           // Double click detection
           const now = Date.now();
           // We use a module-level variable to track the last clicked item id and time
           // because the DOM node itself might be destroyed and recreated by onSelect
           if (window.__lastTabClickId === item.id && (now - window.__lastTabClickTime < 350)) {
             onRename?.(item.id);
             window.__lastTabClickId = null;
             window.__lastTabClickTime = 0;
           } else {
             window.__lastTabClickId = item.id;
             window.__lastTabClickTime = now;
             onSelect?.(item.id);
           }
        }
      } else {
        tab.style.position = "";
        tab.style.zIndex = "";
        tab.style.left = "";
        tab.style.top = "";
        tab.style.transform = "";
        tab.classList.remove("is-dragging");
        
        if (placeholder && placeholder.parentNode) {
          placeholder.parentNode.insertBefore(tab, placeholder);
          placeholder.remove();
        }
        
        const newOrder = Array.from(scroller.children)
          .filter(c => c.dataset.id)
          .map(c => c.dataset.id);
          
        onReorder?.(newOrder);
      }
      
      activeDragTab = null;
      isDragging = false;
      placeholder = null;
    };

    tab.addEventListener("pointerup", endDrag);
    tab.addEventListener("pointercancel", endDrag);
    
    // Native dblclick is unreliable here because onSelect recreates the DOM node
    // on the first click. Handled via timing in endDrag instead.

    scroller.appendChild(tab);
  }
}

function makeArrowButton(direction) {
  const isLeft = direction === "left";
  const btn = el("button", {
    type: "button",
    className: "pb-scroll-arrow",
    "aria-label": isLeft ? "Scroll categories left" : "Scroll categories right",
    title: isLeft ? "Previous" : "Next",
  }, icon(isLeft ? "chevronLeft" : "chevronRight"));
  btn.toggleAttribute("disabled", true);
  btn.classList.add("is-disabled");
  return btn;
}