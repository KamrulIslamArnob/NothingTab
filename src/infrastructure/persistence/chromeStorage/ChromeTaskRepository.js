import { TaskRepository } from "../../../domain/repositories/repositories.js";
import { Task } from "../../../domain/entities/Task.js";
import { Id } from "../../../domain/valueObjects/Id.js";

const KEY = "tasks";

export class ChromeTaskRepository extends TaskRepository {
  #storage;
  #cache = null;

  constructor(storage) {
    super();
    this.#storage = storage;
  }

  async #load() {
    if (this.#cache) return this.#cache;
    const rows = await this.#storage.getAll(KEY);
    this.#cache = Array.isArray(rows) ? rows.map((r) => Task.fromJSON(r)) : [];
    return this.#cache;
  }

  async #flush() {
    await this.#storage.set(
      KEY,
      this.#cache.map((t) => t.toJSON()),
    );
  }

  invalidate() {
    this.#cache = null;
  }

  async list() {
    return [...(await this.#load())];
  }

  async save(task) {
    const all = await this.#load();
    const idx = all.findIndex((t) => t.id.equals(task.id));
    if (idx >= 0) all[idx] = task;
    else all.push(task);
    await this.#flush();
  }

  async saveAll(tasks) {
    this.#cache = [...tasks];
    await this.#flush();
  }

  async delete(id) {
    const all = await this.#load();
    this.#cache = all.filter((t) => !t.id.equals(id));
    await this.#flush();
  }
}