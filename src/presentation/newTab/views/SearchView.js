import { el } from "../../shared/dom.js";
import { icon } from "../../shared/icons.js";

// Renders the sleek search bar widget centered in the dashboard.
export class SearchView {
  constructor({ useCases, events }) {
    this.useCases = useCases;
    this.events = events;
    this.focusListener = null;
  }

  render(settings) {
    if (!settings.searchEnabled) {
      this.destroy();
      return null;
    }

    const placeholderText = this.getPlaceholder(settings.searchEngine);
    const input = el("input", {
      type: "search",
      className: "search-input",
      placeholder: placeholderText,
      ariaLabel: placeholderText,
      id: "dashboard-search-input",
    });

    // Handle slash (/) keypress to focus search
    if (this.focusListener) {
      document.removeEventListener("keydown", this.focusListener);
    }
    this.focusListener = (e) => {
      if (
        e.key === "/" &&
        document.activeElement !== input &&
        !e.target.closest("input, textarea, select, [contenteditable]")
      ) {
        e.preventDefault();
        input.focus();
      }
    };
    document.addEventListener("keydown", this.focusListener);

    const searchBtn = el("button", { 
      type: "submit", 
      className: "search-icon-btn", 
      title: "Search on YouTube",
      ariaLabel: "Search" 
    }, icon("search"));

    const form = el("form", { className: "search-form", action: "#" },
      searchBtn,
      input
    );

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (!query) return;
      const url = this.getSearchUrl("youtube", query);
      if (settings.searchOpenNewTab) {
        window.open(url, "_blank", "noopener");
      } else {
        window.location.href = url;
      }
    });

    return el("div", { className: "search-wrapper" }, form);
  }

  getPlaceholder(engine) {
    return "Search on YouTube...";
  }

  getSearchUrl(engine, query) {
    const q = encodeURIComponent(query);
    switch (engine) {
      case "duckduckgo": return `https://duckduckgo.com/?q=${q}`;
      case "bing": return `https://www.bing.com/search?q=${q}`;
      case "yahoo": return `https://search.yahoo.com/search?p=${q}`;
      case "youtube": return `https://www.youtube.com/results?search_query=${q}`;
      default: return `https://www.google.com/search?q=${q}`;
    }
  }

  destroy() {
    if (this.focusListener) {
      document.removeEventListener("keydown", this.focusListener);
      this.focusListener = null;
    }
  }
}
