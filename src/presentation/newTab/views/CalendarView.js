import { el } from "../../shared/dom.js";
import { icon } from "../../shared/icons.js";



export class CalendarView {
  constructor() {
    this.currentDate = new Date();
    this.currentDate = new Date();
  }

  render(settings) {
    this._settings = settings;
    this.root = el("div", { className: "nothing-widget calendar-widget" });
    this._buildGrid();
    return this.root;
  }


  _buildGrid() {
    this.root.replaceChildren();

    const today = new Date();
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const monthStr = this.currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
    const prevBtn = el("button", { type: "button", className: "cal-nav-btn" }, "‹");
    prevBtn.addEventListener("click", () => {
      this.currentDate.setMonth(month - 1);
      this._buildGrid();
    });
    const nextBtn = el("button", { type: "button", className: "cal-nav-btn" }, "›");
    nextBtn.addEventListener("click", () => {
      this.currentDate.setMonth(month + 1);
      this._buildGrid();
    });

    const monthHeader = el("div", { className: "cal-grid-header" },
      prevBtn,
      el("span", { className: "cal-month-title" }, monthStr),
      nextBtn
    );

    const grid = el("div", { className: "cal-grid-cells" });
    ["S","M","T","W","T","F","S"].forEach(d => {
      grid.appendChild(el("div", { className: "cal-cell cal-cell--day" }, d));
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      grid.appendChild(el("div", { className: "cal-cell cal-cell--faded" }, String(daysInPrev - firstDay + i + 1)));
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = isCurrentMonth && i === today.getDate();
      grid.appendChild(el("div", {
        className: "cal-cell" + (isToday ? " cal-cell--today" : ""),
      }, String(i)));
    }
    const total = firstDay + daysInMonth;
    const remaining = (7 - (total % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      grid.appendChild(el("div", { className: "cal-cell cal-cell--faded" }, String(i)));
    }

    this.root.append(monthHeader, grid);
  }
}
