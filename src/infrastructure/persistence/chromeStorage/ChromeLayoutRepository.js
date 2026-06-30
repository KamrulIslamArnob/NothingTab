import { LayoutRepository } from "../../../domain/repositories/repositories.js";
import { WidgetLayout } from "../../../domain/entities/WidgetLayout.js";

const KEY = "layout";

export class ChromeLayoutRepository extends LayoutRepository {
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
      ? rows.map((r) => WidgetLayout.fromJSON(r))
      : [];
    return this.#cache;
  }

  async #flush() {
    await this.#storage.set(
      KEY,
      this.#cache.map((w) => w.toJSON()),
    );
  }

  invalidate() {
    this.#cache = null;
  }

  async list() {
    return [...(await this.#load())];
  }

  async save(widget) {
    const all = await this.#load();
    const idx = all.findIndex((w) => w.id.equals(widget.id));
    if (idx >= 0) all[idx] = widget;
    else all.push(widget);
    await this.#flush();
  }

  async saveAll(widgets) {
    this.#cache = [...widgets];
    await this.#flush();
  }
}
