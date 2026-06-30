import { CategoryRepository } from "../../../domain/repositories/repositories.js";
import { Category } from "../../../domain/entities/Category.js";
import { Id } from "../../../domain/valueObjects/Id.js";

const KEY = "categories";

export class ChromeCategoryRepository extends CategoryRepository {
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
      ? rows.map((r) => Category.fromJSON(r))
      : [];
    return this.#cache;
  }

  async #flush() {
    await this.#storage.set(
      KEY,
      this.#cache.map((c) => c.toJSON()),
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
    return all.find((c) => c.id.equals(id)) ?? null;
  }

  async save(category) {
    const all = await this.#load();
    const idx = all.findIndex((c) => c.id.equals(category.id));
    if (idx >= 0) all[idx] = category;
    else all.push(category);
    await this.#flush();
  }

  async saveAll(categories) {
    await this.#load();
    for (const c of categories) {
      const idx = this.#cache.findIndex((cc) => cc.id.equals(c.id));
      if (idx >= 0) this.#cache[idx] = c;
      else this.#cache.push(c);
    }
    await this.#flush();
  }

  async delete(id) {
    const all = await this.#load();
    this.#cache = all.filter((c) => !c.id.equals(id));
    await this.#flush();
  }

  async findByIdRaw(rawId) {
    return this.findById(new Id(rawId));
  }
}