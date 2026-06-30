import { Id } from "../../../domain/valueObjects/Id.js";

export class MoveWidgetUseCase {
  #repo;
  #events;

  constructor({ repo, events }) {
    this.#repo = repo;
    this.#events = events;
  }

  async execute({ id, x, y }) {
    const all = await this.#repo.list();
    const widget = all.find((w) => w.id.equals(new Id(id)));
    if (!widget) throw new Error("Widget not found");
    widget.moveTo(x, y);
    await this.#repo.save(widget);
    this.#events.emit("layout:changed", undefined);
    return widget;
  }
}