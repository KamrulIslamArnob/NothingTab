import { buildContainer } from "../../infrastructure/di/container.js";
import { el } from "../shared/dom.js";
import { icon } from "../shared/icons.js";
import { AutoBackupService } from "../../infrastructure/services/AutoBackupService.js";

import { BackgroundView } from "./views/BackgroundView.js";
import { GreetingView } from "./views/GreetingView.js";
import { BookmarksView } from "./views/BookmarksView.js";
import { TodoView } from "./views/TodoView.js";
import { SettingsSidebarView } from "./views/SettingsSidebarView.js";
import { ToastView } from "./views/ToastView.js";
import { SearchView } from "./views/SearchView.js";
import { CalendarView } from "./views/CalendarView.js";
import { WeatherView } from "./views/WeatherView.js";
import { CombinedClockView } from "./views/CombinedClockView.js";

export class NewTabController {
  constructor() {
    this.container = null;
    this.state = {
      settings: null,
      categories: [],
      bookmarks: [],
      tasks: [],
      layout: [],
    };
    this.views = {};
    this.unsubs = [];
    this.toast = new ToastView();
  }

  async init() {
    document.fonts.ready.then(() => document.body.classList.add("fonts-loaded"));
    
    try {
      this.container = buildContainer();
    } catch (err) {
      this.fatal("Failed to start extension architecture", err);
      return;
    }

    const { useCases, events, internals } = this.container;
    this.useCases = useCases;
    this.events = events;
    this.stateRef = { current: this.state };

    try {
      this.views = {
        background: new BackgroundView({ settings: null, sanitizer: internals.sanitizer }),
        greeting: new GreetingView({ useCases, clock: internals.clock }),
        bookmarks: new BookmarksView({ useCases, events, toast: this.toast }),
        todo: new TodoView({ useCases, toast: this.toast }),
        settings: new SettingsSidebarView({ useCases, events, toast: this.toast, stateRef: this.stateRef }),
        search: new SearchView({ useCases, events }),
        calendar: new CalendarView(),
        combinedClock: new CombinedClockView({ clock: internals.clock }),
        weather: new WeatherView()
      };
    } catch (err) {
      this.fatal("Failed to initialize UI components", err);
      return;
    }

    this.restoreCachedState();
    this.subscribe();

    try {
      await this.loadState();
      this.cacheState();
      this.render();
      this.triggerAutoBackup();
    } catch (err) {
      this.fatal("Failed to load dashboard data", err);
    }
  }

  restoreCachedState() {
    try {
      const cached = localStorage.getItem("neptab_state_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.settings) {
          this.state = { ...this.state, ...parsed };
          this.stateRef.current = this.state;
          this.render();
        }
      }
    } catch (err) {
      console.warn("Failed to restore cached state:", err);
    }
  }

  cacheState() {
    try {
      const stateCopy = structuredClone(this.state);
      if (stateCopy.settings?.background) {
         stateCopy.settings.background = { kind: 'solid_color', value: stateCopy.settings.cssVarBg || '#000000' };
      }
      localStorage.setItem("neptab_state_cache", JSON.stringify(stateCopy));
    } catch (err) {
      console.warn("Failed to cache state:", err);
    }
  }

  async loadState() {
    const [settings, categories, bookmarks, tasks, layout] = await Promise.all([
      this.useCases.getSettings.execute(),
      this.useCases.listCategories.execute(),
      this.useCases.listBookmarks.execute(),
      this.useCases.listTasks.execute(),
      this.useCases.getLayout.execute(),
    ]);
    this.state = { settings, categories, bookmarks, tasks, layout };
    this.stateRef.current = this.state;
  }

  fatal(where, err) {
    console.error(where, err);
    this.toast?.show(`${where}: ${err?.message || err}`, { error: true });
    
    document.getElementById("fatal-overlay")?.remove();
    
    const overlay = el("div", { id: "fatal-overlay", className: "fatal-error-overlay" },
      el("h2", { className: "fatal-error-title" }, "HomeScreen could not start"),
      el("pre", { className: "fatal-error-details" }, `${where}\n\n${err?.stack || err?.message || err}`)
    );
    document.body.appendChild(overlay);
  }

  subscribe() {
    const events = ["settings", "categories", "bookmarks", "tasks", "layout"];
    events.forEach(event => {
      this.unsubs.push(this.events.on(`${event}:changed`, () => this.refresh(event)));
    });
  }

  async refresh(kind) {
    try {
      const actions = {
        settings: () => this.useCases.getSettings.execute(),
        categories: () => this.useCases.listCategories.execute(),
        bookmarks: () => this.useCases.listBookmarks.execute(),
        tasks: () => this.useCases.listTasks.execute(),
        layout: () => this.useCases.getLayout.execute()
      };

      if (actions[kind]) {
        this.state[kind] = await actions[kind]();
      }
      this.cacheState();
      this.render();
    } catch (err) {
      this.toast.show(err.message || "Could not refresh dashboard state", { error: true });
    }
  }

  applyCssVars(settings) {
    const docStyle = document.documentElement.style;
    if (settings.cssVarBg) docStyle.setProperty("--bg-color", settings.cssVarBg);
    if (settings.cssVarText) docStyle.setProperty("--text-main", settings.cssVarText);
    if (settings.cssVarBorder) docStyle.setProperty("--border-color", settings.cssVarBorder);
    if (settings.cssVarAccent) docStyle.setProperty('--accent-color', settings.cssVarAccent || '#D71921');
  }

  async triggerAutoBackup() {
    const backupService = new AutoBackupService();
    try {
      const result = await backupService.performBackup();
      if (result === 'requires_permission') {
        this.showResumeBackupButton(backupService);
      }
    } catch (err) {
      console.error("Auto backup error:", err);
    }
  }

  showResumeBackupButton(backupService) {
    if (document.getElementById("resume-backup-btn")) return;
    
    const btn = el("button", { id: "resume-backup-btn", className: "resume-backup-btn" }, "Resume Auto Backup");
    btn.addEventListener("click", async () => {
      const granted = await backupService.requestPermission();
      if (granted) {
        btn.remove();
        await backupService.performBackup();
        this.toast?.show("Auto backup resumed!", { durationMs: 3000 });
      } else {
        this.toast?.show("Failed to resume auto backup.", { error: true });
      }
    });
    
    document.body.appendChild(btn);
  }

  applyCustomCss(css) {
    let styleTag = document.getElementById("neptab-custom-css");
    if (!styleTag) {
      styleTag = el("style", { id: "neptab-custom-css" });
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = css || "";
  }

  render() {
    const { settings, categories, bookmarks, tasks } = this.state;
    if (!settings) return;

    this.views.background.update(settings);
    this.applyCssVars(settings);
    this.applyCustomCss(settings.customCss);

    const show = (key, def = true) => settings[key] !== undefined ? settings[key] : def;
    const root = document.getElementById("app");
    const sidebarWasOpen = this.views.settings.root?.classList.contains("open") ?? false;

    this.views.settings.draft = null;
    const settingsSidebar = this.views.settings.render();
    if (sidebarWasOpen) settingsSidebar.classList.add("open");

    const centerItems = [];
    if (show("greetingEnabled")) centerItems.push(this.views.greeting.render(settings));
    if (show("clockEnabled")) centerItems.push(this.views.combinedClock.render(settings));
    if (show("searchEnabled")) centerItems.push(this.views.search.render(settings));
    if (show("shortcutsEnabled")) centerItems.push(this.views.bookmarks.render({ categories, bookmarks, settings }));
    const centerContent = el("div", { className: "center-content" }, ...centerItems);

    const leftSidebar = el("aside", { className: "sidebar-left" });
    const rightSidebar = el("aside", { className: "sidebar-right" });
    const closeRightBtn = el("button", { className: "close-btn sidebar-close-btn", title: "Close panel" }, icon("x"));
    
    closeRightBtn.addEventListener("click", () => rightSidebar.classList.remove("open"));

    const renderSidebars = () => {
      if (show("weatherEnabled")) leftSidebar.replaceChildren(this.views.weather.render(settings));
      
      const rightItems = [];
      if (show("showDate")) rightItems.push(this.views.calendar.render(settings));
      rightItems.push(this.views.todo.render({ tasks }));
      rightSidebar.replaceChildren(closeRightBtn, ...rightItems);
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(renderSidebars);
    } else {
      setTimeout(renderSidebars, 50);
    }

    const main = el("main", { className: "dashboard-shell-v2" }, settingsSidebar, leftSidebar, centerContent, rightSidebar);

    const settingsToggle = el("button", { className: "settings-toggle-btn", type: "button", title: "Customize" }, icon("settings"), el("span", { className: "settings-badge-dot", "aria-hidden": "true" }));
    settingsToggle.addEventListener("click", () => this.views.settings.toggle(settingsToggle));

    const widgetsToggle = el("button", { className: "widgets-toggle-btn", type: "button", title: "Widgets" }, icon("layout"));
    widgetsToggle.addEventListener("click", () => rightSidebar.classList.toggle("open"));

    root.replaceChildren(main, settingsToggle, widgetsToggle);
  }

  destroy() {
    this.unsubs.forEach(unsubscribe => {
      try { unsubscribe(); } catch (err) { console.warn("Unsubscribe failed", err); }
    });
    this.unsubs = [];
    this.views.combinedClock?.destroy();
    this.views.weather?.destroy();
  }
}

const controller = new NewTabController();
controller.init();
window.__newTab = controller;
