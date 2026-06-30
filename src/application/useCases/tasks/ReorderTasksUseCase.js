import { Id } from "../../../domain/valueObjects/Id.js";

// Accepts the new ordered list of task ids. The use case re-numbers
// the `order` field on every task so that subsequent reads come back
// in the requested order. Anything not in `orderedIds` keeps its
// existing order, pushed to the end.
export class ReorderTasksUseCase {
  #repo;
  #events;

  constructor({ repo, events }) {
    this.#repo = repo;
    this.#events = events;
  }

  async execute({ orderedIds }) {
    const all = await this.#repo.list();
    const byId = new Map(all.map((t) => [t.id.value, t]));
    const seen = new Set();
    let next = 0;

    const reordered = [];
    for (const raw of orderedIds) {
      const t = byId.get(raw);
      if (!t) continue;
      seen.add(raw);
      t.reorder(next++);
      reordered.push(t);
    }
    for (const t of all) {
      if (seen.has(t.id.value)) continue;
      t.reorder(next++);
      reordered.push(t);
    }
    await this.#repo.saveAll(reordered);
    this.#events.emit("tasks:changed", undefined);
    return reordered;
  }
}