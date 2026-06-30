import { Id } from "../../../domain/valueObjects/Id.js";

// Base class for modifying widget layout
export class BaseWidgetUseCase {
  #repo;
  #events;

  constructor({ repo, events }) {
    this.#repo = repo;
    this.#events = events;
  }

  async _modifyWidget(id, modifierFn) {
    const all = await this.#repo.list();
    const widget = all.find((w) => w.id.equals(new Id(id)));
    if (!widget) throw new Error("Widget not found");
    
    modifierFn(widget);
    
    await this.#repo.save(widget);
    this.#events.emit("layout:changed", undefined);
    return widget;
  }
}
