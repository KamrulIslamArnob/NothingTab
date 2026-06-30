import { Id } from "../../../domain/valueObjects/Id.js";

export class DeleteCategoryUseCase {
  #categoryRepo;
  #bookmarkRepo;
  #events;

  constructor({ categoryRepo, bookmarkRepo, events }) {
    this.#categoryRepo = categoryRepo;
    this.#bookmarkRepo = bookmarkRepo;
    this.#events = events;
  }

  async execute({ id }) {
    const categoryId = new Id(id);
    const bookmarks = await this.#bookmarkRepo.list();
    const orphans = bookmarks.filter((b) => b.categoryId.equals(categoryId));
    for (const orphan of orphans) {
      await this.#bookmarkRepo.delete(orphan.id);
    }
    if (orphans.length > 0) {
      this.#events.emit("bookmarks:changed", undefined);
    }
    
    await this.#categoryRepo.delete(categoryId);
    this.#events.emit("categories:changed", undefined);
  }
}