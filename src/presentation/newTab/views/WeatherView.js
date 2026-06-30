import { el } from "../../shared/dom.js";
import { icon } from "../../shared/icons.js";
import { HttpWeatherService } from "../../../infrastructure/services/HttpWeatherService.js";

export class WeatherView {
  constructor() {
    this.weatherService = new HttpWeatherService();
    this.settings = null;
    this.root = null;
    this.intervalId = null;
    this.weatherData = null;
    this.abortController = null;
  }

  render(settings) {
    this.settings = settings;
    this.root = el("div", { className: "nothing-widget weather-widget" });
    this.update();

    this.fetchData();
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.fetchData(), 30 * 60 * 1000);

    return this.root;
  }

  async fetchData() {
    if (!this.settings?.weatherEnabled) return;

    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    try {
      const loc = this.settings.weatherLocation || "Barcelona, Spain";
      const unit = this.settings.weatherUnit || "c";
      
      this.weatherData = await this.weatherService.fetchWeather(loc, unit, { signal: this.abortController.signal });
      this.update();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Failed to fetch weather data:", err);
      }
    }
  }

  update() {
    if (!this.root || !this.settings) return;

    if (!this.settings.weatherEnabled) {
      this.root.style.display = "none";
      return;
    }
    this.root.style.display = "block";

    const header = el("div", { className: "nw-header weather-header" },
      el("span", { className: "nw-title weather-title" }, icon("cloud"), "WEATHER")
    );

    const body = el("div", { className: "calendar-body" });
    
    if (this.weatherData) {
      const leftCol = el("div", { className: "cal-left-col weather-temp-col" },
        el("div", { className: "cal-day-number weather-temp" }, `${this.weatherData.temp}°`)
      );

      const rightCol = el("div", { className: "cal-right-col weather-condition-col" },
        el("div", { className: "cal-agenda-list" },
          el("div", { className: "cal-event" },
            el("div", { className: "cal-event-label weather-condition" }, this.weatherData.condition)
          )
        )
      );
      
      const mainRow = el("div", { className: "weather-main-row" }, leftCol, rightCol);
      const footer = el("div", { className: "weather-footer" },
        el("span", {}, `Feels like ${this.weatherData.temp + 2}° • Humidity 68%`)
      );
      
      body.append(mainRow, footer);
    } else {
      body.append(el("div", { className: "weather-loading" }, "Loading..."));
    }

    this.root.replaceChildren(header, body);
  }

  destroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.abortController) this.abortController.abort();
    this.intervalId = null;
    this.abortController = null;
  }
}
