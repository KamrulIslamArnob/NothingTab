const SVG_NS = "http://www.w3.org/2000/svg";

const ICONS = Object.freeze({
  plus: [
    ["path", { d: "M12 5v14" }],
    ["path", { d: "M5 12h14" }],
  ],
  search: [
    ["circle", { cx: "11", cy: "11", r: "7" }],
    ["path", { d: "m20 20-3.5-3.5" }],
  ],
  sliders: [
    ["path", { d: "M4 7h9" }],
    ["path", { d: "M17 7h3" }],
    ["circle", { cx: "15", cy: "7", r: "2" }],
    ["path", { d: "M4 17h3" }],
    ["path", { d: "M11 17h9" }],
    ["circle", { cx: "9", cy: "17", r: "2" }],
  ],
  external: [
    ["path", { d: "M14 4h6v6" }],
    ["path", { d: "m10 14 10-10" }],
    ["path", { d: "M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" }],
  ],
  edit: [
    ["path", { d: "M12 20h9" }],
    ["path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" }],
  ],
  trash: [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M8 6V4h8v2" }],
    ["path", { d: "M6 6l1 14h10l1-14" }],
  ],
  check: [
    ["path", { d: "m5 13 4 4L19 7" }],
  ],
  x: [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }],
  ],
  arrowRight: [
    ["path", { d: "M5 12h14" }],
    ["path", { d: "m13 6 6 6-6 6" }],
  ],
  calendar: [
    ["rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }],
    ["line", { x1: "16", y1: "2", x2: "16", y2: "6" }],
    ["line", { x1: "8", y1: "2", x2: "8", y2: "6" }],
    ["line", { x1: "3", y1: "10", x2: "21", y2: "10" }],
  ],
  chevronLeft: [
    ["path", { d: "m15 18-6-6 6-6" }],
  ],
  chevronRight: [
    ["path", { d: "m9 18 6-6-6-6" }],
  ],
  sparkle: [
    ["path", { d: "M12 3v2" }],
    ["path", { d: "M12 19v2" }],
    ["path", { d: "M3 12h2" }],
    ["path", { d: "M19 12h2" }],
    ["path", { d: "m5.6 5.6 1.4 1.4" }],
    ["path", { d: "m17 17 1.4 1.4" }],
    ["path", { d: "m17 5.6-1.4 1.4" }],
    ["path", { d: "m5.6 18.4 1.4-1.4" }],
    ["path", { d: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" }],
  ],
  grip: [
    ["circle", { cx: "9", cy: "6", r: "1", fill: "currentColor", stroke: "none" }],
    ["circle", { cx: "15", cy: "6", r: "1", fill: "currentColor", stroke: "none" }],
    ["circle", { cx: "9", cy: "12", r: "1", fill: "currentColor", stroke: "none" }],
    ["circle", { cx: "15", cy: "12", r: "1", fill: "currentColor", stroke: "none" }],
    ["circle", { cx: "9", cy: "18", r: "1", fill: "currentColor", stroke: "none" }],
    ["circle", { cx: "15", cy: "18", r: "1", fill: "currentColor", stroke: "none" }],
  ],
  sun: [
    ["circle", { cx: "12", cy: "12", r: "4" }],
    ["path", { d: "M12 2v2" }],
    ["path", { d: "M12 20v2" }],
    ["path", { d: "m4.93 4.93 1.41 1.41" }],
    ["path", { d: "m17.66 17.66 1.41 1.41" }],
    ["path", { d: "M2 12h2" }],
    ["path", { d: "M20 12h2" }],
    ["path", { d: "m6.34 17.66-1.41 1.41" }],
    ["path", { d: "m19.07 4.93-1.41 1.41" }],
  ],
  moon: [
    ["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }],
  ],
  grid: [
    ["rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }],
    ["rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }],
    ["rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }],
    ["rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" }],
  ],
  settings: [
    ["path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }],
    ["circle", { cx: "12", cy: "12", r: "3" }],
  ],
  youtube: [
    ["path", { d: "M2.5 7.1C2.5 5.7 3.6 4.5 5.1 4.5h13.8c1.5 0 2.6 1.2 2.6 2.6v9.8c0 1.4-1.1 2.6-2.6 2.6H5.1c-1.5 0-2.6-1.2-2.6-2.6V7.1Z" }],
    ["path", { d: "m9.8 10.7 5.7 2.6-5.7 2.6v-5.2Z" }]
  ],
});

export function icon(name, className = "icon") {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  for (const [tag, attrs] of ICONS[name] || ICONS.search) {
    const child = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) {
      child.setAttribute(key, value);
    }
    svg.appendChild(child);
  }

  return svg;
}
