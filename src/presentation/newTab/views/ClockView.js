import { el } from "../../shared/dom.js";
import { PomodoroService } from "./PomodoroService.js";

export class ClockView {
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
    this.root = el("div", { className: "clock-root center-aligned" });
    this._buildClockMode();

    // Subscribe to pomodoro ticks
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
    const isH12 = (fmt?.value === "12h" || fmt === "12h") ?? false;
    const showSeconds = settings?.showSeconds === true;
    const now = this.clock.now();

    const opts = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: isH12,
    };
    if (showSeconds) opts.second = "2-digit";

    const time = new Intl.DateTimeFormat(undefined, opts).format(now);

    const timeEl = el("h1", {
      className: "clock-time-large",
      title: "Click to start Pomodoro timer",
      style: "cursor: pointer",
    }, time);

    timeEl.addEventListener("click", () => this._switchToPomodoro());

    const placeholder = el("div", { className: "clock-placeholder" });

    const frame = el("div", { className: "clock-frame" },
      placeholder,
      timeEl
    );

    this.root.replaceChildren(frame);
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
      className: "clock-time-large pomodoro-active" + (pomo.mode === "break" ? " pomo-break" : ""),
      title: "Pomodoro timer",
    }, timeStr);

    const labelEl = el("div", { className: "pomo-label" }, modeLabel);

    const controls = el("div", { className: "pomo-controls" });

    const toggleBtn = el("button", {
      type: "button",
      className: "pomo-btn",
      title: pomo.isRunning ? "Pause" : "Start",
    }, pomo.isRunning ? "PAUSE" : "START");
    toggleBtn.addEventListener("click", () => pomo.toggle());

    const resetBtn = el("button", {
      type: "button",
      className: "pomo-btn pomo-btn--ghost",
      title: "Reset",
    }, "RESET");
    resetBtn.addEventListener("click", () => pomo.reset());

    const clockBtn = el("button", {
      type: "button",
      className: "pomo-btn pomo-btn--ghost",
      title: "Back to clock",
    }, "CLOCK");
    clockBtn.addEventListener("click", () => {
      pomo.reset();
      this.mode = "clock";
      this._buildClockMode();
    });

    controls.append(toggleBtn, resetBtn, clockBtn);
    this.root.replaceChildren(labelEl, timeEl, controls);
  }

  destroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    if (this.unsub) this.unsub();
    this.pomodoro.destroy();
  }
}
