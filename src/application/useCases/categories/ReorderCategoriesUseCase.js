import { Id } from "../../../domain/valueObjects/Id.js";

// Accepts the new ordered list of category ids. The use case re-numbers
// the `order` field on every category so that subsequent reads come back
// in the requested order. Anything not in `orderedIds` keeps its
// existing order, pushed to the end.
export class ReorderCategoriesUseCase {
  #repo;
  #events;

  constructor({ repo, events }) {
    this.#repo = repo;
    this.#events = events;
  }

  async execute({ orderedIds }) {
    const all = await this.#repo.list();
    const byId = new Map(all.map((c) => [c.id.value, c]));
    const seen = new Set();
    let next = 0;

    const reordered = [];
    for (const raw of orderedIds) {
      const c = byId.get(raw);
      if (!c) continue;
      seen.add(raw);
      c.reorder(next++);
      reordered.push(c);
    }
    for (const c of all) {
      if (seen.has(c.id.value)) continue;
      c.reorder(next++);
      reordered.push(c);
    }
    await this.#repo.saveAll(reordered);
    this.#events.emit("categories:changed", undefined);
    return reordered;
  }
}
