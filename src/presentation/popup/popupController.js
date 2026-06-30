import { buildContainer } from "../../infrastructure/di/container.js";

class PopupController {
  constructor() {
    this.form = document.getElementById("add-form");
    this.titleInput = document.getElementById("bm-title");
    this.urlInput = document.getElementById("bm-url");
    this.errorEl = document.getElementById("bm-error");
    this.submitBtn = document.getElementById("bm-submit");
    this.categorySelect = document.getElementById("bm-category");
  }

  async init() {
    try {
      this.useCases = buildContainer().useCases;
    } catch (err) {
      this.showError("Failed to start: " + (err?.message || err));
      this.submitBtn.disabled = true;
      return;
    }

    await this.populateCategories();
    await this.seedFromActiveTab();
    this.form.addEventListener("submit", (event) => this.onSubmit(event));
  }

  async populateCategories() {
    try {
      let categories = await this.useCases.listCategories.execute();
      
      if (!categories || categories.length === 0) {
        // Create a default category if none exist
        await this.useCases.createCategory.execute({ name: "Inbox" });
        categories = await this.useCases.listCategories.execute();
      }

      this.categorySelect.innerHTML = "";
      categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id.value;
        opt.textContent = cat.name;
        this.categorySelect.appendChild(opt);
      });
    } catch (e) {
      this.showError("Failed to load categories.");
    }
  }

  async seedFromActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;
      if (typeof tab.title === "string" && tab.title && !this.titleInput.value) {
        this.titleInput.value = tab.title;
      }
      if (typeof tab.url === "string" && tab.url && !this.urlInput.value) {
        this.urlInput.value = tab.url;
      }
    } catch {
      // chrome.tabs unavailable; leave inputs blank.
    }
    
    // Focus title and put cursor at end
    this.titleInput.focus();
    if (this.titleInput.value) {
      this.titleInput.setSelectionRange(this.titleInput.value.length, this.titleInput.value.length);
    }
  }

  async onSubmit(event) {
    event.preventDefault();
    this.clearError();

    const title = this.titleInput.value.trim();
    const url = this.urlInput.value.trim();
    const categoryId = this.categorySelect.value;
    
    if (!title) return this.showError("Title is required.");
    if (!url) return this.showError("URL is required.");
    if (!categoryId) return this.showError("Category is required.");

    this.submitBtn.disabled = true;
    this.submitBtn.textContent = "Saving...";
    try {
      await this.useCases.createBookmark.execute({ title, url, categoryId });
    } catch (err) {
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = "Save to Dashboard";
      this.showError(err?.message || "Could not save shortcut.");
      return;
    }

    this.submitBtn.textContent = "Saved!";
    this.submitBtn.style.background = "#22c55e"; // Success green
    setTimeout(() => window.close(), 500);
  }

  showError(message) {
    this.errorEl.textContent = message;
  }

  clearError() {
    this.errorEl.textContent = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PopupController().init();
});
