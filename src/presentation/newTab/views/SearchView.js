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

    let searchIconNode = document.createElement("div");
    searchIconNode.innerHTML = `
      <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: #ff0000; transform: translateX(4px);">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    `;

    const form = el("form", { className: "search-form", action: "#" },
      el("span", { className: "search-icon" }, searchIconNode),
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
