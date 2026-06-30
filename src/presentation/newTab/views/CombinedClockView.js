import { el } from "../../shared/dom.js";
import { icon } from "../../shared/icons.js";
import { PomodoroService } from "./PomodoroService.js";

function formatTimeForZone(timezone, is24h, showSeconds) {
  const opts = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !is24h,
  };
  if (showSeconds) opts.second = "2-digit";
  if (timezone) opts.timeZone = timezone;
  try {
    return new Intl.DateTimeFormat("en-US", opts).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: undefined }).format(new Date());
  }
}

function getUtcOffset(timezone) {
  if (!timezone) return "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const offset = parts.find(p => p.type === "timeZoneName")?.value ?? "UTC";
    return offset.replace("GMT", "UTC");
  } catch {
    return "UTC";
  }
}

function isDaytime(timezone) {
  if (!timezone) return true;
  try {
    const hour = parseInt(
      new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", hour12: false }).format(new Date()),
      10
    );
    return hour >= 6 && hour < 18;
  } catch {
    return true;
  }
}

export class CombinedClockView {
  constructor({ clock }) {
    this.clock = clock;
    this.intervalId = null;
    this.pomodoro = new PomodoroService();
    this.mode = "clock"; // "clock" | "pomodoro"
    this.unsub = null;
    this.root = null;
    this.settings = null;
  }

  render(settings) {
    this.settings = settings;
    this.root = el("div", { className: "combined-clock-widget" });
    this._buildClockMode();

    this.unsub = this.pomodoro.onTick(() => {
      if (this.mode === "pomodoro") this._buildPomodoroMode();
    });

    return this.root;
  }

  _buildClockMode() {
    if (this.intervalId) clearInterval(this.intervalId);
    this._renderClock();
    this.intervalId = setInterval(() => this._renderClock(), 1000);
  }

  _renderClock() {
    if (!this.root || this.mode !== "clock") return;
    const settings = this.settings;
    const fmt = settings?.timeFormat;
    const is24h = fmt?.equals?.("24h") ?? (fmt?.value === "24h") ?? false;
    
    // Main Time
    const mainTimeStr = formatTimeForZone(undefined, is24h, true);
    const mainTimeEl = el("h1", {
      className: "ccw-main-time",
      title: "Click to start Pomodoro timer",
    }, mainTimeStr);
    
    mainTimeEl.addEventListener("click", () => this._switchToPomodoro());

    const topSection = el("div", { className: "ccw-top" }, mainTimeEl);
    const divider = el("div", { className: "ccw-divider" });

    // World Time (Default Barcelona as requested)
    const c = { name: "Barcelona", timezone: "Europe/Madrid", country: "Spain" };
    const offset = getUtcOffset(c.timezone);
    const dayIcon = icon(isDaytime(c.timezone) ? "sun" : "moon");
    dayIcon.classList.add("ccw-moon-icon");

    const worldTimeStr = formatTimeForZone(c.timezone, is24h, false);

    const bottomSection = el("div", { className: "ccw-bottom" },
      el("div", { className: "ccw-icon-col" }, dayIcon),
      el("div", { className: "ccw-info-col" },
        el("div", { className: "ccw-world-title" }, `WORLD CLOCK (${c.name})`),
        el("div", { className: "ccw-world-detail" }, `TIMEZONE: ${offset}`),
        el("div", { className: "ccw-world-detail" }, c.country)
      ),
      el("div", { className: "ccw-time-col" },
        el("div", { className: "ccw-world-time" }, worldTimeStr)
      )
    );

    this.root.replaceChildren(topSection, divider, bottomSection);
  }

  _switchToPomodoro() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.mode = "pomodoro";
    this._buildPomodoroMode();
  }

  _buildPomodoroMode() {
    if (!this.root) return;
    const pomo = this.pomodoro;
    const modeLabel = pomo.mode === "work" ? "FOCUS" : pomo.mode === "break" ? "BREAK" : "READY";
    const timeStr = pomo.mode === "idle" ? "25:00" : pomo.formatTime(pomo.timeLeft);

    const timeEl = el("h1", {
      className: "ccw-main-time pomodoro-active" + (pomo.mode === "break" ? " pomo-break" : ""),
      title: "Pomodoro timer",
    }, timeStr);

    const labelEl = el("div", { className: "pomo-label", style: "text-align: center; margin-bottom: 16px; font-weight: bold; color: var(--accent-red);" }, modeLabel);

    const controls = el("div", { className: "pomo-controls", style: "display: flex; justify-content: center; gap: 8px; margin-top: 16px;" });

    const toggleBtn = el("button", { type: "button", className: "pomo-btn" }, pomo.isRunning ? "PAUSE" : "START");
    toggleBtn.addEventListener("click", () => pomo.toggle());

    const resetBtn = el("button", { type: "button", className: "pomo-btn pomo-btn--ghost" }, "RESET");
    resetBtn.addEventListener("click", () => pomo.reset());

    const clockBtn = el("button", { type: "button", className: "pomo-btn pomo-btn--ghost" }, "CLOCK");
    clockBtn.addEventListener("click", () => {
      pomo.reset();
      this.mode = "clock";
      this._buildClockMode();
    });

    controls.append(toggleBtn, resetBtn, clockBtn);
    
    const topSection = el("div", { className: "ccw-top", style: "flex-direction: column;" }, labelEl, timeEl, controls);
    
    this.root.replaceChildren(topSection);
  }

  destroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    if (this.unsub) this.unsub();
    this.pomodoro.destroy();
  }
}
