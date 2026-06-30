/**
 * Penta Bridge — Halftone primitive
 * --------------------------------------------------------------------
 * Renders the tiny-dot grid that fills Watch.svg, Weather.svg and the
 * density fields in Mic Access.svg / Recording.svg. Every "live" widget
 * composes its surface out of these dots, so the visual rhythm stays
 * consistent across the dashboard.
 *
 *   const field = createHalftoneField({
 *     container, rows: 8, cols: 16,
 *     dotSize: 1.2766, grid: 2.9787,
 *     color: "#E7EAE9",
 *   });
 *   field.mount();                       // appends <svg> to container
 *   field.setDensity(mask);              // mask = boolean[][] of length rows
 *   field.setColor("#D71921");           // swap dot color (e.g. live state)
 *   field.pulseLive(cx, cy);             // add a pulsing red anchor dot
 *   field.destroy();                     // detach + release
 *
 * Density mask shape: mask[r][c] === true → dot visible at (r,c).
 * If mask is omitted, every dot is shown. setDensity(null) reverts to
 * "all visible" without rebuilding the SVG (cheap re-render).
 */
import { theme } from "../theme.js";

const NS = "http://www.w3.org/2000/svg";

/** Create an <ellipse> element matching the Weather.svg reference shape. */
function makeDot(cx, cy, color, size) {
  const e = document.createElementNS(NS, "ellipse");
  e.setAttribute("cx", cx.toFixed(4));
  e.setAttribute("cy", cy.toFixed(4));
  e.setAttribute("rx", size.toFixed(4));
  e.setAttribute("ry", size.toFixed(4));
  e.setAttribute("fill", color);
  return e;
}

export function createHalftoneField({
  container,
  rows = 8,
  cols = 16,
  width,
  height,
  dotSize = theme.halftone.dotSize,
  grid = theme.halftone.grid,
  color = theme.halftone.color,
  colorLive = theme.halftone.colorLive,
  originX = grid,
  originY = grid,
} = {}) {
  if (!container) throw new Error("[halftone] container is required");

  // SVG sizing: prefer explicit width/height, otherwise fall back to
  // container client size or a sensible default.
  const w = width ?? container.clientWidth ?? cols * grid;
  const h = height ?? container.clientHeight ?? rows * grid;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.classList.add("pb-halftone");
  svg.style.display = "block";

  // Two layers: base dots + optional live anchor (drawn last so it
  // always sits on top, even when density mask hides neighbours).
  const baseLayer = document.createElementNS(NS, "g");
  baseLayer.setAttribute("class", "pb-halftone__base");
  const liveLayer = document.createElementNS(NS, "g");
  liveLayer.setAttribute("class", "pb-halftone__live");
  svg.append(baseLayer, liveLayer);

  // Pre-bake every dot element once. Density mask only toggles
  // `display`, never creates/removes nodes — keeps the dot grid cheap
  // to re-render (used by clock minutes and weather cloud %).
  const dotGrid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const cx = originX + c * grid;
      const cy = originY + r * grid;
      const dot = makeDot(cx, cy, color, dotSize);
      baseLayer.appendChild(dot);
      row.push(dot);
    }
    dotGrid.push(row);
  }

  let mounted = false;

  function mount() {
    if (mounted) return;
    container.appendChild(svg);
    mounted = true;
  }

  function destroy() {
    if (!mounted) return;
    svg.remove();
    mounted = false;
    // Drop references so GC can reclaim the dot nodes.
    dotGrid.length = 0;
    while (liveLayer.firstChild) liveLayer.removeChild(liveLayer.firstChild);
  }

  /** Toggle dot visibility by row mask. mask[r][c] === true → visible. */
  function setDensity(mask) {
    for (let r = 0; r < rows; r++) {
      const row = mask ? mask[r] : null;
      for (let c = 0; c < cols; c++) {
        const dot = dotGrid[r][c];
        const visible = !row || row[c];
        dot.style.display = visible ? "" : "none";
      }
    }
  }

  /** Set the same opacity multiplier across all dots. */
  function setOpacity(opacity) {
    baseLayer.setAttribute("opacity", String(opacity));
  }

  /** Re-color every dot in the base layer. */
  function setColor(newColor) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dotGrid[r][c].setAttribute("fill", newColor);
      }
    }
  }

  /** Add (or update) a single pulsing red anchor at (cx,cy). */
  let livePulse = null;
  function pulseLive(cx, cy, size = dotSize * 1.5) {
    if (!livePulse) {
      livePulse = document.createElementNS(NS, "circle");
      livePulse.setAttribute("r", size.toFixed(4));
      livePulse.setAttribute("fill", colorLive);
      livePulse.classList.add("pb-halftone__pulse");
      liveLayer.appendChild(livePulse);
    }
    livePulse.setAttribute("cx", cx.toFixed(4));
    livePulse.setAttribute("cy", cy.toFixed(4));
  }

  function clearLive() {
    if (livePulse) {
      livePulse.remove();
      livePulse = null;
    }
  }

  /** Expose dot (c,r) DOM node so a widget can animate individual dots. */
  function dotAt(r, c) {
    return dotGrid[r]?.[c] ?? null;
  }

  return {
    svg,
    mount,
    destroy,
    setDensity,
    setOpacity,
    setColor,
    pulseLive,
    clearLive,
    dotAt,
    get rows() { return rows; },
    get cols() { return cols; },
    get grid() { return grid; },
  };
}