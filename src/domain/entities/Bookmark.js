import { Id } from "../valueObjects/Id.js";
import { Url } from "../valueObjects/Url.js";

// Domain entity: Bookmark
// Mutable aggregate with controlled mutation methods so invariants
// (title length, valid Url) are always preserved.
export class Bookmark {
  #id;
  #title;
  #url;
  #categoryId;
  #order;
  #lastAccessed; // timestamp ms or null
  #accessCount;  // number

  constructor({ id, title, url, categoryId, order = 0, lastAccessed = null, accessCount = 0 }) {
    if (!(id instanceof Id)) throw new Error("Bookmark id must be an Id");
    if (!(url instanceof Url)) throw new Error("Bookmark url must be a Url");
    if (!(categoryId instanceof Id))
      throw new Error("Bookmark categoryId must be an Id");
    if (typeof title !== "string" || title.trim().length === 0) {
      throw new Error("Bookmark title must be a non-empty string");
    }
    if (title.length > 120) {
      throw new Error("Bookmark title must be <= 120 chars");
    }
    if (!Number.isInteger(order) || order < 0) {
      throw new Error("Bookmark order must be a non-negative integer");
    }

    this.#id = id;
    this.#title = title.trim();
    this.#url = url;
    this.#categoryId = categoryId;
    this.#order = order;
    this.#lastAccessed = lastAccessed;
    this.#accessCount = typeof accessCount === "number" ? accessCount : 0;
  }

  get id() { return this.#id; }
  get title() { return this.#title; }
  get url() { return this.#url; }
  get categoryId() { return this.#categoryId; }
  get order() { return this.#order; }
  get lastAccessed() { return this.#lastAccessed; }
  get accessCount() { return this.#accessCount; }

  recordAccess() {
    this.#lastAccessed = Date.now();
    this.#accessCount += 1;
  }

  rename(newTitle) {
    if (typeof newTitle !== "string" || newTitle.trim().length === 0) {
      throw new Error("Bookmark title must be a non-empty string");
    }
    if (newTitle.length > 120) {
      throw new Error("Bookmark title must be <= 120 chars");
    }
    this.#title = newTitle.trim();
  }

  retarget(newUrl) {
    if (!(newUrl instanceof Url)) {
      throw new Error("Bookmark url must be a Url");
    }
    this.#url = newUrl;
  }

  moveTo(newCategoryId) {
    if (!(newCategoryId instanceof Id)) {
      throw new Error("Bookmark categoryId must be an Id");
    }
    this.#categoryId = newCategoryId;
  }

  reorder(newOrder) {
    if (!Number.isInteger(newOrder) || newOrder < 0) {
      throw new Error("Bookmark order must be a non-negative integer");
    }
    this.#order = newOrder;
  }

  toJSON() {
    return {
      id: this.#id.value,
      title: this.#title,
      url: this.#url.href,
      categoryId: this.#categoryId.value,
      order: this.#order,
      lastAccessed: this.#lastAccessed,
      accessCount: this.#accessCount,
    };
  }

  static fromJSON(json) {
    return new Bookmark({
      id: new Id(json.id),
      title: json.title,
      url: new Url(json.url),
      categoryId: new Id(json.categoryId),
      order: Number.isInteger(json.order) ? json.order : 0,
      lastAccessed: json.lastAccessed ?? null,
      accessCount: typeof json.accessCount === "number" ? json.accessCount : 0,
    });
  }
}
