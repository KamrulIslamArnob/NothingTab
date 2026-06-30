import { Id } from "../../../domain/valueObjects/Id.js";

export class DeleteTaskUseCase {
  #repo;
  #events;

  constructor({ repo, events }) {
    this.#repo = repo;
    this.#events = events;
  }

  async execute({ id }) {
    await this.#repo.delete(new Id(id));
    this.#events.emit("tasks:changed", undefined);
  }
}