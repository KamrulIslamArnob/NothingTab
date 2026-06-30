import { Id } from "../../../domain/valueObjects/Id.js";

export class DeleteBookmarkUseCase {
  #bookmarkRepo;
  #events;

  constructor({ bookmarkRepo, events }) {
    this.#bookmarkRepo = bookmarkRepo;
    this.#events = events;
  }

  async execute({ id }) {
    await this.#bookmarkRepo.delete(new Id(id));
    this.#events.emit("bookmarks:changed", undefined);
  }
}