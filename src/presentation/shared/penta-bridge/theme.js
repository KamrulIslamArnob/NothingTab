/**
 * Penta Bridge — JS Theme Object (mirror of tokens.css)
 * --------------------------------------------------------------------
 * The CSS custom properties in tokens.css are the primary source of
 * truth. This module exports the same values as a plain object so any
 * non-CSS context (canvas drawing, dynamic style.setProperty calls,
 * inline style attributes) reads from the same registry. Keep the
 * two in sync — divergence between CSS and JS tokens is a bug.
 */

export const theme = Object.freeze({
  spacing: Object.freeze({
    0:  0,
    1:  4,
    2:  8,
    3:  12,
    4:  16,
    5:  20,
    6:  24,
    8:  32,
    10: 40,
    12: 48,
    16: 64,
  }),

  radius: Object.freeze({
    xs:   4,
    sm:   6,
    md:   8,
    lg:   12,
    xl:   16,
    pill: 999,
  }),

  surface: Object.freeze({
    bg:    "#000000",
    1:     "#0a0a0a",
    2:     "#141414",
    3:     "#1f1f1f",
    border:        "#2a2a2a",
    borderStrong:  "#3a3a3a",
  }),

  text: Object.freeze({
    display:  "#ffffff",
    primary:  "rgba(255, 255, 255, 0.92)",
    secondary:"rgba(255, 255, 255, 0.62)",
    muted:    "rgba(255, 255, 255, 0.38)",
    inverse:  "#111111",
  }),

  accent: Object.freeze({
    base:  "#D71921",
    soft:  "rgba(215, 25, 33, 0.12)",
    danger:"#f87171",
    success:"#34d399",
    warning:"#f6d365",
  }),

  font: Object.freeze({
    display:   "'Doto', ui-monospace, monospace",
    primary:   "'Space Grotesk', -apple-system, sans-serif",
    secondary: "'Space Mono', ui-monospace, monospace",
  }),

  fs: Object.freeze({
    xs:   10,
    sm:   12,
    base: 14,
    md:   16,
    lg:   20,
    xl:   24,
    "2xl":32,
    hero: 120,    // upper clamp; CSS does the responsive range
  }),

  motion: Object.freeze({
    easeOut:      "cubic-bezier(0.16, 1, 0.3, 1)",
    durationFast: 150,
    durationMed:  300,
    durationSlow: 500,
  }),

  z: Object.freeze({
    bg:         0,
    bgOverlay:  1,
    shell:      10,
    content:    20,
    popover:    50,
    sidebar:    80,
    toast:      100,
  }),

  shell: Object.freeze({
    padding: 32,           // px upper bound; CSS clamps responsively
    gap:     32,
    leftWidth:  360,
    rightWidth: 320,
  }),

  // Live palette — mirrors tokens.css, see comment block there.
  live: Object.freeze({
    surfaceDark:  "#1A1D1C",
    surfaceLight: "#FCFAFE",
    accent:       "#D71921",
    ink1: "#E7EAE9",
    ink2: "#AEABB1",
    ink3: "#6C696E",
    cardRadius:   20,
    tileRadius:   76,
    cardPadding:  16,
  }),

  // Halftone primitive — see primitives/halftone.js.
  halftone: Object.freeze({
    dotSize:  1.2766,   // px — ellipse rx
    grid:     2.9787,   // px — vertical pitch
    color:        "#E7EAE9",
    colorSecondary:"#AEABB1",
    colorTertiary: "#6C696E",
    colorLive:    "#D71921",
  }),
});

/**
 * Helper: convert a theme spacing key (1–16) to a CSS px string.
 * Returns a string like "16px" with no hardcoded magic numbers —
 * every spacing decision still routes through the registry.
 *
 *   spacingPx(4) -> "16px"
 *   spacingPx("md") -> spacingPx(4) -> "16px"
 */
export function spacingPx(key) {
  const k = typeof key === "string" ? key : key;
  const n = theme.spacing[k] ?? theme.spacing[Number(k)] ?? 0;
  return `${n}px`;
}
