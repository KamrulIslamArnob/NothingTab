import { el } from "../../shared/dom.js";
import { initial, websiteFaviconUrl } from "../../shared/favicon.js";
import { icon } from "../../shared/icons.js";
import { createCategoryTabs } from "../../shared/penta-bridge/widgets/CategoryTabs.js";

export class BookmarksView {
  constructor({ useCases, events, toast }) {
    this.useCases = useCases;
    this.events = events;
    this.toast = toast;
    this.activeCategoryId = null;
    this.categories = [];
    this.bookmarks = [];
    this.categoryTabs = null;
  }

  render(state) {
    this.root = el("div", { className: "shortcut-module" });
    this.tabsSlot = el("div", { className: "workspace-tabs-slot" });
    this.gridSlot = el("div", { className: "shortcut-grid-slot" });

    this.setupDragAndDropEvents();
    this.root.append(this.tabsSlot, this.gridSlot);
    this.update(this.root, state);
    
    return this.root;
  }
  
  setupDragAndDropEvents() {
    this.tabsSlot.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!this.draggedBookmarkId) return;
      const tab = e.target.closest(".pb-tab");
      if (tab && tab.dataset.id && tab.dataset.id !== this.activeCategoryId) {
        tab.classList.add("drop-target-category");
      }
    });

    this.tabsSlot.addEventListener("dragleave", (e) => {
      e.target.closest(".pb-tab")?.classList.remove("drop-target-category");
    });

    this.tabsSlot.addEventListener("drop", async (e) => {
      e.preventDefault();
      if (!this.draggedBookmarkId) return;
      
      const tab = e.target.closest(".pb-tab");
      tab?.classList.remove("drop-target-category");

      if (tab?.dataset.id && tab.dataset.id !== this.activeCategoryId) {
        try {
          await this.useCases.updateBookmark.execute({ id: this.draggedBookmarkId, categoryId: tab.dataset.id });
          const bookmarks = await this.useCases.listBookmarks.execute();
          if (this.root) this.update(this.root, { categories: this.categories, bookmarks, settings: this.settings });
        } catch (err) {
          this.toast.show(err.message, { error: true });
        }
      }
    });
  }

  update(root, { categories, bookmarks, settings }) {
    this.categories = categories;
    this.bookmarks = bookmarks;
    this.settings = settings;

    if (this.categories.length > 0 && !this.activeCategoryId) {
      this.activeCategoryId = this.categories[0].id.value;
    }

    this.renderTabs();
    this.renderGrid();
  }

  renderTabs() {
    const items = this.categories.map(c => ({ id: c.id.value, label: c.name }));

    if (!this.categoryTabs) {
      this.categoryTabs = createCategoryTabs({
        items,
        activeId: this.activeCategoryId,
        onSelect: (id) => {
          this.activeCategoryId = id;
          this.categoryTabs?.update({ items: this.categories.map(c => ({ id: c.id.value, label: c.name })), activeId: id });
          this.renderGrid();
        },
        onReorder: async (orderedIds) => {
          try {
            await this.useCases.reorderCategories.execute({ orderedIds });
            const cats = await this.useCases.listCategories.execute();
            if (this.root) this.update(this.root, { categories: cats, bookmarks: this.bookmarks, settings: this.settings });
          } catch (err) {
            this.toast.show(err.message, { error: true });
          }
        },
        onRename: (id) => this.openRenameDialog(id),
        onAdd: () => this.openCreateDialog(),
      });
    } else {
      this.categoryTabs.update({ items, activeId: this.activeCategoryId });
    }

    if (this.categoryTabs.root.parentNode !== this.tabsSlot) {
      this.categoryTabs.root.remove();
      this.tabsSlot.replaceChildren(this.categoryTabs.root);
    }
  }

  openRenameDialog(categoryId) {
    const category = this.categories.find(c => c.id.value === categoryId);
    if (!category) return;
    
    this.showDialog({
      title: "Rename Category",
      fields: [{ id: "cat-name", placeholder: "Category name", value: category.name }],
      onSubmit: async (values) => {
        const newName = values["cat-name"]?.trim();
        if (!newName || newName === category.name) return;
        try {
          await this.useCases.renameCategory.execute({ id: category.id.value, name: newName });
          const cats = await this.useCases.listCategories.execute();
          if (this.root) this.update(this.root, { categories: cats, bookmarks: this.bookmarks, settings: this.settings });
        } catch (err) {
          this.toast.show(err.message, { error: true });
        }
      },
      onDelete: async () => {
        if (confirm(`Delete the category "${category.name}"?`)) { 
          try {
            await this.useCases.deleteCategory.execute({ id: category.id.value });
            const cats = await this.useCases.listCategories.execute();
            if (this.activeCategoryId === category.id.value) {
              this.activeCategoryId = cats.length > 0 ? cats[0].id.value : null;
            }
            if (this.root) this.update(this.root, { categories: cats, bookmarks: this.bookmarks, settings: this.settings });
          } catch (err) {
            this.toast.show(err.message, { error: true });
          }
        }
      },
    });
  }

  openCreateDialog() {
    this.showDialog({
      title: "Create Category",
      fields: [{ id: "cat-name", placeholder: "Category name" }],
      onSubmit: async (values) => {
        const name = values["cat-name"]?.trim();
        if (!name) return;
        try {
          await this.useCases.createCategory.execute({ name });
          const cats = await this.useCases.listCategories.execute();
          if (this.root) this.update(this.root, { categories: cats, bookmarks: this.bookmarks, settings: this.settings });
        } catch (err) {
          this.toast.show(err.message, { error: true });
        }
      },
    });
  }

  showDialog({ title, fields, onSubmit, onDelete }) {
    document.body.querySelector(".shortcut-dialog-overlay")?.remove();
    
    const overlay = el("div", { className: "shortcut-dialog-overlay" });
    const dialog = el("div", { className: "shortcut-dialog" }, el("div", { className: "shortcut-dialog-title" }, title));
    const inputs = {};
    
    fields.forEach((f, i) => {
      const input = el("input", { type: "text", className: "shortcut-dialog-input", placeholder: f.placeholder || "", value: f.value || "" });
      inputs[f.id] = input;
      dialog.appendChild(input);
      if (i === 0) setTimeout(() => input.focus(), 50);
      
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); submitBtn.click(); }
        if (e.key === "Escape") overlay.remove();
      });
    });

    const actions = el("div", { className: "shortcut-dialog-actions" });
    const cancelBtn = el("button", { type: "button", className: "shortcut-dialog-btn" }, "Cancel");
    const submitBtn = el("button", { type: "button", className: "shortcut-dialog-btn primary" }, "Save");
    
    cancelBtn.addEventListener("click", () => overlay.remove());
    submitBtn.addEventListener("click", () => {
      const values = Object.fromEntries(Object.entries(inputs).map(([id, input]) => [id, input.value]));
      overlay.remove();
      onSubmit(values);
    });

    actions.append(cancelBtn, submitBtn);

    if (onDelete) {
      const deleteBtn = el("button", { type: "button", className: "shortcut-dialog-btn danger delete-btn" }, "Delete");
      deleteBtn.addEventListener("click", () => { overlay.remove(); onDelete(); });
      actions.prepend(deleteBtn);
    }
    
    dialog.appendChild(actions);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  renderGrid() {
    this.gridSlot.replaceChildren();

    if (!this.activeCategoryId) {
      this.gridSlot.appendChild(el("div", { className: "shortcut-empty" }, "No categories yet. Click + above to create one."));
      return;
    }

    const filtered = this.bookmarks.filter(b => b.categoryId.value === this.activeCategoryId);
    const sorted = [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const allItems = [...sorted.map(b => this.renderShortcut(b)), this.renderAddShortcut()];

    const mid = Math.ceil(allItems.length / 2);
    const colLeft = el("div", { className: "shortcut-column" }, ...allItems.slice(0, mid));
    const colRight = el("div", { className: "shortcut-column" }, ...allItems.slice(mid));
    
    const grid = el("div", { className: "shortcut-grid" }, colLeft);
    if (allItems.slice(mid).length > 0) {
      grid.appendChild(el("div", { className: "shortcut-separator" }));
      grid.appendChild(colRight);
    }
    
    this.gridSlot.appendChild(grid);
  }

  renderShortcut(bookmark) {
    const wrapper = el("a", { 
      className: "shortcut-item", 
      href: bookmark.url.href ?? bookmark.url,
      target: this.settings?.shortcutsOpenNewTab !== false ? "_blank" : "_self",
      rel: "noopener noreferrer",
      title: bookmark.title,
      draggable: "true",
      dataset: { id: bookmark.id.value },
    });

    wrapper.addEventListener("dragstart", (e) => {
      this.draggedBookmarkId = bookmark.id.value;
      e.dataTransfer.effectAllowed = "move";
      wrapper.classList.add("is-dragging");
    });
    
    wrapper.addEventListener("dragend", () => {
      wrapper.classList.remove("is-dragging");
      this.draggedBookmarkId = null;
      this.gridSlot.querySelectorAll(".shortcut-item").forEach(c => c.classList.remove("drop-target-left", "drop-target-right"));
    });
    
    wrapper.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!this.draggedBookmarkId || this.draggedBookmarkId === bookmark.id.value) return;
      const rect = wrapper.getBoundingClientRect();
      const isTopHalf = e.clientY < (rect.top + rect.height / 2);
      wrapper.classList.toggle("drop-target-left", isTopHalf);
      wrapper.classList.toggle("drop-target-right", !isTopHalf);
    });
    
    wrapper.addEventListener("dragleave", () => wrapper.classList.remove("drop-target-left", "drop-target-right"));
    
    wrapper.addEventListener("drop", async (e) => {
      e.preventDefault();
      wrapper.classList.remove("drop-target-left", "drop-target-right");
      if (!this.draggedBookmarkId || this.draggedBookmarkId === bookmark.id.value) return;

      const rect = wrapper.getBoundingClientRect();
      const insertAfter = e.clientY >= (rect.top + rect.height / 2);
      
      const filtered = this.bookmarks.filter(b => b.categoryId.value === this.activeCategoryId);
      const orderIds = [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                    .map(b => b.id.value)
                                    .filter(id => id !== this.draggedBookmarkId);
      
      const targetIndex = orderIds.indexOf(bookmark.id.value);
      orderIds.splice(insertAfter ? targetIndex + 1 : targetIndex, 0, this.draggedBookmarkId);
      
      try {
        await this.useCases.reorderBookmarks.execute({ orderedIds: orderIds });
        const bookmarks = await this.useCases.listBookmarks.execute();
        if (this.root) this.update(this.root, { categories: this.categories, bookmarks, settings: this.settings });
      } catch (err) {
        this.toast.show(err.message, { error: true });
      }
    });

    wrapper.addEventListener("click", async () => {
      try { await this.useCases.updateBookmark.execute({ id: bookmark.id.value, recordAccess: true }); } catch { /* ignore silently per design choice */ }
    });

    wrapper.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.showDialog({
        title: "Edit Shortcut",
        fields: [
          { id: "url", placeholder: "https://example.com", value: bookmark.url.href ?? bookmark.url },
          { id: "title", placeholder: "Name", value: bookmark.title }
        ],
        onSubmit: async (values) => {
          const url = values.url?.trim();
          const title = values.title?.trim();
          if (!url || !title) return;
          try {
            await this.useCases.updateBookmark.execute({ id: bookmark.id.value, url, title });
            const bookmarks = await this.useCases.listBookmarks.execute();
            if (this.root) this.update(this.root, { categories: this.categories, bookmarks, settings: this.settings });
          } catch (err) {
            this.toast.show(err.message, { error: true });
          }
        },
        onDelete: async () => {
          try {
            await this.useCases.deleteBookmark.execute({ id: bookmark.id.value });
            const bookmarks = await this.useCases.listBookmarks.execute();
            if (this.root) this.update(this.root, { categories: this.categories, bookmarks, settings: this.settings });
          } catch (err) {
            this.toast.show(err.message, { error: true });
          }
        }
      });
    });

    const iconWrapper = el("div", { className: "shortcut-icon" });
    const fallback = el("div", { className: "favicon-fallback" }, initial(bookmark.title));
    iconWrapper.appendChild(fallback);

    websiteFaviconUrl(bookmark.url.href ?? bookmark.url).then((src) => {
      if (!src || !fallback.isConnected) return;
      const fav = el("img", { className: "favicon-img", alt: "", loading: "lazy", src });
      fav.onerror = () => { if (fallback.isConnected) fallback.replaceWith(el("div", { className: "favicon-fallback" }, initial(bookmark.title))); };
      fallback.replaceWith(fav);
    });

    wrapper.append(iconWrapper, el("div", { className: "shortcut-label" }, bookmark.title));
    return wrapper;
  }

  renderAddShortcut() {
    const wrapper = el("button", { type: "button", className: "shortcut-item add-shortcut-btn" },
      el("div", { className: "shortcut-icon" }, icon("plus")),
      el("div", { className: "shortcut-label" }, "Add New")
    );
    wrapper.addEventListener("click", () => {
      if (!this.activeCategoryId) return this.toast.show("Please create a category first.", { error: true });
      this.showDialog({
        title: "Add Shortcut",
        fields: [{ id: "url", placeholder: "https://example.com" }, { id: "title", placeholder: "Name" }],
        onSubmit: async (values) => {
          if (!values.url?.trim() || !values.title?.trim()) return;
          try {
            await this.useCases.createBookmark.execute({ title: values.title.trim(), url: values.url.trim(), categoryId: this.activeCategoryId });
            const bookmarks = await this.useCases.listBookmarks.execute();
            if (this.root) this.update(this.root, { categories: this.categories, bookmarks, settings: this.settings });
          } catch (err) {
            this.toast.show(err.message, { error: true });
          }
        }
      });
    });
    return wrapper;
  }
}
