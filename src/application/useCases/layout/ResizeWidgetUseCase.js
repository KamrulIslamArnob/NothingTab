import { Id } from "../../../domain/valueObjects/Id.js";

export class ResizeWidgetUseCase {
  #repo;
  #events;

  constructor({ repo, events }) {
    this.#repo = repo;
    this.#events = events;
  }

  async execute({ id, w, h }) {
    const all = await this.#repo.list();
    const widget = all.find((w2) => w2.id.equals(new Id(id)));
    if (!widget) throw new Error("Widget not found");
    widget.resizeTo(w, h);
    await this.#repo.save(widget);
    this.#events.emit("layout:changed", undefined);
    return widget;
  }
}