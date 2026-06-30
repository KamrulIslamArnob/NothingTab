import { Id } from "../../../domain/valueObjects/Id.js";

// Accepts the new ordered list of bookmark ids. The use case re-numbers
// the `order` field on every bookmark so that subsequent reads come back
// in the requested order. Anything not in `orderedIds` keeps its
// existing order, pushed to the end.
export class ReorderBookmarksUseCase {
  #repo;
  #events;

  constructor({ repo, events }) {
    this.#repo = repo;
    this.#events = events;
  }

  async execute({ orderedIds }) {
    const all = await this.#repo.list();
    const byId = new Map(all.map((b) => [b.id.value, b]));
    const seen = new Set();
    let next = 0;

    const reordered = [];
    for (const raw of orderedIds) {
      const b = byId.get(raw);
      if (!b) continue;
      seen.add(raw);
      b.reorder(next++);
      reordered.push(b);
    }
    for (const b of all) {
      if (seen.has(b.id.value)) continue;
      b.reorder(next++);
      reordered.push(b);
    }
    await this.#repo.saveAll(reordered);
    this.#events.emit("bookmarks:changed", undefined);
    return reordered;
  }
}
