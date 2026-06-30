import { el } from "../../shared/dom.js";
import { icon } from "../../shared/icons.js";
import { AutoBackupService } from "../../../infrastructure/services/AutoBackupService.js";

export class SettingsSidebarView {
  constructor({ useCases, events, toast, stateRef }) {
    this.useCases = useCases;
    this.events = events;
    this.toast = toast;
    this.stateRef = stateRef;
    this.draft = null;
    this.root = null;
  }

  // Build the draft from live settings. Called once when sidebar first renders.
  ensureDraft() {
    if (this.draft) return this.draft;
    const s = this.stateRef.current.settings;
    this.draft = {
      name:               s.name ?? "",
      greetingEnabled:    s.greetingEnabled !== false,
      messageText:        s.messageText ?? "",
      backgroundKind:     s.background.kind,
      backgroundValue:    s.background.value,
      backgroundBlur:     s.backgroundBlur ?? 0,
      backgroundOverlay:  s.backgroundOverlay ?? 0.35,
      bgGrayscale:        s.bgGrayscale ?? 0,
      bgHueRotate:        s.bgHueRotate ?? 0,
      bgPixelation:       s.bgPixelation ?? 0,
      bgVignette:         s.bgVignette === true,
      bgFilmGrain:        s.bgFilmGrain === true,
      clockEnabled:       s.clockEnabled !== false,
      showSeconds:        s.showSeconds === true,
      timeFormat24h:      s.timeFormat?.value === "24h",
      showDate:           s.showDate !== false,
      showCalendar:       s.showCalendar !== false,
      searchEnabled:      s.searchEnabled !== false,
      searchOpenNewTab:   s.searchOpenNewTab === true,
      searchEngine:       s.searchEngine ?? "google",
      quotesEnabled:      s.quotesEnabled !== false, // kept in draft for compat though unused
      shortcutsEnabled:   s.shortcutsEnabled !== false,
      shortcutsOpenNewTab: s.shortcutsOpenNewTab !== false,
      customCss:          s.customCss ?? "",
      cssVarBg:           s.cssVarBg ?? "#000000",
      cssVarText:         s.cssVarText ?? "#ffffff",
      cssVarBorder:       s.cssVarBorder ?? "#333333",
      cssVarAccent:       s.cssVarAccent ?? "#D71921",
    };
    return this.draft;
  }

  // Persist draft → domain → storage and trigger controller refresh
  async save() {
    try {
      await this.useCases.saveUserSettings.execute(this.draft);
      // Update the stateRef immediately so re-renders use the latest
      this.stateRef.current.settings = await this.useCases.getSettings.execute();
      // Let the controller handle the DOM re-render
      this.events.emit("settings:changed", this.stateRef.current.settings);
    } catch (err) {
      this.toast.show(err.message || "Could not save settings", { error: true });
    }
  }

  // Debounced save for text inputs / sliders
  scheduleSave(delay = 400) {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.save(), delay);
  }

  // Apply CSS vars live (no save needed – will be persisted on explicit change)
  applyCssVars() {
    const { cssVarBg, cssVarText, cssVarBorder, cssVarAccent } = this.draft;
    document.documentElement.style.setProperty("--bg-color", cssVarBg);
    document.documentElement.style.setProperty("--text-main", cssVarText);
    document.documentElement.style.setProperty("--border-color", cssVarBorder);
    document.documentElement.style.setProperty("--accent-red", cssVarAccent);
  }

  // ── Toggle helper ──────────────────────────────────────────────────────────
  renderToggle(label, checked, onChange) {
    const input = el("input", { type: "checkbox", className: "toggle-checkbox" });
    input.checked = checked;
    input.addEventListener("change", (e) => onChange(e.target.checked));
    const slider = el("span", { className: "toggle-slider" });
    const toggle = el("label", { className: "toggle-switch" }, input, slider);
    return el("div", { className: "setting-row" }, el("span", {}, label), toggle);
  }

  // ── Collapsible sub-panel ──────────────────────────────────────────────────
  makeSubPanel(visible) {
    const panel = el("div", { className: "sub-settings box-sub-settings" });
    panel.style.display = visible ? "flex" : "none";
    return panel;
  }

  // ── Full render ────────────────────────────────────────────────────────────
  render() {
    this.root = el("aside", { className: "settings-sidebar" });
    const draft = this.ensureDraft();

    // ── Header ──
    const closeBtn = el("button", { type: "button", className: "close-btn action-btn" }, icon("x"));
    closeBtn.addEventListener("click", () => this.root.classList.remove("open"));

    const header = el("div", { className: "sidebar-header" },
      el("div", { className: "sidebar-title" },
        el("h3", {}, "Settings"),
        el("p", { className: "muted" }, "Customize Your Tab.")
      ),
      closeBtn
    );

    const content = el("div", { className: "sidebar-content" });

    // ── 1. GREETING ──────────────────────────────────────────────────────────
    const greetingPanel = this.makeSubPanel(draft.greetingEnabled);
    const nameInput = el("input", {
      type: "text",
      value: draft.name,
      placeholder: "Your name...",
      style: "min-width: 0;"
    });
    nameInput.addEventListener("change", () => {
      draft.name = nameInput.value;
      this.save();
    });

    const removeNameBtn = el("button", { type: "button", className: "btn-secondary", style: "white-space: nowrap; padding: 4px 8px;" }, "Remove");
    removeNameBtn.addEventListener("click", () => {
      nameInput.value = "";
      draft.name = "";
      this.save();
    });

    const messageInput = el("input", {
      type: "text",
      value: draft.messageText,
      placeholder: "Enter a custom message...",
      style: "min-width: 0;"
    });
    const saveMessageBtn = el("button", { type: "button", className: "btn-secondary", style: "white-space: nowrap; padding: 4px 8px;" }, "Save");
    saveMessageBtn.addEventListener("click", () => {
      draft.messageText = messageInput.value;
      this.save();
      this.toast.show("Message saved.");
    });
    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveMessageBtn.click();
    });

    greetingPanel.append(
      el("div", { className: "input-group" },
        el("label", {}, "Username"),
        el("div", { className: "input-row" }, nameInput, removeNameBtn)
      ),
      el("div", { className: "input-group" },
        el("label", {}, "Message"),
        el("div", { className: "input-row" }, messageInput, saveMessageBtn)
      )
    );

    const greetingSection = el("div", { className: "settings-section" },
      this.renderToggle("Greeting", draft.greetingEnabled, (v) => {
        draft.greetingEnabled = v;
        greetingPanel.style.display = v ? "flex" : "none";
        this.save();
      }),
      greetingPanel
    );
    content.append(greetingSection);

    // ── 2. BACKGROUND ────────────────────────────────────────────────────────
    const bgFileInput = el("input", {
      type: "file",
      accept: "image/*",
    });

    bgFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const maxDim = 2560; // Max 1440p equivalent to save space
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        draft.backgroundKind = "local_image";
        draft.backgroundValue = canvas.toDataURL("image/webp", 0.8);
        this.save();
        this.toast.show("Background image updated.");
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });

    const bgBlurInput = el("input", {
      type: "range", min: "0", max: "20", step: "1",
      value: draft.backgroundBlur,
    });
    bgBlurInput.addEventListener("input", () => {
      draft.backgroundBlur = Number(bgBlurInput.value);
      this.scheduleSave(200);
    });

    const bgBrightnessInput = el("input", {
      type: "range", min: "0", max: "80", step: "1",
      value: Math.round(draft.backgroundOverlay * 100),
    });
    bgBrightnessInput.addEventListener("input", () => {
      draft.backgroundOverlay = Number(bgBrightnessInput.value) / 100;
      this.scheduleSave(200);
    });

    // Advanced Effects Section (Accordion)
    const advDetails = el("details", { style: "margin-top: 12px;" });
    
    // Preserve open state across re-renders
    if (this._advEffectsOpen) advDetails.open = true;
    advDetails.addEventListener("toggle", () => {
      this._advEffectsOpen = advDetails.open;
    });

    const advSummary = el("summary", { style: "cursor: pointer; font-family: var(--font-sans); font-size: 13px; color: var(--text-muted); outline: none;" }, "Advanced Effects");
    
    const grayscaleInput = el("input", { type: "range", min: "0", max: "100", step: "1", value: draft.bgGrayscale });
    grayscaleInput.addEventListener("input", () => { draft.bgGrayscale = Number(grayscaleInput.value); this.scheduleSave(200); });
    
    const hueInput = el("input", { type: "range", min: "0", max: "360", step: "1", value: draft.bgHueRotate });
    hueInput.addEventListener("input", () => { draft.bgHueRotate = Number(hueInput.value); this.scheduleSave(200); });
    
    const advContent = el("div", { style: "margin-top: 16px; display: flex; flex-direction: column; gap: 16px; padding-left: 8px; border-left: 2px solid var(--border-color);" },
      el("div", { className: "range-group" }, el("label", {}, "Grayscale (%)"), grayscaleInput),
      el("div", { className: "range-group" }, el("label", {}, "Hue Rotation (deg)"), hueInput),
      this.renderToggle("Vignette Shadow", draft.bgVignette, (v) => { draft.bgVignette = v; this.save(); })
    );
    advDetails.append(advSummary, advContent);

    const bgPanel = el("div", { className: "sub-settings" },
      el("div", { className: "input-group" },
        el("label", {}, "Upload Local Background"),
        el("div", { className: "input-row" }, bgFileInput)
      ),
      el("div", { className: "range-group" },
        el("label", {}, "Background Blur Intensity"),
        bgBlurInput
      ),
      el("div", { className: "range-group" },
        el("label", {}, "Background Brightness"),
        bgBrightnessInput
      ),
      advDetails
    );

    content.append(el("div", { className: "settings-section" },
      this.renderToggle("Background Image",
        draft.backgroundKind !== "solid_color",
        (v) => {
          if (!v) { draft.backgroundKind = "solid_color"; draft.backgroundValue = "#000000"; }
          this.save();
        }
      ),
      bgPanel
    ));

    // ── 3. CLOCK ─────────────────────────────────────────────────────────────
    const clockPanel = this.makeSubPanel(draft.clockEnabled);
    clockPanel.append(
      this.renderToggle("Seconds", draft.showSeconds, (v) => {
        draft.showSeconds = v;
        this.save();
      }),
      this.renderToggle("24-Hour Time", draft.timeFormat24h, (v) => {
        draft.timeFormat24h = v;
        this.save();
      })
    );

    content.append(el("div", { className: "settings-section" },
      this.renderToggle("Clock", draft.clockEnabled, (v) => {
        draft.clockEnabled = v;
        clockPanel.style.display = v ? "flex" : "none";
        this.save();
      }),
      clockPanel
    ));

    // ── 4. DATE ──────────────────────────────────────────────────────────────
    content.append(el("div", { className: "settings-section" },
      el("div", { className: "section-title" }, "Date & Calendar"),
      el("div", { className: "sub-settings box-sub-settings" },
        this.renderToggle("Show Date", draft.showDate, (v) => {
          draft.showDate = v;
          this.save();
        })
      )
    ));

    // ── 5. SEARCH BAR ────────────────────────────────────────────────────────
    const searchPanel = this.makeSubPanel(draft.searchEnabled);
    searchPanel.append(
      this.renderToggle("Open in New Tab", draft.searchOpenNewTab, (v) => {
        draft.searchOpenNewTab = v;
        this.save();
      })
    );

    content.append(el("div", { className: "settings-section" },
      this.renderToggle("Search Bar", draft.searchEnabled, (v) => {
        draft.searchEnabled = v;
        searchPanel.style.display = v ? "flex" : "none";
        this.save();
      }),
      searchPanel
    ));

    // ── 6. WIDGET TOGGLES ────────────────────────────────────────────────────
    content.append(el("div", { className: "settings-section" },
      this.renderToggle("Shortcuts", draft.shortcutsEnabled, (v) => { draft.shortcutsEnabled = v; this.save(); }),
      this.renderToggle("Shortcuts Open in New Tab", draft.shortcutsOpenNewTab, (v) => { draft.shortcutsOpenNewTab = v; this.save(); })
    ));

    // ── 7. SETTING MANAGEMENT ────────────────────────────────────────────────
    const fileInput = el("input", { type: "file", accept: ".json", style: "display:none" });
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e2) => {
        try {
          const data = JSON.parse(e2.target.result);
          await chrome.storage.local.set(data);
          this.toast.show("Import successful. Reloading...");
          setTimeout(() => location.reload(), 900);
        } catch { this.toast.show("Import failed — invalid file.", { error: true }); }
      };
      reader.readAsText(file);
    });

    const exportFn = async () => {
      try {
        const data = await chrome.storage.local.get();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = el("a", { href: url, download: "Nothing-Tab-backup.json", style: "display:none" });
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
        this.toast.show("Settings exported.");
      } catch { this.toast.show("Export failed.", { error: true }); }
    };

    const exportBtn = el("button", { type: "button", className: "btn-gray" }, "Export");
    const importBtn = el("button", { type: "button", className: "btn-gray" }, "Import");
    const autoBackupBtn = el("button", { type: "button", className: "btn-gray" }, "Setup Auto Backup");

    exportBtn.addEventListener("click", exportFn);
    importBtn.addEventListener("click", () => fileInput.click());
    autoBackupBtn.addEventListener("click", async () => {
      const backupService = new AutoBackupService();
      try {
        const success = await backupService.setupWithSavePicker();
        if (success) {
          this.toast.show("Auto backup linked successfully.");
        }
      } catch (err) {
        this.toast.show("Auto backup setup failed.", { error: true });
      }
    });

    content.append(el("div", { className: "settings-section" },
      el("div", { className: "section-title" }, "Setting Management"),
      el("div", { className: "mgmt-box" },
        el("div", { className: "btn-group-center" }, exportBtn, importBtn, autoBackupBtn, fileInput)
      )
    ));

    // ── 8. CUSTOM CSS ────────────────────────────────────────────────────────
    const cssArea = el("textarea", {
      className: "custom-css-textarea",
      placeholder: "/* Enter CSS here... */",
      style: "width: 100%; height: 150px; background: var(--bg-color); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 4px; padding: 8px; font-family: monospace; resize: vertical;"
    });
    cssArea.value = draft.customCss;
    cssArea.addEventListener("input", () => {
      draft.customCss = cssArea.value;
      // Apply instantly
      let tag = document.getElementById("neptab-custom-css");
      if (!tag) { tag = document.createElement("style"); tag.id = "neptab-custom-css"; document.head.appendChild(tag); }
      tag.textContent = draft.customCss;
    });

    const copyCssBtn = el("button", { type: "button", className: "btn-gray", style: "flex: 1;" }, "Copy Default CSS");
    copyCssBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("newTab.css");
        const cssText = await res.text();
        await navigator.clipboard.writeText(cssText);
        this.toast.show("Default CSS copied to clipboard!");
      } catch (err) {
        this.toast.show("Failed to copy CSS", { error: true });
      }
    });

    const resetCssBtn = el("button", { type: "button", className: "btn-gray", style: "flex: 1;" }, "Clear CSS");
    resetCssBtn.addEventListener("click", () => {
      if (!confirm("Are you sure you want to clear your custom CSS?")) return;
      cssArea.value = "";
      draft.customCss = "";
      let tag = document.getElementById("neptab-custom-css");
      if (tag) tag.textContent = "";
      this.save();
      this.toast.show("Custom CSS cleared.");
    });

    const saveCssBtn = el("button", { type: "button", className: "btn-secondary", style: "flex: 1;" }, "Save CSS");
    saveCssBtn.addEventListener("click", () => {
      this.save();
      this.toast.show("Custom CSS saved.");
    });

    content.append(el("div", { className: "settings-section" },
      el("div", { className: "section-title" }, "Custom CSS Style"),
      cssArea,
      el("div", { className: "btn-group-center", style: "margin-top: 12px; display: flex; gap: 8px;" }, copyCssBtn, resetCssBtn, saveCssBtn)
    ));

    // ── 10. COLOR SANDBOX ────────────────────────────────────────────────────
    const makeColorRow = (label, draftKey, cssVar) => {
      const picker = el("input", { type: "color" });
      picker.value = draft[draftKey];
      picker.addEventListener("input", () => {
        draft[draftKey] = picker.value;
        document.documentElement.style.setProperty(cssVar, picker.value);
      });
      picker.addEventListener("change", () => {
        draft[draftKey] = picker.value;
        document.documentElement.style.setProperty(cssVar, picker.value);
        this.save();
      });
      return el("div", { className: "setting-row" }, el("span", {}, label), picker);
    };

    content.append(el("div", { className: "settings-section" },
      el("div", { className: "section-title" }, "Color Sandbox"),
      makeColorRow("Background", "cssVarBg",     "--bg-color"),
      makeColorRow("Text",       "cssVarText",   "--text-main"),
      makeColorRow("Borders",    "cssVarBorder", "--border-color"),
      makeColorRow("Accent Red", "cssVarAccent", "--accent-red"),
    ));

    // ── 11. RESET ────────────────────────────────────────────────────────────
    const resetBtn = el("button", { type: "button", className: "btn-red btn-full" }, "Reset All Settings");
    resetBtn.addEventListener("click", async () => {
      if (!confirm("Reset all settings? This cannot be undone.")) return;
      await chrome.storage.local.clear();
      location.reload();
    });
    content.append(resetBtn);

    this.root.append(header, content);
    return this.root;
  }

  toggle(toggleBtn = null) {
    if (!this.root) return;
    const isOpen = this.root.classList.toggle("open");
    
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", isOpen);
    const mainContent = document.getElementById("app")?.querySelector("main");
    if (mainContent) mainContent.setAttribute("aria-hidden", isOpen);
    
    if (isOpen) {
      const focusable = this.root.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (focusable.length) setTimeout(() => focusable[0].focus(), 300);
      
      this._escapeListener = (e) => {
        if (e.key === "Escape") {
           this.toggle(toggleBtn);
           if (toggleBtn) toggleBtn.focus();
        }
      };
      document.addEventListener("keydown", this._escapeListener);
      
      this._tabListener = (e) => {
         if (e.key !== "Tab") return;
         const first = focusable[0];
         const last = focusable[focusable.length - 1];
         if (e.shiftKey && document.activeElement === first) {
            last.focus();
            e.preventDefault();
         } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
         }
      };
      this.root.addEventListener("keydown", this._tabListener);
    } else {
      if (this._escapeListener) document.removeEventListener("keydown", this._escapeListener);
      if (this._tabListener) this.root.removeEventListener("keydown", this._tabListener);
      this._escapeListener = null;
      this._tabListener = null;
    }
  }
}
