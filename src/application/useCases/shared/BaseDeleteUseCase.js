import { Id } from "../../../domain/valueObjects/Id.js";

// Base class for deleting domain entities
export class BaseDeleteUseCase {
  #repo;
  #events;
  #eventName;

  constructor(repo, events, eventName) {
    this.#repo = repo;
    this.#events = events;
    this.#eventName = eventName;
  }

  async execute({ id }) {
    await this.#repo.delete(new Id(id));
    this.#events.emit(this.#eventName, undefined);
  }
}
