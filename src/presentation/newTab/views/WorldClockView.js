import { el } from "../../shared/dom.js";
import { icon } from "../../shared/icons.js";

function formatTimeForZone(timezone, is24h) {
  const opts = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !is24h,
  };
  if (timezone) opts.timeZone = timezone;
  try {
    return new Intl.DateTimeFormat("en-US", opts).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: !is24h }).format(new Date());
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

export class WorldClockView {
  constructor({ clock }) {
    this.clock = clock;
    this.intervalId = null;
    this.settings = null;
    this.root = null;
  }

  render(settings) {
    this.settings = settings;
    this.root = el("div", { className: "nothing-widget world-clock-widget" });
    this.update();

    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.update(), 1000);

    return this.root;
  }

  update() {
    if (!this.root || !this.settings) return;

    const fmt = this.settings.timeFormat;
    const is24h = fmt?.equals?.("24h") ?? (fmt?.value === "24h") ?? false;

    const header = el("div", { className: "nw-header" },
      el("span", { className: "nw-title" },
        "WORLD CLOCK ",
        el("span", { className: "badge-dot", style: "margin-left: 6px; margin-right: 0;" })
      )
    );

    const body = el("div", { className: "calendar-body" });
    
    const c = { name: "Barcelona", timezone: "Europe/Madrid", country: "Spain" };
    const timeStr = formatTimeForZone(c.timezone, is24h);
    const pTimeParts = timeStr.split(" ");
    const timeVal = pTimeParts[0]; 
    const amPm = pTimeParts[1] || ""; 
    
    const leftCol = el("div", { className: "cal-left-col", style: { width: "auto", paddingRight: "16px" } },
      el("div", { className: "cal-day-number", style: { fontSize: "28px", marginBottom: "4px" } }, timeVal),
      el("div", { className: "cal-month-label" }, amPm)
    );

    const rightCol = el("div", { className: "cal-right-col" });
    const agendaList = el("div", { className: "cal-agenda-list" });
    
    const offset = getUtcOffset(c.timezone);
    const dayIcon = icon(isDaytime(c.timezone) ? "sun" : "moon");
    dayIcon.classList.add("wc-day-icon");

    agendaList.append(
      el("div", { className: "cal-event" },
        el("div", { className: "cal-event-time", style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, 
           "TIMEZONE: " + offset, dayIcon),
        el("div", { className: "cal-event-label", style: { marginTop: "4px" } }, c.name.toUpperCase() + ", " + c.country.toUpperCase())
      )
    );
    
    rightCol.appendChild(agendaList);
    body.append(leftCol, rightCol);

    this.root.replaceChildren(header, body);
  }

  destroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }
}
