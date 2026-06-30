import { BookmarkRepository } from "../../../domain/repositories/repositories.js";
import { Bookmark } from "../../../domain/entities/Bookmark.js";
import { Id } from "../../../domain/valueObjects/Id.js";

const KEY = "bookmarks";

export class ChromeBookmarkRepository extends BookmarkRepository {
  #storage;
  #cache = null;

  constructor(storage) {
    super();
    this.#storage = storage;
  }

  async #load() {
    if (this.#cache) return this.#cache;
    const rows = await this.#storage.getAll(KEY);
    this.#cache = Array.isArray(rows)
      ? rows.map((r) => Bookmark.fromJSON(r))
      : [];
    return this.#cache;
  }

  async #flush() {
    await this.#storage.set(
      KEY,
      this.#cache.map((b) => b.toJSON()),
    );
  }

  invalidate() {
    this.#cache = null;
  }

  async list() {
    return [...(await this.#load())];
  }

  async findById(id) {
    const all = await this.#load();
    return all.find((b) => b.id.equals(id)) ?? null;
  }

  async save(bookmark) {
    const all = await this.#load();
    const idx = all.findIndex((b) => b.id.equals(bookmark.id));
    if (idx >= 0) all[idx] = bookmark;
    else all.push(bookmark);
    await this.#flush();
  }

  async saveAll(bookmarks) {
    await this.#load(); // ensure cache is loaded
    for (const b of bookmarks) {
      const idx = this.#cache.findIndex((cb) => cb.id.equals(b.id));
      if (idx >= 0) this.#cache[idx] = b;
      else this.#cache.push(b);
    }
    await this.#flush();
  }

  async delete(id) {
    const all = await this.#load();
    const next = all.filter((b) => !b.id.equals(id));
    this.#cache = next;
    await this.#flush();
  }

  async findByIdRaw(rawId) {
    return this.findById(new Id(rawId));
  }
}